import { expect, test } from "@playwright/test";
import { CONSENT_VERSION } from "../src/lib/consent";

/**
 * Moderation pipeline (Phase 6). Skips without a configured Supabase backend.
 * The reviewer journey needs TEST_USER_A_JWT, TEST_USER_B_JWT, and
 * TEST_MODERATOR_JWT (a moderator of the seeded `steady-ground` community).
 * The live-model worker step is intentionally not run here: triage shape is
 * covered by the Phase 1 eval set, and worker runs spend Meta credits.
 */

const COMMUNITY = "steady-ground";

test.beforeEach(async ({ page }) => {
  const config = await page.request.get("/api/auth/config");
  const body = (await config.json().catch(() => null)) as { databaseEnabled?: unknown } | null;
  test.skip(body?.databaseEnabled !== true, "Moderation needs a configured Supabase backend.");
});

test("moderation APIs deny anonymous callers and unapproved workers", async ({ page }) => {
  expect((await page.request.get(`/api/moderation/queue?community=${COMMUNITY}`)).status()).toBe(401);
  expect((await page.request.post("/api/moderation/decide", { data: {} })).status()).toBe(401);
  expect((await page.request.post("/api/moderation/appeal", { data: {} })).status()).toBe(401);
  expect((await page.request.post("/api/moderation/process")).status()).toBe(403);
  expect((await page.request.get(`/api/moderation/flags?community=${COMMUNITY}`)).status()).toBe(401);
});

test("new-post flags are moderator-only", async ({ page }) => {
  test.skip(!process.env.TEST_USER_A_JWT || !process.env.TEST_MODERATOR_JWT, "Needs TEST_USER_A_JWT and TEST_MODERATOR_JWT.");
  const authA = { Authorization: `Bearer ${process.env.TEST_USER_A_JWT}` };
  const authM = { Authorization: `Bearer ${process.env.TEST_MODERATOR_JWT}` };
  expect((await page.request.get(`/api/moderation/flags?community=${COMMUNITY}`, { headers: authA })).status()).toBe(403);
  const flags = await page.request.get(`/api/moderation/flags?community=${COMMUNITY}`, { headers: authM });
  expect(flags.status()).toBe(200);
  expect(Array.isArray(((await flags.json()) as { flags: unknown[] }).flags)).toBe(true);
});

test("report, human decision, appeal, and second review", async ({ page }) => {
  test.skip(
    !process.env.TEST_USER_A_JWT || !process.env.TEST_USER_B_JWT || !process.env.TEST_MODERATOR_JWT,
    "Needs TEST_USER_A_JWT, TEST_USER_B_JWT, and TEST_MODERATOR_JWT.",
  );
  const authA = { Authorization: `Bearer ${process.env.TEST_USER_A_JWT}` };
  const authB = { Authorization: `Bearer ${process.env.TEST_USER_B_JWT}` };
  const authM = { Authorization: `Bearer ${process.env.TEST_MODERATOR_JWT}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "ModA" }, headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "ModB" }, headers: authB });

  // Non-moderators cannot open the queue.
  expect((await page.request.get(`/api/moderation/queue?community=${COMMUNITY}`, { headers: authA })).status()).toBe(403);

  const created = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
    data: { body: "A probe post for the moderation pipeline.", consentVersion: CONSENT_VERSION },
    headers: authA,
  });
  expect(created.status()).toBe(200);
  const postId = ((await created.json()) as { post: { id: string } }).post.id;

  const reported = await page.request.post(`/api/communities/${COMMUNITY}/reports`, {
    data: { postId, reason: "Probe report for reviewer journey." },
    headers: authB,
  });
  expect(reported.status()).toBe(200);
  const reportId = ((await reported.json()) as { report: { id: string } }).report.id;

  const queue = await page.request.get(`/api/moderation/queue?community=${COMMUNITY}`, { headers: authM });
  expect(queue.status()).toBe(200);
  const items = ((await queue.json()) as { queue: { report: { id: string }; target: { id: string } | null }[] }).queue;
  expect(items.map((item) => item.report.id)).toContain(reportId);

  // Rationale is required for action decisions.
  expect(
    (await page.request.post("/api/moderation/decide", { data: { reportId, decision: "remove", rationale: "" }, headers: authM })).status(),
  ).toBe(400);

  const decided = await page.request.post("/api/moderation/decide", {
    data: { reportId, decision: "request-revision", rationale: "Probe decision: asks for a gentler wording." },
    headers: authM,
  });
  expect(decided.status()).toBe(200);
  const decisionId = ((await decided.json()) as { decision: { id: string } }).decision.id;

  // Held content leaves the member-visible feed.
  const feed = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await feed.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).not.toContain(postId);

  // Only the author can appeal.
  expect(
    (await page.request.post("/api/moderation/appeal", { data: { decisionId, reason: "Not my post." }, headers: authB })).status(),
  ).toBe(403);
  const appealed = await page.request.post("/api/moderation/appeal", {
    data: { decisionId, reason: "Probe appeal: I revised the wording." },
    headers: authA,
  });
  expect(appealed.status()).toBe(200);
  const appealId = ((await appealed.json()) as { appeal: { id: string } }).appeal.id;

  const overturned = await page.request.post(`/api/moderation/appeals/${appealId}/decide`, {
    data: { outcome: "overturned" },
    headers: authM,
  });
  expect(overturned.status()).toBe(200);

  const restored = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await restored.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  const metrics = await page.request.get(`/api/moderation/metrics?community=${COMMUNITY}`, { headers: authM });
  expect(metrics.status()).toBe(200);
  expect((await page.request.get(`/api/moderation/metrics?community=${COMMUNITY}`, { headers: authA })).status()).toBe(403);

  expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authA })).status()).toBe(200);
});
