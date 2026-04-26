DELETE FROM albums a
USING albums b
WHERE a.title = b.title
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS uq_albums_title ON albums(title);
