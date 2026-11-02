import { expect, test } from "@playwright/test";
import { CONSENT_VERSION } from "../src/lib/consent";
import { liveTokens, projectTag } from "./live-users";

/**
 * Stateful live-backend journeys, kept in ONE file so they run serially per
 * project (fullyParallel is false): they share test users and one community,
 * so parallel files would leave/rejoin over each other. Parallel projects
 * stay isolated via per-project users (see live-users.ts). Skips without a
 * configured Supabase backend or test-user JWTs.
 */

const COMMUNITY = "steady-ground";

// Each journey makes a dozen-plus sequential calls to the live cloud backend,
// so allow headroom over the 30s default when the suite runs in parallel.
test.setTimeout(120_000);

test.beforeEach(async ({ page }) => {
  const config = await page.request.get("/api/auth/config");
  const body = (await config.json().catch(() => null)) as { databaseEnabled?: unknown } | null;
  test.skip(body?.databaseEnabled !== true, "Live journeys need a configured Supabase backend.");
});

test("sessions: create, resume, correct, delete, and second-user isolation", async ({ page, context }) => {
  const tokens = liveTokens();
  test.skip(!tokens.a || !tokens.b, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const tokenA = tokens.a as string;
  const tokenB = tokens.b as string;
  const authA = { Authorization: `Bearer ${tokenA}` };
  const authB = { Authorization: `Bearer ${tokenB}` };

  const created = await page.request.post("/api/sessions", { data: { title: "Isolation probe" }, headers: authA });
  expect(created.status()).toBe(200);
  const sessionId = ((await created.json()) as { session: { id: string } }).session.id;

  await page.request.post(`/api/sessions/${sessionId}/messages`, {
    data: { role: "user", text: "A private sentence only user A wrote." },
    headers: authA,
  });
  const corrected = await page.request.put(`/api/sessions/${sessionId}/understanding`, {
    data: {
      suggested_themes: ["work-pressure"],
      confirmed_themes: ["work-pressure"],
      support_need: "human-perspective",
      need_summary: "User A confirmed work pressure in their own words.",
      correction_count: 1,
    },
    headers: authA,
  });
  expect(corrected.status()).toBe(200);

  // Second user cannot read, extend, or understand user A's session.
  expect((await page.request.get(`/api/sessions/${sessionId}`, { headers: authB })).status()).toBe(404);
  expect(
    (await page.request.post(`/api/sessions/${sessionId}/messages`, { data: { role: "user", text: "intruder" }, headers: authB })).status(),
  ).toBe(404);

  // Owner resumes the full session in the browser.
  const host = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").hostname;
  await context.addCookies([{ name: "sb-access", value: tokenA, domain: host, path: "/", httpOnly: true }]);
  await page.goto("/app?path=talk");
  await expect(page.getByRole("heading", { name: "Your saved conversations" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).first().click();
  await expect(page.getByText("A private sentence only user A wrote.", { exact: true })).toBeVisible();

  // Delete removes the session and its messages (verified by read-back).
  expect((await page.request.delete(`/api/sessions/${sessionId}`, { headers: authA })).status()).toBe(200);
  expect((await page.request.get(`/api/sessions/${sessionId}`, { headers: authA })).status()).toBe(404);
});

test("community: join, post with consent, reply, report, leave, and delete", async ({ page }) => {
  const tokens = liveTokens();
  test.skip(!tokens.a || !tokens.b, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const authA = { Authorization: `Bearer ${tokens.a}` };
  const authB = { Authorization: `Bearer ${tokens.b}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  // Normalize membership in case a previous run failed midway.
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authB });

  const joinA = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `RiverA${projectTag()}` }, headers: authA });
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

  const joinB = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `RiverB${projectTag()}` }, headers: authB });
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

test("community: blocking hides a member's posts only for the blocker", async ({ page }) => {
  const tokens = liveTokens();
  test.skip(!tokens.a || !tokens.b, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const authA = { Authorization: `Bearer ${tokens.a}` };
  const authB = { Authorization: `Bearer ${tokens.b}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  // Normalize membership in case a previous run failed midway.
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authB });

  const tag = projectTag();
  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `BlockA${tag}` }, headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `BlockB${tag}` }, headers: authB });

  const created = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
    data: { body: "A post that user B will block.", consentVersion: CONSENT_VERSION },
    headers: authA,
  });
  expect(created.status()).toBe(200);
  const postId = ((await created.json()) as { post: { id: string } }).post.id;

  expect(
    (await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: `BlockB${tag}` }, headers: authB })).status(),
  ).toBe(403);
  expect(
    (await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: "Nobody Here" }, headers: authB })).status(),
  ).toBe(404);

  const blocked = await page.request.post(`/api/communities/${COMMUNITY}/blocks`, { data: { alias: `BlockA${tag}` }, headers: authB });
  expect(blocked.status()).toBe(200);
  const hidden = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await hidden.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).not.toContain(postId);
  const stillThere = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authA });
  expect(((await stillThere.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  const unblocked = await page.request.delete(`/api/communities/${COMMUNITY}/blocks?alias=${encodeURIComponent(`BlockA${tag}`)}`, {
    headers: authB,
  });
  expect(unblocked.status()).toBe(200);
  const visible = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  expect(((await visible.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);

  expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authA })).status()).toBe(200);
});

test("moderation: report, human decision, appeal, and second review", async ({ page }) => {
  const tokens = liveTokens();
  test.skip(
    !tokens.a || !tokens.b || !tokens.mod,
    "Needs TEST_USER_A_JWT, TEST_USER_B_JWT, and TEST_MODERATOR_JWT.",
  );
  const authA = { Authorization: `Bearer ${tokens.a}` };
  const authB = { Authorization: `Bearer ${tokens.b}` };
  const authM = { Authorization: `Bearer ${tokens.mod}` };

  const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");

  // Normalize membership in case a previous run failed midway.
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authB });

  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `ModA${projectTag()}` }, headers: authA });
  await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `ModB${projectTag()}` }, headers: authB });

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
