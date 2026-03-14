import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Client directory (where playwright.config and package.json live). */
const clientDir = path.resolve(__dirname, '..');

/**
 * Runs only when E2E_COVERAGE=1. Merges all .nyc_output/e2e-*.json into one and generates
 * the HTML report in coverage-e2e/. Uses clientDir so the report is always under client/.
 */
async function globalTeardown() {
  if (process.env.E2E_COVERAGE !== '1' && process.env.E2E_COVERAGE !== 'true') {
    return;
  }
  const nycOutput = path.join(clientDir, '.nyc_output');
  const reportDir = path.join(clientDir, 'coverage-e2e');

  if (!fs.existsSync(nycOutput)) {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, 'index.html'),
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>E2E coverage</title></head><body><h1>No coverage data</h1><p>No coverage was collected. Ensure you ran <code>npm run e2e:coverage</code> from the client folder and that the dev server started with <code>VITE_COVERAGE=1</code>.</p></body></html>`
    );
    console.log('\nE2E coverage: no data collected. Report placeholder: ' + reportDir + path.sep + 'index.html');
    return;
  }

  const files = fs.readdirSync(nycOutput).filter((f) => f.startsWith('e2e-') && f.endsWith('.json'));
  if (files.length === 0) {
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, 'index.html'),
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>E2E coverage</title></head><body><h1>No coverage data</h1><p>No e2e-*.json files in .nyc_output. The instrumented app may not have set window.__coverage__ (check that VITE_COVERAGE=1 was used for the dev server).</p></body></html>`
    );
    console.log('\nE2E coverage: no coverage files. Placeholder: ' + reportDir + path.sep + 'index.html');
    return;
  }

  const mergedPath = path.join(nycOutput, 'coverage.json');
  try {
    execSync(`npx nyc merge "${nycOutput}" "${mergedPath}"`, {
      cwd: clientDir,
      stdio: 'inherit',
    });
    for (const f of files) {
      fs.unlinkSync(path.join(nycOutput, f));
    }
    execSync(`npx nyc report --reporter=html --report-dir=coverage-e2e --temp-dir=.nyc_output`, {
      cwd: clientDir,
      stdio: 'inherit',
    });
    console.log('\nE2E coverage report: ' + path.join(reportDir, 'index.html'));
  } catch (e) {
    console.error('E2E coverage merge/report failed:', e);
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.join(reportDir, 'index.html'),
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>E2E coverage</title></head><body><h1>Report failed</h1><p>nyc merge or report failed. Check the terminal for errors.</p></body></html>`
    );
    console.log('Placeholder written to: ' + path.join(reportDir, 'index.html'));
  }
}

export default globalTeardown;
