# Bridal Beyond API

Node.js + Express + TypeScript backend with JWT auth and Postgres.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `JWT_SECRET`, etc.
2. Create the database: `createdb bridal_beyond` (or equivalent).
3. Run migrations: `npm run migrate`
4. Start dev server: `npm run dev`

Server runs at `http://localhost:4000`. API base is `http://localhost:4000/api`.

- Health: `GET /api/health`
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `GET /api/docs-json`

## Frontend

Set `VITE_API_URL=http://localhost:4000/api` in the frontend `.env` (or rely on the default in `src/api/axios.ts`).
