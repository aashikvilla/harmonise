import { expect, test } from "@playwright/test";

/**
 * Real community lifecycle (Phase 5): public directory and signed-out
 * guards. Skips without a configured Supabase backend. The stateful member
 * journeys live in live-journeys.spec.ts so they run serially against the
 * shared test users.
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
