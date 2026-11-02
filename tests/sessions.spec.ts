import { expect, test } from "@playwright/test";

/**
 * Durable private sessions (Phase 4). All tests skip when Supabase is not
 * configured. The full create → resume → correct → delete journey plus the
 * second-user isolation check additionally need TEST_USER_A_JWT and
 * TEST_USER_B_JWT (Supabase Auth user JWTs for two test accounts).
 */

test.beforeEach(async ({ page }) => {
  const config = await page.request.get("/api/auth/config");
  const body = (await config.json().catch(() => null)) as { databaseEnabled?: unknown } | null;
  test.skip(body?.databaseEnabled !== true, "Durable sessions need a configured Supabase backend.");
});

test("session APIs deny signed-out callers and reject malformed ids", async ({ page }) => {
  expect((await page.request.get("/api/sessions")).status()).toBe(401);
  expect((await page.request.post("/api/sessions", { data: { title: "x" } })).status()).toBe(401);
  expect((await page.request.get("/api/sessions/not-a-uuid")).status()).toBe(400);
  expect((await page.request.get("/api/account/export")).status()).toBe(401);
});

test("signed-out visitors are offered an optional private account", async ({ page }) => {
  await page.goto("/app?path=talk");
  await expect(page.getByRole("heading", { name: "Save and resume across devices" })).toBeVisible();
  await expect(page.getByText(/stored for you alone and expire after 90 days/i)).toBeVisible();
  await expect(page.getByText(/Nothing is shared with any community/i)).toBeVisible();
});

const hasTestUsers = Boolean(process.env.TEST_USER_A_JWT && process.env.TEST_USER_B_JWT);

test("create, resume, correct, delete, and second-user isolation", async ({ page, context }) => {
  test.skip(!hasTestUsers, "Needs TEST_USER_A_JWT and TEST_USER_B_JWT.");
  const tokenA = process.env.TEST_USER_A_JWT as string;
  const tokenB = process.env.TEST_USER_B_JWT as string;
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
