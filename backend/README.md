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

## Testing

- **Unit tests**: `npm test` (Jest). No DB required for unit tests; they mock external deps.
- **Integration tests**: Same command; they hit the API with Supertest and require a **test database** with the same schema as production:
  1. Copy `.env.test.example` to `.env.test` and set `DATABASE_URL` to a dedicated test DB (e.g. `bridal_beyond_test`).
  2. Apply **all** migrations to the test DB so its schema matches the Prisma schema (e.g. `npx prisma migrate deploy` with `DATABASE_URL` from `.env.test`, or point `DATABASE_URL` at a DB that already has migrations applied). If the test DB is missing columns (e.g. `orders.guest_email`), register-related integration tests will be skipped.
  3. Run all tests: `npm test`. To run only integration tests: `npm test -- --testPathPattern=integration`.

Integration tests mock the background job, Stripe, and mail so no real external calls are made.

## Frontend

Set `VITE_API_URL=http://localhost:4000/api` in the frontend `.env` (or rely on the default in `src/api/axios.ts`).
