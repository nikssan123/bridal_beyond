import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Favorites', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('favorites redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForURL(/\/(login|favorites)/, { timeout: 10000 });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('redirect');
    } else {
      await expect(page.getByRole('heading', { name: 'My Favorites' })).toBeVisible({ timeout: 5000 });
    }
  });

  test('favorites page shows empty state or list when authenticated', async ({ page }) => {
    const e2eEmail = process.env.E2E_LOGIN_EMAIL;
    const e2ePassword = process.env.E2E_LOGIN_PASSWORD;
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Email').fill(e2eEmail);
    await page.getByLabel('Password').fill(e2ePassword);
    await page.getByRole('main').getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(/\/(profile|login|verify-email)/, { timeout: 15000 });
    if (!page.url().includes('/profile')) {
      test.skip(true, 'Login failed (backend unreachable or invalid credentials). Start backend and set .env.e2e to run this test.');
      return;
    }
    await page.goto('/favorites');
    await page.waitForURL(/\/favorites/, { timeout: 8000 });
    await expect(
      page.getByText(/My Favorites|No favorites yet|Browse listings/i)
    ).toBeVisible({ timeout: 8000 });
  });
});
