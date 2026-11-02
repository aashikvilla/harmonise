import { expect, test } from "@playwright/test";
import { CONSENT_VERSION } from "../src/lib/consent";

/**
 * Real community lifecycle (Phase 5). Skips without a configured Supabase
 * backend. The member journey needs TEST_USER_A_JWT and TEST_USER_B_JWT plus
 * the seeded `steady-ground` community.
 */

const COMMUNITY = "steady-ground";

test.beforeEach(async ({ page }) => {
  const config = await page.request.get("/api/auth/config");
  const body = (await config.json().catch(() => null)) as { databaseEnabled?: unknown } | null;
  test.skip(body?.databaseEnabled !== true, "Real communities need a configured Supabase backend.");
});

test("directory and guards behave honestly without sign-in", async ({ page }) => {
  const directory = await page.request.get("/api/communities");
  expect(directory.status()).toBe(200);
  expect((await page.request.get("/api/communities/!!!")).status()).toBe(400);
  expect((await page.request.get(`/api/communities/${COMMUNITY}/membership`)).status()).toBe(401);
  expect((await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "Ghost" } })).status()).toBe(401);
  await page.goto("/communities");
  await expect(page.getByRole("heading", { name: "Communities", exact: true })).toBeVisible();
});

test("join, post with consent, reply, report, leave, and delete", async ({ page }) => {
  test.skip(!process.env.TEST_USER_A_JWT || !process.env.TEST_USER_B_JWT, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const authA = { Authorization: `Bearer ${process.env.TEST_USER_A_JWT}` };
  const authB = { Authorization: `Bearer ${process.env.TEST_USER_B_JWT}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  const joinA = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "RiverA" }, headers: authA });
  expect(joinA.status()).toBe(200);
  expect((await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "x" }, headers: authA })).status()).toBe(400);

  // Non-members cannot read member-only posts.
  expect((await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB })).status()).toBe(403);

  const stale = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
    data: { body: "Stale consent attempt.", consentVersion: "2000-01-01.0" },
    headers: authA,
  });
  expect(stale.status()).toBe(409);

  const created = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
    data: { body: "A real post from user A for lifecycle verification.", consentVersion: CONSENT_VERSION },
    headers: authA,
  });
  expect(created.status()).toBe(200);
  const postId = ((await created.json()) as { post: { id: string } }).post.id;

  const joinB = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "RiverB" }, headers: authB });
  expect(joinB.status()).toBe(200);
  const feed = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(feed.status()).toBe(200);
  expect(((await feed.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  const reply = await page.request.post(`/api/communities/${COMMUNITY}/posts/${postId}/replies`, {
    data: { body: "A real reply from user B.", consentVersion: CONSENT_VERSION },
    headers: authB,
  });
  expect(reply.status()).toBe(200);

  // B cannot delete A's post; the author can.
  expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authB })).status()).toBe(404);
  const reported = await page.request.post(`/api/communities/${COMMUNITY}/reports`, {
    data: { postId, reason: "Lifecycle probe report." },
    headers: authB,
  });
  expect(reported.status()).toBe(200);
  expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authA })).status()).toBe(200);

  const left = await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authB });
  expect(left.status()).toBe(200);
  expect((await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB })).status()).toBe(403);
});

test("blocking hides a member's posts only for the blocker", async ({ page }) => {
  test.skip(!process.env.TEST_USER_A_JWT || !process.env.TEST_USER_B_JWT, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const authA = { Authorization: `Bearer ${process.env.TEST_USER_A_JWT}` };
  const authB = { Authorization: `Bearer ${process.env.TEST_USER_B_JWT}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "BlockA" }, headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "BlockB" }, headers: authB });

  const created = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
    data: { body: "A post that user B will block.", consentVersion: CONSENT_VERSION },
    headers: authA,
  });
  expect(created.status()).toBe(200);
  const postId = ((await created.json()) as { post: { id: string } }).post.id;

  expect(
    (await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: "BlockB" }, headers: authB })).status(),
  ).toBe(403);
  expect(
    (await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: "Nobody Here" }, headers: authB })).status(),
  ).toBe(404);

  const blocked = await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: "BlockA" }, headers: authB });
  expect(blocked.status()).toBe(200);
  const hidden = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await hidden.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).not.toContain(postId);
  const stillThere = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authA });
  expect(((await stillThere.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  const unblocked = await page.request.delete(`/api/communities/${COMMUNITY}/blocks?alias=${encodeURIComponent("BlockA")}`, {
    headers: authB,
  });
  expect(unblocked.status()).toBe(200);
  const visible = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await visible.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authA })).status()).toBe(200);
});
