import { expect, test } from "@playwright/test";

/**
 * Durable private sessions (Phase 4): signed-out guards. All tests skip
 * when Supabase is not configured. The stateful session journey lives in
 * live-journeys.spec.ts so it runs serially against the shared test users.
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
