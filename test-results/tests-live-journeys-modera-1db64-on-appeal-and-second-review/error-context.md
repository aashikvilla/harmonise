# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\live-journeys.spec.ts >> moderation: report, human decision, appeal, and second review
- Location: tests\live-journeys.spec.ts:175:5

# Error details

```
TypeError: apiRequestContext.get: Invalid URL
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { CONSENT_VERSION } from "../src/lib/consent";
  3   | import { liveTokens, projectTag } from "./live-users";
  4   | 
  5   | /**
  6   |  * Stateful live-backend journeys, kept in ONE file so they run serially per
  7   |  * project (fullyParallel is false): they share test users and one community,
  8   |  * so parallel files would leave/rejoin over each other. Parallel projects
  9   |  * stay isolated via per-project users (see live-users.ts). Skips without a
  10  |  * configured Supabase backend or test-user JWTs.
  11  |  */
  12  | 
  13  | const COMMUNITY = "steady-ground";
  14  | 
  15  | test.beforeEach(async ({ page }) => {
> 16  |   const config = await page.request.get("/api/auth/config");
      |                                     ^ TypeError: apiRequestContext.get: Invalid URL
  17  |   const body = (await config.json().catch(() => null)) as { databaseEnabled?: unknown } | null;
  18  |   test.skip(body?.databaseEnabled !== true, "Live journeys need a configured Supabase backend.");
  19  | });
  20  | 
  21  | test("sessions: create, resume, correct, delete, and second-user isolation", async ({ page, context }) => {
  22  |   const tokens = liveTokens();
  23  |   test.skip(!tokens.a || !tokens.b, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  24  |   const tokenA = tokens.a as string;
  25  |   const tokenB = tokens.b as string;
  26  |   const authA = { Authorization: `Bearer ${tokenA}` };
  27  |   const authB = { Authorization: `Bearer ${tokenB}` };
  28  | 
  29  |   const created = await page.request.post("/api/sessions", { data: { title: "Isolation probe" }, headers: authA });
  30  |   expect(created.status()).toBe(200);
  31  |   const sessionId = ((await created.json()) as { session: { id: string } }).session.id;
  32  | 
  33  |   await page.request.post(`/api/sessions/${sessionId}/messages`, {
  34  |     data: { role: "user", text: "A private sentence only user A wrote." },
  35  |     headers: authA,
  36  |   });
  37  |   const corrected = await page.request.put(`/api/sessions/${sessionId}/understanding`, {
  38  |     data: {
  39  |       suggested_themes: ["work-pressure"],
  40  |       confirmed_themes: ["work-pressure"],
  41  |       support_need: "human-perspective",
  42  |       need_summary: "User A confirmed work pressure in their own words.",
  43  |       correction_count: 1,
  44  |     },
  45  |     headers: authA,
  46  |   });
  47  |   expect(corrected.status()).toBe(200);
  48  | 
  49  |   // Second user cannot read, extend, or understand user A's session.
  50  |   expect((await page.request.get(`/api/sessions/${sessionId}`, { headers: authB })).status()).toBe(404);
  51  |   expect(
  52  |     (await page.request.post(`/api/sessions/${sessionId}/messages`, { data: { role: "user", text: "intruder" }, headers: authB })).status(),
  53  |   ).toBe(404);
  54  | 
  55  |   // Owner resumes the full session in the browser.
  56  |   const host = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").hostname;
  57  |   await context.addCookies([{ name: "sb-access", value: tokenA, domain: host, path: "/", httpOnly: true }]);
  58  |   await page.goto("/app?path=talk");
  59  |   await expect(page.getByRole("heading", { name: "Your saved conversations" })).toBeVisible();
  60  |   await page.getByRole("button", { name: "Resume" }).first().click();
  61  |   await expect(page.getByText("A private sentence only user A wrote.", { exact: true })).toBeVisible();
  62  | 
  63  |   // Delete removes the session and its messages (verified by read-back).
  64  |   expect((await page.request.delete(`/api/sessions/${sessionId}`, { headers: authA })).status()).toBe(200);
  65  |   expect((await page.request.get(`/api/sessions/${sessionId}`, { headers: authA })).status()).toBe(404);
  66  | });
  67  | 
  68  | test("community: join, post with consent, reply, report, leave, and delete", async ({ page }) => {
  69  |   const tokens = liveTokens();
  70  |   test.skip(!tokens.a || !tokens.b, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  71  |   const authA = { Authorization: `Bearer ${tokens.a}` };
  72  |   const authB = { Authorization: `Bearer ${tokens.b}` };
  73  | 
  74  |   const info = await page.request.get(`/api/communities/${COMMUNITY}`);
  75  |   test.skip(info.status() !== 200, "Needs the seeded steady-ground community.");
  76  | 
  77  |   // Normalize membership in case a previous run failed midway.
  78  |   await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authA });
  79  |   await page.request.post(`/api/communities/${COMMUNITY}/leave`, { headers: authB });
  80  | 
  81  |   const joinA = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `RiverA${projectTag()}` }, headers: authA });
  82  |   expect(joinA.status()).toBe(200);
  83  |   expect((await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: "x" }, headers: authA })).status()).toBe(400);
  84  | 
  85  |   // Non-members cannot read member-only posts.
  86  |   expect((await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB })).status()).toBe(403);
  87  | 
  88  |   const stale = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
  89  |     data: { body: "Stale consent attempt.", consentVersion: "2000-01-01.0" },
  90  |     headers: authA,
  91  |   });
  92  |   expect(stale.status()).toBe(409);
  93  | 
  94  |   const created = await page.request.post(`/api/communities/${COMMUNITY}/posts`, {
  95  |     data: { body: "A real post from user A for lifecycle verification.", consentVersion: CONSENT_VERSION },
  96  |     headers: authA,
  97  |   });
  98  |   expect(created.status()).toBe(200);
  99  |   const postId = ((await created.json()) as { post: { id: string } }).post.id;
  100 | 
  101 |   const joinB = await page.request.post(`/api/communities/${COMMUNITY}/join`, { data: { alias: `RiverB${projectTag()}` }, headers: authB });
  102 |   expect(joinB.status()).toBe(200);
  103 |   const feed = await page.request.get(`/api/communities/${COMMUNITY}/posts`, { headers: authB });
  104 |   expect(feed.status()).toBe(200);
  105 |   expect(((await feed.json()) as { posts: { id: string }[] }).posts.map((post) => post.id)).toContain(postId);
  106 | 
  107 |   const reply = await page.request.post(`/api/communities/${COMMUNITY}/posts/${postId}/replies`, {
  108 |     data: { body: "A real reply from user B.", consentVersion: CONSENT_VERSION },
  109 |     headers: authB,
  110 |   });
  111 |   expect(reply.status()).toBe(200);
  112 | 
  113 |   // B cannot delete A's post; the author can.
  114 |   expect((await page.request.delete(`/api/communities/${COMMUNITY}/posts/${postId}`, { headers: authB })).status()).toBe(404);
  115 |   const reported = await page.request.post(`/api/communities/${COMMUNITY}/reports`, {
  116 |     data: { postId, reason: "Lifecycle probe report." },
```