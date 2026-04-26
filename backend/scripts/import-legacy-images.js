const fs = require('fs');
const path = require('path');

const pool = require('../src/db/pool');
const { processImage } = require('../src/utils/imageProcessor');

const rootDir = path.join(__dirname, '..', '..');
const albumsJsonPath = path.join(rootDir, 'images', 'albums.json');

const fileExists = (filePath) => {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const mimeTypeFromName = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

async function ensureAlbum(client, title) {
  const result = await client.query(
    `
    INSERT INTO albums (title, description)
    VALUES ($1, $2)
    ON CONFLICT (title)
    DO UPDATE SET updated_at = NOW()
    RETURNING id
    `,
    [title, 'Imported from legacy static gallery']
  );

  return result.rows[0].id;
}

async function run() {
  if (!fileExists(albumsJsonPath)) {
    throw new Error(`Legacy albums.json not found at ${albumsJsonPath}`);
  }

  const albums = JSON.parse(fs.readFileSync(albumsJsonPath, 'utf8'));
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const album of albums) {
      const albumId = await ensureAlbum(client, album.name);
      const manifestPath = path.join(rootDir, album.folder, 'manifest.json');

      if (!fileExists(manifestPath)) {
        console.warn(`Skipping album ${album.name}: manifest not found`);
        continue;
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      for (const entry of manifest) {
        const relativePath = entry.startsWith('images/') ? entry : `${album.folder}/${entry}`;
        const fullPath = path.join(rootDir, relativePath);

        if (!fileExists(fullPath)) {
          console.warn(`Missing file, skipping: ${relativePath}`);
          continue;
        }

        const originalFilename = path.basename(fullPath);

        const alreadyExists = await client.query(
          'SELECT id FROM images WHERE album_id = $1 AND original_filename = $2 LIMIT 1',
          [albumId, originalFilename]
        );

        if (alreadyExists.rowCount > 0) {
          continue;
        }

        const buffer = fs.readFileSync(fullPath);
        const stats = fs.statSync(fullPath);
        const processed = await processImage(buffer);

        const inserted = await client.query(
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
          RETURNING id
          `,
          [
            albumId,
            originalFilename,
            mimeTypeFromName(originalFilename),
            stats.size,
            processed.width,
            processed.height,
            processed.thumbnailMimeType,
            processed.thumbnailBuffer,
            processed.displayMimeType,
            processed.displayBuffer,
            buffer
          ]
        );

        await client.query(
          'UPDATE albums SET cover_image_id = COALESCE(cover_image_id, $1), updated_at = NOW() WHERE id = $2',
          [inserted.rows[0].id, albumId]
        );
      }

      console.log(`Imported album: ${album.name}`);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error('Legacy import failed:', error);
  process.exit(1);
});
