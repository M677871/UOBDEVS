WITH ranked AS (
  SELECT
    id,
    album_id,
    original_filename,
    ROW_NUMBER() OVER (
      PARTITION BY album_id, original_filename
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM images
)
DELETE FROM images i
USING ranked r
WHERE i.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_images_album_filename
ON images(album_id, original_filename);
