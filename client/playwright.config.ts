import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';

// Load E2E credentials from client/.env.e2e (works on Windows; VAR=value npm run e2e often doesn't)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envE2ePath = path.join(__dirname, '.env.e2e');
if (fs.existsSync(envE2ePath)) {
  const content = fs.readFileSync(envE2ePath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    }
  }
}

const e2eCoverage = process.env.E2E_COVERAGE === '1' || process.env.E2E_COVERAGE === 'true';

/**
 * E2E tests for the client. Vite dev server runs on port 3000 (see vite.config.ts).
 * Start the backend (npm run dev in backend) then from client: npm run e2e
 * For auth tests: set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD in client/.env.e2e (or in shell on Unix).
 * For coverage: npm run e2e:coverage then open coverage-e2e/index.html
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: !e2eCoverage,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : e2eCoverage ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  timeout: 30000,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  globalTeardown: './e2e/globalTeardown.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI && !e2eCoverage,
    timeout: 120000,
    env: e2eCoverage ? { ...process.env, VITE_COVERAGE: '1' } : undefined,
  },
});
