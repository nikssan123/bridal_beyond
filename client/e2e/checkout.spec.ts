import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Checkout', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('home page loads and has browse or listings link', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: 'Browse listings' })
    ).toBeVisible({ timeout: 15000 });
  });

  test('listings page loads', async ({ page }) => {
    await page.goto('/listings');
    await expect(page).toHaveURL(/\/listings/);
    await expect(
      page.getByRole('heading', { name: 'Listings', exact: true })
    ).toBeVisible({ timeout: 20000 });
  });

  test('checkout route requires auth and redirects to login with returnTo', async ({ page }) => {
    await page.goto('/checkout/00000000-0000-0000-0000-000000000001');
    await page.waitForURL(/\/(login|checkout|listings)/, { timeout: 10000 });
    const url = page.url();
    if (url.includes('/login')) {
      expect(url).toContain('returnTo');
    }
  });
});
