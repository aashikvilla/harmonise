import { test, expect } from '@playwright/test';

test.describe('Harmonise connect circles (real community data)', () => {
  test('adviser match join shows the circle in My Circles with its real feed, and posting appears in the feed', async ({ page }) => {
    let signedIn = false;
    let joined = false;
    const feedPosts: Array<Record<string, unknown>> = [
      {
        id: 'post-1',
        body: 'A real first post from the circle.',
        status: 'visible',
        created_at: new Date(Date.now() - 60_000).toISOString(),
        author_alias: 'Quiet River',
        kind: 'share',
        replyCount: 0,
      },
    ];

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
    await page.route('**/api/advice', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          reflection: 'It sounds like this season has asked a lot of you.',
          steps: ['Name one small thing that is yours today.', 'Write down what helped, even briefly.'],
          perspective: 'Small, steady steps still count as rebuilding.',
          matches: [{ id: 'rebuilding', reason: 'Your words fit a circle for people starting over.' }],
        }),
      }),
    );
    // Registered first so the more specific routes below take precedence.
    await page.route('**/api/communities', (route) => {
      if (route.request().method() !== 'GET') return route.fulfill({ status: 405, contentType: 'application/json', body: '{"error":"invalid"}' });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          communities: [
            {
              id: 'rebuilding',
              name: 'Rebuilding after separation',
              description: 'A live circle for people starting over.',
              visibility: 'public',
              launch_status: 'approved',
              topics: ['Starting over'],
              memberCount: 3,
              postCount: feedPosts.length,
              recentPostCount: feedPosts.length,
              joined,
            },
          ],
        }),
      });
    });
    await page.route('**/api/communities/rebuilding/membership', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          membership: joined ? { id: 'membership-1', alias: 'Fern', role: 'member', status: 'active' } : null,
        }),
      }),
    );
    await page.route('**/api/communities/rebuilding/join', async (route) => {
      const payload = route.request().postDataJSON() as { alias?: unknown };
      expect(payload.alias).toBe('Fern');
      joined = true;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"membership":{"id":"membership-1","alias":"Fern","role":"member","status":"active"}}',
      });
    });
    await page.route('**/api/communities/rebuilding/posts', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { body?: unknown };
        const post = {
          id: 'post-new',
          body: String(payload.body ?? ''),
          status: 'visible',
          created_at: new Date().toISOString(),
          author_alias: 'Fern',
          kind: 'share',
          replyCount: 0,
        };
        feedPosts.unshift(post);
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ post }) });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ posts: feedPosts, moderator: false }),
      });
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

    await page.getByPlaceholder('Share what is happening, in your own words…').fill('I am going through a separation and feel unsteady.');
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByText('It sounds like this season has asked a lot of you.')).toBeVisible();
    await page.getByRole('button', { name: /show relevant communities/i }).click();

    await expect(page.getByRole('heading', { name: 'Communities that may understand' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Rebuilding after separation' })).toBeVisible();
    await page.getByRole('button', { name: /Join as alias/i }).click();
    await expect(page.getByRole('button', { name: 'Open in My circles' })).toBeVisible();

    await page.getByRole('button', { name: 'Open in My circles' }).click();
    await expect(page.getByRole('heading', { name: 'My circles' })).toBeVisible();
    await expect(page.getByText('A real first post from the circle.')).toBeVisible();
    await expect(page.getByText('Post to circle · +5 points')).toHaveCount(0);

    await page.getByLabel('Share with this circle').fill('Tonight felt a little steadier.');
    await page.getByRole('button', { name: 'Post to circle', exact: true }).click();
    await expect(page.getByText('Tonight felt a little steadier.')).toBeVisible();
  });

  test('My Circles is truthfully empty before joining anything', async ({ page }) => {
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
    await page.route('**/api/communities', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"communities":[{"id":"rebuilding","name":"Rebuilding after separation","description":"A live circle.","visibility":"public","memberCount":3,"postCount":1,"recentPostCount":1,"joined":false}]}',
      }),
    );

    await page.goto('/connect');
    await page.getByLabel('Email for a sign-in code').fill('fern@example.com');
    await page.getByLabel('I confirm I am 18 or older.').check();
    await page.getByLabel('I understand my message will be sent to Meta Muse Spark for a response.').check();
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('6-digit code from your email').fill('123456');
    await page.getByRole('button', { name: 'Sign in and continue to chat' }).click();
    await expect(page).toHaveURL(/\/connect\/member$/);

    await page.getByRole('button', { name: 'My circles' }).click();
    await expect(page.getByText('You haven’t joined any circles yet')).toBeVisible();
    await expect(page.getByText('Community activity levels')).toHaveCount(0);
  });
});
