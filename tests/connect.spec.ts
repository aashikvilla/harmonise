import { test, expect } from '@playwright/test';

async function exploreDemo(page: import('@playwright/test').Page) {
  await page.goto('/connect');
  await page.getByLabel('I confirm I am 18 or older.').check();
  await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
  await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
  await expect(page).toHaveURL(/\/connect\/member$/);
  await expect(page.getByRole('heading', { name: 'Find connection' })).toBeVisible();
}

test.describe('Harmonise connect flow', () => {
  test('landing offers entry paths and demo explores the member shell', async ({ page }) => {
    await page.goto('/connect');
    await expect(page.getByRole('heading', { name: /Share something difficult.*Choose connection/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Member demo' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Coach preview' })).toBeVisible();
    await page.getByRole('tab', { name: 'Coach preview' }).click();
    await expect(page.getByRole('button', { name: 'Give support' })).toBeVisible();
    await page.getByRole('tab', { name: 'Member demo' }).click();
    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page).toHaveURL(/\/connect\/member$/);
    await expect(page.getByRole('button', { name: 'Find connection' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My journey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My circles' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Support Coaches' })).toBeVisible();
    await expect(page.getByText('Listens · reasons · offers a way forward')).toBeVisible();
    await expect(page.getByText('Communities only appear after you choose to see them.')).toBeVisible();
  });

  test('demo entry checks the shared credentials and requires both disclosures', async ({ page }) => {
    await page.goto('/connect');
    await page.getByLabel('Demo password').fill('incorrect');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page.locator('.cx-error')).toContainText('Those demo credentials do not match');

    await page.getByLabel('Demo password').fill('MuseDemo2026!');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page.locator('.cx-error')).toContainText('confirm you are 18 or older');

    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page.locator('.cx-error')).toContainText('message will be sent to Meta Muse Spark');
  });

  test('crisis words open urgent support without advice or matching', async ({ page }) => {
    await exploreDemo(page);
    await page.getByPlaceholder('Share what is happening, in your own words…').fill('I want to die');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText('Harmonise cannot monitor you or contact emergency services.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find a verified helpline' })).toHaveAttribute(
      'href',
      'https://findahelpline.com/',
    );
    await expect(page.getByText('Preparing a useful next step')).toHaveCount(0);
    await expect(page.getByText('Communities that may understand')).toHaveCount(0);
    await page.getByRole('button', { name: 'Close so I can contact someone' }).click();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('shows an honest retry state when the live adviser is unavailable', async ({ page }) => {
    await page.route('**/api/advice', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }),
    );
    await exploreDemo(page);
    await page.getByPlaceholder('Share what is happening, in your own words…').fill('Work has felt overwhelming lately.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText('The live adviser could not respond just now. Please try again.')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText('Communities that may understand')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('member tabs render journey, circles, and coaches', async ({ page }) => {
    await exploreDemo(page);
    await page.getByRole('button', { name: 'My journey' }).click();
    await expect(page.getByText('Point Z', { exact: true })).toBeVisible();
    await expect(page.getByText('AI cannot score wellbeing or define progress automatically.')).toBeVisible();
    await page.getByRole('button', { name: 'My circles' }).click();
    await expect(page.getByText('You haven’t joined any circles yet')).toBeVisible();
    await page.getByRole('button', { name: 'Support Coaches' }).click();
    await expect(page.getByText('Need licensed or clinical care?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request introduction' }).first()).toBeDisabled();
  });
});
