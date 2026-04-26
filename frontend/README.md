# UOBDEVS Frontend

React frontend for public gallery and admin dashboard.

## Features

- Public album browsing with thumbnail-first rendering
- Infinite scrolling + lazy-loaded images
- Lightbox uses display-size image route
- Admin login and protected routes
- Admin album CRUD
- Admin image upload/delete with confirmation

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy env file

```bash
cp .env.example .env
```

3. Update `VITE_API_BASE_URL`

4. Start development server

```bash
npm run dev
```

5. Build for production

```bash
npm run build
```
