# UOBDEVS

Production-ready refactor of the UOBDEVS website into a full-stack architecture.

## Final Structure

```text
/UOBDEVS
  /frontend
  /backend
  README.md
```

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Image storage: PostgreSQL BYTEA

## Why This Refactor

The old implementation was static and local-file based:

- image files stored directly in frontend folders
- manual `manifest.json` edits
- no admin login
- no backend management
- unstable behavior with large albums

The new system introduces secure admin workflows, scalable storage, and performance-safe image delivery.

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed:admin
npm run dev
```

Optional legacy content import from old local image folders:

```bash
npm run import:legacy
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Production Build

Frontend:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
npm start
```

## Deployment Guidance

### Frontend deployment

- Build frontend (`npm run build`)
- Deploy generated `frontend/dist` on a static host (Netlify, Vercel, Nginx, etc.)
- Set `VITE_API_BASE_URL` to your backend URL before build

### Backend deployment

- Deploy backend on a Node host (Render, Railway, Azure App Service, VPS, etc.)
- Set secure environment variables on host
- Use managed PostgreSQL in production
- Run migrations in deployment pipeline before app start

## Security Notes

- Passwords are hashed with bcrypt
- JWT secret must be strong and private
- CORS restricted by env allowlist
- Helmet security headers enabled
- Login and API rate limits enabled
- Admin routes protected by auth middleware
- Uploads restricted by MIME type and size
- SQL queries are parameterized

## Core API Routes

Public:

- `GET /api/albums`
- `GET /api/albums/:albumId`
- `GET /api/albums/:albumId/images?page=1&limit=20`
- `GET /api/images/:imageId/thumbnail`
- `GET /api/images/:imageId/display`
- `GET /api/images/:imageId/original`

Admin:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/admin/albums`
- `PUT /api/admin/albums/:albumId`
- `DELETE /api/admin/albums/:albumId`
- `POST /api/admin/albums/:albumId/images`
- `DELETE /api/admin/images/:imageId`

## Admin Image Deletion Behavior

- Admin dashboard album view includes delete button for each image
- Confirmation dialog appears before deletion
- Protected backend endpoint deletes image record + binary data
- UI removes deleted image immediately without full page reload
