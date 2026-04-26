# UOBDEVS Backend

Express + PostgreSQL backend for the UOBDEVS website.

## Features

- Admin authentication with JWT + bcrypt hashed passwords
- Public album and image browsing endpoints
- Admin album management (create/update/delete)
- Admin image upload and deletion
- Images stored in PostgreSQL (`BYTEA`) with metadata
- Generated image variants:
  - thumbnail (`webp`)
  - display (`webp`)
  - original (original mime)
- Pagination for image-heavy albums
- Secure defaults: Helmet, CORS allowlist, rate limiting, validation

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env
```

3. Update `.env` values (especially `DATABASE_URL` and `JWT_SECRET`)

4. Run migrations

```bash
npm run migrate
```

5. Seed first admin

```bash
npm run seed:admin
```

6. Start API

```bash
npm run dev
```

## Legacy Content Import

To import current local image folders + manifests into PostgreSQL:

```bash
npm run import:legacy
```

This reads root `images/albums.json` and each album `manifest.json`, then stores all image binaries + metadata in PostgreSQL.

## API Examples

### Public

- `GET /api/albums?page=1&limit=20`
- `GET /api/albums/:albumId`
- `GET /api/albums/:albumId/images?page=1&limit=20`
- `GET /api/images/:imageId/thumbnail`
- `GET /api/images/:imageId/display`
- `GET /api/images/:imageId/original`

### Admin

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/admin/albums`
- `PUT /api/admin/albums/:albumId`
- `DELETE /api/admin/albums/:albumId`
- `POST /api/admin/albums/:albumId/images`
- `DELETE /api/admin/images/:imageId`

## Notes

- Upload field name: `images` (multipart/form-data)
- Allowed types: jpg, jpeg, png, webp
- Max upload file size is controlled by `UPLOAD_MAX_FILE_SIZE_MB`
