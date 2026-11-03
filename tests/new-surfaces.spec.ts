import { test, expect } from '@playwright/test';

test.describe('new product surfaces', () => {
  test('ops shows an error when metrics fail', async ({ page }) => {
    await page.route('**/api/ops/metrics', route => route.fulfill({ status: 500, json: { error: 'unavailable' } }));
    await page.goto('/ops');
    await page.getByLabel('Ops secret').fill('synthetic-test-secret');
    await page.getByRole('button', { name: 'Load metrics' }).click();
    await expect(page.getByText('Metrics are unavailable right now.')).toBeVisible();
  });
  test('connect one-tap demo enters the member shell', async ({ page }) => {
    await page.goto('/connect');
    await page.getByRole('button', { name: 'Try the demo in one tap' }).click();
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

  test('profile page renders a signed-out empty state', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible();
    await expect(page.getByText('You have not joined any circles yet.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How standing works' })).toBeVisible();
  });

  test('moderation audit page asks for a community first', async ({ page }) => {
    await page.goto('/moderation/decisions');
    await expect(page.getByText('You do not moderate any community yet, so there is no audit trail to show.')).toBeVisible();
  });
});
