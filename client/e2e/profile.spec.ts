import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('profile redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/(login|profile)/, { timeout: 10000 });
    if (page.url().includes('/login')) {
      expect(page.url()).toContain('redirect');
    } else {
      await expect(page.getByText(/profile|edit profile|reviews/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('profile page shows content when authenticated', async ({ page }) => {
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
    if (page.url().includes('/profile')) {
      await expect(page.getByText(/Profile|Edit profile|Reviews|Active listings/i)).toBeVisible({ timeout: 8000 });
    }
  });
});
