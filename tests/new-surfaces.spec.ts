import { test, expect } from '@playwright/test';

test.describe('new product surfaces', () => {
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
    await expect(page.getByText('Choose a community from the moderation page first.')).toBeVisible();
  });
});
