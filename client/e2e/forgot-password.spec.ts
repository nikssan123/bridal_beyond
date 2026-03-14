import { test, expect } from './fixtures';
import { setAppLocaleEn } from './helpers';

test.describe('Forgot password', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('forgot password page loads and shows form', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(
      page.getByRole('heading', { name: 'Forgot password' })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to sign in' })).toBeVisible();
  });

  test('submit shows success message', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Forgot password' })).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(
      page.getByRole('alert').getByText('you will receive instructions', { exact: false })
    ).toBeVisible({ timeout: 10000 });
  });
});
