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

test("signed-out visitors are told a saved account is required before chatting", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Talk it through, at your pace." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to start a saved conversation" })).toBeVisible();
  await expect(page.getByText(/Your conversation is saved to your account/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an account or use the shared demo account" })).toHaveAttribute("href", "/connect");
});
