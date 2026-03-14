# Bridal Beyond

Full-stack app: React (Vite) + Redux frontend, Node/Express + Prisma (PostgreSQL) backend, Stripe, Socket.IO.

## Development

- **Backend**: `cd backend && npm install && npm run dev` (see [backend/README.md](backend/README.md))
- **Client**: `cd client && npm install && npm run dev`

## Testing

- **Client unit tests**: `cd client && npm test` (Vitest)
- **Backend unit tests**: `cd backend && npm test` (Jest). Integration tests require a test DB; see [backend/README.md](backend/README.md#testing).
- **E2E**: From `client`, run `npm run e2e` (Playwright). Start the **backend** first (`cd backend && npm run dev`). The e2e run will start the client via Playwright’s webServer. For the full login flow, seed a test user and set `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD` in the environment. Install browsers once: `cd client && npx playwright install`.
