import { Page } from '@playwright/test';

/** Backend API base the app uses in dev (must match apiBase.ts). */
const DEV_API_BASE = 'http://localhost:4000/api';

/**
 * Set app locale to English so selectors match en.json.
 * Call in beforeEach so every test runs with the same UI strings.
 * We load base then set localStorage so the app's i18n reads it on next navigation.
 */
export async function setAppLocaleEn(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('gracia_lang', 'en');
  });
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('gracia_lang', 'en'));
}

/**
 * From the browser context, fetch the backend health endpoint.
 * If this fails, the app's login will also fail with "Connection problem" (often CORS).
 */
export async function canReachBackend(page: Page): Promise<{ ok: boolean; message?: string }> {
  return page.evaluate(async (apiBase: string) => {
    try {
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) return { ok: true };
      return { ok: false, message: `Health returned ${res.status}` };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, message: msg || 'fetch failed' };
    }
  }, DEV_API_BASE);
}
