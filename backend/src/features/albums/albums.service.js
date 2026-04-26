const pool = require('../../db/pool');
const ApiError = require('../../utils/ApiError');

const listAlbums = async ({ page, limit }) => {
  const offset = (page - 1) * limit;

  const rowsPromise = pool.query(
    `
    SELECT
      a.id,
      a.title,
      a.description,
      a.cover_image_id,
      a.created_at,
      a.updated_at,
      COUNT(i.id)::INT AS image_count
    FROM albums a
    LEFT JOIN images i ON i.album_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  const countPromise = pool.query('SELECT COUNT(*)::INT AS total FROM albums');

  const [rowsResult, countResult] = await Promise.all([rowsPromise, countPromise]);

  return {
    items: rowsResult.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total
    }
  };
};

const getAlbumById = async (albumId) => {
  const result = await pool.query(
    `
    SELECT a.id, a.title, a.description, a.cover_image_id, a.created_at, a.updated_at,
      COUNT(i.id)::INT AS image_count
    FROM albums a
    LEFT JOIN images i ON i.album_id = a.id
    WHERE a.id = $1
    GROUP BY a.id
    LIMIT 1
    `,
    [albumId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Album not found');
  }

  return result.rows[0];
};

const createAlbum = async ({ title, description }) => {
  const result = await pool.query(
    `
    INSERT INTO albums (title, description)
    VALUES ($1, $2)
    RETURNING id, title, description, cover_image_id, created_at, updated_at
    `,
    [title, description || null]
  );

  return result.rows[0];
};

const updateAlbum = async (albumId, payload) => {
  const current = await getAlbumById(albumId);

  const title = payload.title ?? current.title;
  const description = payload.description ?? current.description;

  const result = await pool.query(
    `
    UPDATE albums
    SET title = $1,
        description = $2,
        updated_at = NOW()
    WHERE id = $3
    RETURNING id, title, description, cover_image_id, created_at, updated_at
    `,
    [title, description, albumId]
  );

  return result.rows[0];
};

const deleteAlbum = async (albumId) => {
  const result = await pool.query('DELETE FROM albums WHERE id = $1 RETURNING id', [albumId]);

  if (result.rowCount === 0) {
    throw new ApiError(404, 'Album not found');
  }

  return { id: result.rows[0].id };
};

module.exports = {
  listAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum
};
