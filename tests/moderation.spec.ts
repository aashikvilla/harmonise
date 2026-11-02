import { expect, test } from "@playwright/test";
import { liveTokens } from "./live-users";

/**
 * Moderation pipeline (Phase 6): guards and the read-only flags feed (needs
 * TEST_USER_A_JWT and TEST_MODERATOR_JWT). Skips without a configured
 * Supabase backend. The stateful reviewer journey lives in
 * live-journeys.spec.ts so it runs serially against the shared test users.
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
  const tokens = liveTokens();
  test.skip(!tokens.a || !tokens.mod, "Needs TEST_USER_A_JWT and TEST_MODERATOR_JWT.");
  const authA = { Authorization: `Bearer ${tokens.a}` };
  const authM = { Authorization: `Bearer ${tokens.mod}` };
  expect((await page.request.get(`/api/moderation/flags?community=${COMMUNITY}`, { headers: authA })).status()).toBe(403);
  const flags = await page.request.get(`/api/moderation/flags?community=${COMMUNITY}`, { headers: authM });
  expect(flags.status()).toBe(200);
  expect(Array.isArray(((await flags.json()) as { flags: unknown[] }).flags)).toBe(true);
});
