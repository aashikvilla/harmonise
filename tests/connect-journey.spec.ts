import { test, expect, type Page } from '@playwright/test';

const CONTRIBUTIONS = [
  {
    communityId: 'community-1',
    communityName: 'Rebuilding circle',
    alias: 'Quiet Fern',
    role: 'member',
    posts: [
      {
        id: 'post-1',
        body: 'First weekend in the new place, cooked a real dinner.',
        status: 'visible',
        createdAt: '2026-01-02T10:00:00.000Z',
        replyCount: 2,
        thanks: 3,
      },
    ],
    replies: 4,
    thanksReceived: 3,
    level: 'Contributor',
  },
];

const OPEN_PROMOTION = {
  requests: [
    {
      id: 'req-1',
      community_id: 'community-1',
      requested_role: 'volunteer',
      note: 'Happy to welcome new members.',
      status: 'open',
      reviewer_rationale: '',
      created_at: '2026-01-03T10:00:00.000Z',
    },
  ],
};

async function mockAuth(page: Page) {
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
}

async function enterMember(page: Page) {
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

test.describe('Connect journey and coaches — real data', () => {
  test('journey shows real contribution counts, history, and promotion status', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/account/contributions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contributions: CONTRIBUTIONS }) }),
    );
    await page.route('**/api/communities/*/promotions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OPEN_PROMOTION) }),
    );
    await enterMember(page);

    // Profile standing comes from the same real contributions record.
    await expect(page.getByText('1 posts · 1 circles')).toBeVisible();
    await expect(page.getByText('Helpfulness points')).toHaveCount(0);

    await page.getByRole('button', { name: 'My journey' }).click();
    const contributions = page.locator('section[aria-label="Your contributions"]');
    await expect(contributions.getByText('1 posts', { exact: true })).toBeVisible();
    await expect(contributions.getByText(/1 circle joined · 4 replies · 3 thanks received/)).toBeVisible();
    await expect(contributions.getByText(/Posted in Rebuilding circle/)).toBeVisible();
    await expect(contributions.getByText(/First weekend in the new place/)).toBeVisible();
    await expect(page.getByText(/this-session reflections only/)).toBeVisible();

    const eligibility = page.locator('section[aria-label="Support Coach eligibility"]');
    await expect(eligibility.getByText(/Volunteer request waiting for moderator review/)).toBeVisible();

    // Confirming a milestone is framed as a session reflection, not a saved score.
    await page.getByRole('button', { name: 'Confirm milestone: Named what I\'m going through' }).click();
    await expect(page.locator('section[aria-label="Milestones you confirmed"]').getByText('Named what I\'m going through')).toBeVisible();
  });

  test('coaches tab shows the real application state and no fictional roster', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/account/contributions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ contributions: CONTRIBUTIONS }) }),
    );
    await page.route('**/api/communities/*/promotions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OPEN_PROMOTION) }),
    );
    await enterMember(page);

    await page.getByRole('button', { name: 'Support Coaches' }).click();
    await expect(page.getByText(/does not publish a coach roster/)).toBeVisible();
    await expect(page.getByText('Amara A.')).toHaveCount(0);
    await expect(page.getByText(/Request introduction/)).toHaveCount(0);
    const path = page.locator('section[aria-label="Your path to supporting others"]');
    await expect(path.getByText(/waiting for a moderator review/)).toBeVisible();
    await expect(path.getByText(/1 posts · 4 replies · 3 thanks received/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request volunteer review' })).toHaveCount(0);
    await expect(page.getByText('Need licensed or clinical care?')).toBeVisible();

    // The shell dialog shows the same real record, not a fake dashboard.
    await page.getByRole('button', { name: 'Your supporter applications' }).click();
    const dialog = page.getByRole('dialog', { name: 'Your supporter applications' });
    await expect(dialog.getByText(/waiting for a moderator/)).toBeVisible();
    await expect(dialog.getByText(/no separate coach dashboard/)).toBeVisible();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });

  test('empty memberships give honest not-started states', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/account/contributions', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"contributions":[]}' }),
    );
    await enterMember(page);

    await page.getByRole('button', { name: 'My journey' }).click();
    await expect(page.locator('section[aria-label="Your contributions"]').getByText(/0 posts/)).toBeVisible();
    await expect(page.locator('section[aria-label="Support Coach eligibility"]').getByText(/Not started/)).toBeVisible();

    await page.getByRole('button', { name: 'Support Coaches' }).click();
    await expect(page.getByText(/not joined any circles yet, so there is nowhere to apply yet/)).toBeVisible();
  });

  test('unavailable contributions degrade to an honest retry message, never zero', async ({ page }) => {
    await mockAuth(page);
    await page.route('**/api/account/contributions', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"unavailable"}' }),
    );
    await enterMember(page);

    await expect(page.getByText('Unavailable', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'My journey' }).click();
    await expect(page.getByText(/could not be loaded just now/)).toBeVisible();
    await expect(page.locator('section[aria-label="Your contributions"]').getByText(/0 posts/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Support Coaches' }).click();
    await expect(page.getByText(/not being shown as “not started”/)).toBeVisible();
  });
});
