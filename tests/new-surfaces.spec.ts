import { test, expect } from '@playwright/test';

test.describe('new product surfaces', () => {
  test('ops shows an error when metrics fail', async ({ page }) => {
    await page.route('**/api/ops/metrics', route => route.fulfill({ status: 500, json: { error: 'unavailable' } }));
    await page.goto('/ops');
    await page.getByLabel('Ops secret').fill('synthetic-test-secret');
    await page.getByRole('button', { name: 'Load metrics' }).click();
    await expect(page.getByText('Metrics are unavailable right now.')).toBeVisible();
  });
  test('email-code sign-in enters the member shell', async ({ page }) => {
    let signedIn = false;
    await page.route('**/api/auth/me', route => route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: 'application/json',
      body: signedIn ? '{"id":"member-1","email":"fern@example.com"}' : '{"error":"signed-out"}',
    }));
    await page.route('**/api/auth/otp', route => route.fulfill({ status: 200, json: { ok: true } }));
    await page.route('**/api/auth/verify', route => {
      signedIn = true;
      return route.fulfill({ status: 200, json: { ok: true } });
    });
    await page.goto('/connect');
    await page.getByLabel('Email for a sign-in code').fill('fern@example.com');
    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('6-digit code from your email').fill('123456');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page).toHaveURL(/\/connect\/member$/);
    await expect(page.getByRole('button', { name: 'Find connection' })).toBeVisible();
  });

  test('ops dashboard asks for a secret and rejects a wrong one', async ({ page }) => {
    await page.goto('/ops');
    await expect(page.getByRole('heading', { name: 'Pilot ops dashboard' })).toBeVisible();
    await page.getByLabel('Ops secret').fill('wrong-secret');
    await page.getByRole('button', { name: 'Load metrics' }).click();
    await expect(page.getByText('That secret was not accepted.')).toBeVisible();
  });

  test('profile distinguishes signed-out state from an empty account', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
    await expect(page.getByText(/Sign in to see your circles and private notifications/)).toBeVisible();
    await expect(page.getByText('You have not joined any circles yet.')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'How standing works' })).toBeVisible();
  });

  test('profile shows an error instead of empty data when a request fails', async ({ page }) => {
    await page.route('**/api/auth/me', route => route.fulfill({ status: 200, json: { id: 'member-1' } }));
    await page.route('**/api/account/contributions', route => route.fulfill({ status: 500, json: { error: 'unavailable' } }));
    await page.route('**/api/account/notifications', route => route.fulfill({ status: 200, json: { notifications: [] } }));
    await page.goto('/profile');
    await expect(page.getByRole('alert')).toContainText('not being shown as empty');
    await expect(page.getByText('You have not joined any circles yet.')).toHaveCount(0);
  });

  test('moderation audit page asks for a community first', async ({ page }) => {
    await page.goto('/moderation/decisions');
    await expect(page.getByText('You do not moderate any community yet, so there is no audit trail to show.')).toBeVisible();
  });
});
