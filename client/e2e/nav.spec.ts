import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('brand link goes to home', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.getByRole('heading', { name: 'Listings', exact: true })).toBeVisible({ timeout: 20000 });
    await page.getByRole('link', { name: 'LoveReWorn' }).click();
    await expect(page).toHaveURL(/\/(\?|$)/);
    await expect(page.getByRole('button', { name: 'Browse listings' })).toBeVisible({ timeout: 10000 });
  });

  test('browse listings button goes to listings', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Browse listings' })).toBeVisible({ timeout: 20000 });
    await page.getByRole('button', { name: 'Browse listings' }).click();
    await expect(page).toHaveURL(/\/listings/);
    await expect(page.getByRole('heading', { name: 'Listings', exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('login link goes to login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Browse listings' })).toBeVisible({ timeout: 15000 });
    await page.getByRole('banner').getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
  });

  test('register link from login goes to register', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible({ timeout: 5000 });
  });
});
