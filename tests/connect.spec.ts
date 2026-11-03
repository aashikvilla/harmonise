import { test, expect } from '@playwright/test';

async function enterWithCode(page: import('@playwright/test').Page) {
  let signedIn = false;
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: signedIn ? 200 : 401,
      contentType: 'application/json',
      body: signedIn ? '{"id":"member-1","email":"fern@example.com"}' : '{"error":"signed-out"}',
    }),
  );
  await page.route('**/api/auth/otp', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
  await page.route('**/api/auth/verify', (route) => {
    signedIn = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/connect');
  await page.getByLabel('Email for a sign-in code').fill('fern@example.com');
  await page.getByLabel('I confirm I am 18 or older.').check();
  await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await page.getByLabel('6-digit code from your email').fill('123456');
  await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
  await expect(page).toHaveURL(/\/connect\/member$/);
  await expect(page.getByRole('heading', { name: 'Find connection' })).toBeVisible();
}

test.describe('Harmonise connect flow', () => {
  test('landing offers entry paths and member sign-in reaches the member shell', async ({ page }) => {
    let signedIn = false;
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: signedIn ? 200 : 401,
        contentType: 'application/json',
        body: signedIn ? '{"id":"member-1","email":"fern@example.com"}' : '{"error":"signed-out"}',
      }),
    );
    await page.route('**/api/auth/otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
    );
    await page.route('**/api/auth/verify', (route) => {
      signedIn = true;
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.goto('/connect');
    await expect(page.getByRole('heading', { name: /Share something difficult.*Choose connection/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Member sign-in' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Coach preview' })).toBeVisible();
    await page.getByRole('tab', { name: 'Coach preview' }).click();
    await expect(page.getByRole('button', { name: 'Give support' })).toBeVisible();
    await page.getByRole('tab', { name: 'Member sign-in' }).click();
    await page.getByLabel('Email for a sign-in code').fill('fern@example.com');
    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('6-digit code from your email').fill('123456');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page).toHaveURL(/\/connect\/member$/);
    await expect(page.getByRole('button', { name: 'Find connection' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My journey' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My circles' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Support Coaches' })).toBeVisible();
    await expect(page.getByText('Listens · reasons · offers a way forward')).toBeVisible();
    await expect(page.getByText('Communities only appear after you choose to see them.')).toBeVisible();
    await expect(page.getByText('Fern', { exact: true })).toBeVisible();
  });

  test('member sign-in requires both disclosures and rejects a wrong code', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"signed-out"}' }),
    );
    await page.route('**/api/auth/otp', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
    );
    await page.route('**/api/auth/verify', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"invalid-code"}' }),
    );
    await page.goto('/connect');
    await page.getByLabel('Email for a sign-in code').fill('fern@example.com');
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await expect(page.locator('.cx-error')).toContainText('confirm you are 18 or older');

    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await expect(page.locator('.cx-error')).toContainText('message will be sent to Meta Muse Spark');

    await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('6-digit code from your email').fill('000000');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page.locator('.cx-error')).toContainText('did not match or has expired');
  });

  test('a signed-in member continues straight to their space', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"member-1","email":"fern@example.com"}' }),
    );
    await page.goto('/connect');
    await expect(page.getByText('You are signed in as fern@example.com.')).toBeVisible();
    await page.getByRole('button', { name: 'Continue to your space' }).click();
    await expect(page).toHaveURL(/\/connect\/member$/);
    await expect(page.getByText('Fern', { exact: true })).toBeVisible();
  });

  test('crisis words open urgent support without advice or matching', async ({ page }) => {
    await enterWithCode(page);
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
    await enterWithCode(page);
    await page.getByPlaceholder('Share what is happening, in your own words…').fill('Work has felt overwhelming lately.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText('The live adviser could not respond just now. Please try again.')).toBeVisible({
      timeout: 30000,
    });
    await expect(page.getByText('Communities that may understand')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  });

  test('member tabs render journey, circles, and coaches', async ({ page }) => {
    await enterWithCode(page);
    await page.getByRole('button', { name: 'My journey' }).click();
    await expect(page.getByText('Point Z', { exact: true })).toBeVisible();
    await expect(page.getByText('AI cannot score wellbeing or define progress automatically.')).toBeVisible();
    await page.getByRole('button', { name: 'My circles' }).click();
    await expect(page.getByText('You haven’t joined any circles yet')).toBeVisible();
    await page.getByRole('button', { name: 'Support Coaches' }).click();
    await expect(page.getByText('Need licensed or clinical care?')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request introduction' })).toHaveCount(0);
    await expect(page.getByText(/no coaches are listed here/i)).toBeVisible();
  });
});
