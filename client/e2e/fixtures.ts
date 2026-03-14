import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { test as base, expect } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, '..');

/**
 * When E2E_COVERAGE=1, collect window.__coverage__ after each test and write to client/.nyc_output
 * so globalTeardown can merge and generate the HTML report.
 */
const collectCoverage = process.env.E2E_COVERAGE === '1' || process.env.E2E_COVERAGE === 'true';

export const test = collectCoverage
  ? base.extend({
      page: async ({ page }, use, testInfo) => {
        await use(page);
        try {
          const coverage = await page.evaluate(() =>
            (window as unknown as { __coverage__?: unknown }).__coverage__
          );
          if (coverage && typeof coverage === 'object') {
            const outDir = path.join(clientDir, '.nyc_output');
            fs.mkdirSync(outDir, { recursive: true });
            const safeId = `${testInfo.workerIndex}-${testInfo.testId.replace(/[/\\]/g, '_')}`;
            fs.writeFileSync(
              path.join(outDir, `e2e-${safeId}.json`),
              JSON.stringify(coverage)
            );
          }
        } catch {
          // ignore
        }
      },
    })
  : base;

export { expect };
