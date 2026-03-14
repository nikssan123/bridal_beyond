import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Listing detail', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('listing detail loads when clicking first listing card', async ({ page }) => {
    await page.goto('/listings');
    await expect(page.getByRole('heading', { name: 'Listings', exact: true })).toBeVisible({ timeout: 15000 });
    const firstCardImage = page.getByRole('img').first();
    const hasListings = await firstCardImage.isVisible().catch(() => false);
    if (hasListings) {
      await firstCardImage.click();
      await page.waitForURL(/\/listings\/[a-f0-9-]+/i, { timeout: 8000 });
      await expect(
        page.getByRole('main').getByRole('button', { name: /Contact|Buy|Message/i }).or(
          page.getByRole('main').getByText(/Seller|Reviews|Condition|View profile/i)
        )
      ).first().toBeVisible({ timeout: 8000 });
    }
  });

  test('invalid listing id shows error or redirects', async ({ page }) => {
    await page.goto('/listings/00000000-0000-0000-0000-000000000099');
    await page.waitForLoadState('networkidle').catch(() => {});
    const hasError = await page.getByText(/not found|error|does not exist/i).isVisible().catch(() => false);
    const hasBuyButton = await page.getByRole('button', { name: /Contact|Buy|Message/i }).isVisible().catch(() => false);
    expect(hasError || !hasBuyButton).toBeTruthy();
  });
});
