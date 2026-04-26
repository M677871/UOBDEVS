const pool = require('../../db/pool');
const ApiError = require('../../utils/ApiError');
const { processImage } = require('../../utils/imageProcessor');

const buildImageUrls = (imageId) => ({
  thumbnailUrl: `/api/images/${imageId}/thumbnail`,
  displayUrl: `/api/images/${imageId}/display`,
  originalUrl: `/api/images/${imageId}/original`
});

const listImagesByAlbum = async (albumId, { page, limit }) => {
  const offset = (page - 1) * limit;

  const albumCheck = await pool.query('SELECT id FROM albums WHERE id = $1 LIMIT 1', [albumId]);
  if (albumCheck.rowCount === 0) {
    throw new ApiError(404, 'Album not found');
  }

  const rowsPromise = pool.query(
    `
    SELECT id, album_id, original_filename, file_size, width, height, created_at
    FROM images
    WHERE album_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
    `,
    [albumId, limit, offset]
  );

  const countPromise = pool.query(
    'SELECT COUNT(*)::INT AS total FROM images WHERE album_id = $1',
    [albumId]
  );

  const [rowsResult, countResult] = await Promise.all([rowsPromise, countPromise]);

  const items = rowsResult.rows.map((row) => ({
    ...row,
    ...buildImageUrls(row.id)
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total
    }
  };
};

const uploadImages = async (albumId, files) => {
  const albumCheck = await pool.query('SELECT id, cover_image_id FROM albums WHERE id = $1 LIMIT 1', [albumId]);
  if (albumCheck.rowCount === 0) {
    throw new ApiError(404, 'Album not found');
  }

  const inserted = [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const file of files) {
      const processed = await processImage(file.buffer);

      const result = await client.query(
        `
        INSERT INTO images (
          album_id,
          original_filename,
          original_mime_type,
          file_size,
          width,
          height,
          thumbnail_mime_type,
          thumbnail_data,
          display_mime_type,
          display_data,
          original_data
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, album_id, original_filename, file_size, width, height, created_at
        `,
        [
          albumId,
          file.originalname,
          file.mimetype,
          file.size,
          processed.width,
          processed.height,
          processed.thumbnailMimeType,
          processed.thumbnailBuffer,
          processed.displayMimeType,
          processed.displayBuffer,
          file.buffer
        ]
      );

      inserted.push({
        ...result.rows[0],
        ...buildImageUrls(result.rows[0].id)
      });
    }

    if (!albumCheck.rows[0].cover_image_id && inserted.length > 0) {
      await client.query('UPDATE albums SET cover_image_id = $1, updated_at = NOW() WHERE id = $2', [inserted[0].id, albumId]);
    }

    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const deleteImage = async (imageId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const imageResult = await client.query(
      'SELECT id, album_id FROM images WHERE id = $1 LIMIT 1',
      [imageId]
    );

    if (imageResult.rowCount === 0) {
      throw new ApiError(404, 'Image not found');
    }

    await client.query('DELETE FROM images WHERE id = $1', [imageId]);

    await client.query(
      `
      UPDATE albums
      SET cover_image_id = (
        SELECT i.id
        FROM images i
        WHERE i.album_id = $1
        ORDER BY i.created_at DESC
        LIMIT 1
      ),
      updated_at = NOW()
      WHERE id = $1 AND cover_image_id = $2
      `,
      [imageResult.rows[0].album_id, imageId]
    );

    await client.query('COMMIT');

    return {
      id: imageId,
      albumId: imageResult.rows[0].album_id
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getImageVariant = async (imageId, variant) => {
  const map = {
    thumbnail: {
      dataCol: 'thumbnail_data',
      mimeCol: 'thumbnail_mime_type'
    },
    display: {
      dataCol: 'display_data',
      mimeCol: 'display_mime_type'
    },
    original: {
      dataCol: 'original_data',
      mimeCol: 'original_mime_type'
    }
  };

  const selected = map[variant];
  if (!selected) {
    throw new ApiError(400, 'Invalid image variant');
  }

  const result = await pool.query(
    `
    SELECT ${selected.dataCol} AS data, ${selected.mimeCol} AS mime_type, updated_at
    FROM images
    WHERE id = $1
    LIMIT 1
    `,
    [imageId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Image not found');
  }

  return {
    buffer: result.rows[0].data,
    mimeType: result.rows[0].mime_type,
    updatedAt: result.rows[0].updated_at
  };
};

module.exports = {
  listImagesByAlbum,
  uploadImages,
  deleteImage,
  getImageVariant
};
