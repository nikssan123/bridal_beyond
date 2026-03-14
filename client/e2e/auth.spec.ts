import { test, expect } from './fixtures';
import { canReachBackend, setAppLocaleEn } from './helpers';

test.describe('Auth', () => {
  test.beforeEach(async ({ page }) => {
    await setAppLocaleEn(page);
  });

  test('login page loads and shows sign-in form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('register page loads and shows registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Email').fill('nonexistent@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('main').getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  });

  test('successful login redirects to profile when backend and test user exist', async ({ page }) => {
    const e2eEmail = process.env.E2E_LOGIN_EMAIL;
    const e2ePassword = process.env.E2E_LOGIN_PASSWORD;
    if (!e2eEmail || !e2ePassword) {
      test.skip();
      return;
    }
    await page.goto('/login');
    const reach = await canReachBackend(page);
    if (!reach.ok) {
      test.skip(
        `Browser cannot reach backend (${reach.message}). Ensure backend is running and .env has CORS_ORIGIN=http://localhost:3000 (Vite runs on 3000).`
      );
      return;
    }
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Email').fill(e2eEmail);
    await page.getByLabel('Password').fill(e2ePassword);
    const loginResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/auth/login') && res.request().method() === 'POST',
      { timeout: 20000 }
    );
    await page.getByRole('main').getByRole('button', { name: 'Sign in', exact: true }).click();
    let loginResponse: Awaited<ReturnType<typeof page.waitForResponse>>;
    try {
      loginResponse = await loginResponsePromise;
    } catch {
      throw new Error(
        'Login request did not complete within 20s. Backend may be slow or the request was aborted (check backend logs for POST /api/auth/login with no status).'
      );
    }
    try {
      await page.waitForURL(/\/(profile|verify-email)/, { timeout: 10000 });
    } catch {
      const status = loginResponse.status();
      const alert = page.getByRole('alert');
      const hasAlert = await alert.isVisible().catch(() => false);
      const text = hasAlert ? (await alert.textContent().catch(() => '')) || '' : '';
      if (/connection problem|network|check your internet/i.test(text)) {
        throw new Error(
          'Backend unreachable. Start the backend (npm run dev in the backend folder) so it runs on http://localhost:4000, then run e2e again.'
        );
      }
      if (status === 401) {
        throw new Error(
          `Login returned 401. Check E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD and that the user exists and is email-verified. Alert: ${text || '(none)'}`
        );
      }
      throw new Error(
        `Login did not redirect to profile (response ${status}). Still on login page. Alert: ${text || '(none)'}. Check E2E_LOGIN_EMAIL/E2E_LOGIN_PASSWORD and that the user exists and is email-verified.`
      );
    }
    if (page.url().includes('/profile')) {
      await expect(page.getByRole('button', { name: 'Edit profile' })).toBeVisible({ timeout: 8000 });
    }
  });
});
