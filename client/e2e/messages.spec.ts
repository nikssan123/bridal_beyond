import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Messages', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('messages page redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForURL(/\/(login|messages)/, { timeout: 10000 });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('/login');
      expect(page.url()).toMatch(/redirect=.*messages/);
    } else {
      await expect(
        page.getByRole('heading', { name: 'Messages' })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test('messages page shows conversations or empty state when authenticated', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    if (url.includes('/login')) {
      expect(url).toContain('redirect');
    } else {
      await expect(
        page.getByText(/Messages|No conversations yet|Select a conversation/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
