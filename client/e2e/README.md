# E2E tests and authenticated flows

Tests that need a logged-in user use `E2E_LOGIN_EMAIL` and `E2E_LOGIN_PASSWORD`. If these are not set, those tests are **skipped** (e.g. successful login, profile when authenticated, favorites when authenticated).

## Verifying that auth e2e tests run

- **Without credentials:** Auth tests that require a real user are skipped. You’ll see something like:
  ```bash
  cd client && npm run e2e
  # ... 1 skipped (or 3 skipped if profile + favorites are included)
  ```
- **With credentials:** The same tests run instead of being skipped. From the **client** folder:
  ```bash
  E2E_LOGIN_EMAIL=your@email.com E2E_LOGIN_PASSWORD=yourpass npm run e2e
  ```
  In the output you should see **0 skipped** and these tests listed as run (not skipped):
  - `Auth › successful login redirects to profile when backend and test user exist`
  - `Profile › profile page shows content when authenticated` (if env set)
  - `Favorites › favorites page shows empty state or list when authenticated` (if env set)

To run **only** the auth e2e suite and confirm the “successful login” test runs:
  ```bash
  cd client
  E2E_LOGIN_EMAIL=e2e@example.com E2E_LOGIN_PASSWORD=e2e-test-password npx playwright test e2e/auth.spec.ts
  ```
  With valid credentials you should see **4 passed** (all four auth tests). With no env vars you’ll see **3 passed, 1 skipped**.

## Backend must be running

Auth-related e2e tests (login, profile, favorites when authenticated) call the real backend. The client in dev talks to **http://localhost:4000/api**. If the backend is not running, you’ll see **"Connection problem"** and tests will fail or skip.

**Before running e2e:** start the backend in another terminal:
```bash
cd backend && npm run dev
```
Then from the client: `npm run e2e`.

## E2E code coverage

To collect **code coverage** from the app while E2E tests run (which code paths were hit in the browser):

```bash
cd client
npm run e2e:coverage
```

This starts the dev server with Istanbul instrumentation (`VITE_COVERAGE=1`), runs all E2E tests, and after the run merges coverage and generates an HTML report.

**Where to see the report:** open **`client/coverage-e2e/index.html`** in a browser (file path: `client/coverage-e2e/index.html` from the project root). The console will also print: `E2E coverage report: open client/coverage-e2e/index.html`.

- Coverage is **slower** (instrumented build + single worker). Use `npm run e2e` for fast runs without coverage.
- Backend must be running for auth tests, same as normal e2e.

### "Connection problem" but backend is running?

The app runs on **port 3000** (Vite). The browser sends `Origin: http://localhost:3000` when calling the API. If the backend’s **CORS** doesn’t allow that origin, the request is blocked and the app shows "Connection problem."

In the **backend** `.env`, set:
```bash
CORS_ORIGIN=http://localhost:3000
```
If you use a comma-separated list, include `http://localhost:3000`. The default in code is already `http://localhost:3000`; if you override it (e.g. with `http://localhost:5173`), e2e will fail until you add or use `http://localhost:3000`.

---

## Option A: Use your normal (dev) database (simplest)

When you run the backend with `npm run dev`, it uses your normal DB.

1. **Create a user** in the app (Register) or use one that already exists.
2. **Run e2e with that user:**
   - **Recommended (works on Windows too):** Create **client/.env.e2e** (gitignored). Copy from **client/.env.e2e.example** and set your credentials. Then run:
     ```bash
     cd client
     npm run e2e
     ```
     Playwright loads `.env.e2e` automatically, so auth tests will receive the credentials.
   - On Unix you can also set env in the shell:
     ```bash
     E2E_LOGIN_EMAIL=your@email.com E2E_LOGIN_PASSWORD=yourpass npm run e2e
     ```
     (On Windows this often does not pass the variables to npm; use `.env.e2e` instead.)
3. Start **backend** (`npm run dev` in backend) and **client** (or let Playwright start it), then run `npm run e2e` from client.

**Pros:** No extra setup.  
**Cons:** E2E runs against dev data; tests may change that user’s state (favorites, etc.).

---

## Option B: Use a dedicated test database and seeded e2e user

Use a separate DB for e2e so dev data stays untouched.

1. **Create a test DB** (e.g. `bridal_beyond_e2e`) and in the **backend** copy `.env` to `.env.e2e` and set `DATABASE_URL` to that DB (or reuse `.env.test`).
2. **Run migrations** on that DB:
   ```bash
   cd backend
   npx dotenv-cli -e .env.e2e -- prisma migrate deploy
   ```
3. **Create the e2e user** (one-time, from **backend** folder):
   ```bash
   cd backend
   npx dotenv-cli -e .env.e2e -- npm run seed:e2e
   ```
   If you use `.env.test` for the test DB instead, run:  
   `npx dotenv-cli -e .env.test -- npm run seed:e2e`  
   This creates (or updates) `e2e@example.com` / `e2e-test-password` with email verified so login works.
4. **Start the backend against the test DB** (from **backend**):
   ```bash
   cd backend
   npx dotenv-cli -e .env.e2e -- npm run dev
   ```
   (Optional: add to backend `package.json`: `"dev:e2e": "dotenv-cli -e .env.e2e -- npm run dev"` and run `npm run dev:e2e`.)
5. **Run Playwright** with the same credentials:
   - In **client** `.env.e2e`:
     ```
     E2E_LOGIN_EMAIL=e2e@example.com
     E2E_LOGIN_PASSWORD=e2e-test-password
     ```
   - Then from client: `npm run e2e`.

**Pros:** Isolated from dev; you can reset the test DB when needed.  
**Cons:** Extra setup (test DB, env, and running backend with e2e config).

---

## Summary

| You run backend with | Use |
|----------------------|-----|
| `npm run dev` (normal DB) | Option A: any existing user; set `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` in client `.env.e2e` or shell. |
| Test DB (e.g. `dotenv -e .env.e2e -- npm run dev`) | Option B: run `npm run seed:e2e` once, then use `e2e@example.com` / `e2e-test-password` in client `.env.e2e`. |

Keep credentials out of the repo: use the shell or a local **client/.env.e2e** (already in `.gitignore`) with dotenv-cli when running e2e.
