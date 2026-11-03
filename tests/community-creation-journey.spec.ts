import { expect, test } from "@playwright/test";

/** Complete browser journey with isolated API fixtures; never writes to the live Supabase project. */
test("propose, review, and enter a community with its scoped helper and activity level", async ({ page }) => {
  let signedIn = false;
  let approved = false;
  const createdId = "new-parent-circle-a1b2c3d4";
  let proposalBody: Record<string, unknown> | null = null;
  let reviewBody: Record<string, unknown> | null = null;

  await page.route("**/api/auth/config", (route) => route.fulfill({ json: { databaseEnabled: true, authEnabled: true } }));
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? { id: "fixture-user" } : { error: "signed-out" } }));
  await page.route("**/api/auth/otp", (route) => route.fulfill({ json: { ok: true } }));
  await page.route("**/api/auth/verify", async (route) => {
    signedIn = true;
    await route.fulfill({ json: { ok: true } });
  });

  await page.route("**/api/communities", async (route) => {
    if (route.request().method() === "GET") {
      const communities = approved
        ? [{ id: createdId, name: "New parent circle", description: "A calm space for new parents to share practical support.", topics: ["New parents"], visibility: "member", launch_status: "approved", memberCount: 2, postCount: 0 }]
        : [{ id: "steady-ground", name: "Steady Ground", description: "A real community for practical support.", visibility: "public", launch_status: "approved", memberCount: 12, postCount: 8 }];
      await route.fulfill({ json: { communities } });
      return;
    }
    proposalBody = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({ status: 201, json: {
      community: { id: createdId, name: "New parent circle", description: "A calm space for new parents to share practical support.", launch_status: "pending_review" },
      agent: { displayName: "harmonize. New parent circle AI community helper", status: "active", disclosure: "AI helper. Advisory triage only." },
    } });
  });

  await page.route(`**/api/communities/${createdId}`, async (route) => route.fulfill({ json: { community: {
    id: createdId,
    name: "New parent circle",
    description: "A calm space for new parents to share practical support.",
    topics: ["New parents"],
    visibility: "member",
    launch_status: approved ? "approved" : "pending_review",
    memberCount: 1,
    postCount: 0,
  } } }));
  await page.route(`**/api/communities/${createdId}/membership`, (route) => route.fulfill({ json: { membership: { id: "membership-fixture", alias: "Quiet River", role: "member", status: "active" } } }));
  await page.route(`**/api/communities/${createdId}/blocks`, (route) => route.fulfill({ json: { blocked: [] } }));
  await page.route(`**/api/communities/${createdId}/agent`, (route) => route.fulfill({ json: { agent: { displayName: "harmonize. New parent circle AI community helper", status: "active", disclosure: "AI helper. Advisory triage only." } } }));
  await page.route(`**/api/communities/${createdId}/posts`, (route) => route.fulfill({ json: { posts: [], moderator: approved } }));
  await page.route(`**/api/communities/${createdId}/progress`, (route) => route.fulfill({ json: {
    level: "contributor",
    contributions: 3,
    activeDays: 2,
    thresholds: { contributor: { contributions: 3, activeDays: 2 }, communityRegular: { contributions: 10, activeDays: 5 } },
    verification: { enabled: false },
  } }));
  await page.route("**/api/communities/review", (route) => route.fulfill({ json: { proposals: approved ? [] : [{ id: createdId, name: "New parent circle", purpose: "A calm space for new parents to share practical support.", topics: ["New parents"], createdAt: "2026-11-02T00:00:00.000Z" }] } }));
  await page.route(`**/api/communities/${createdId}/review`, async (route) => {
    reviewBody = route.request().postDataJSON() as Record<string, unknown>;
    approved = true;
    await route.fulfill({ json: { community: { id: createdId, launch_status: "approved" } } });
  });
  await page.route("**/api/moderation/assignments", (route) => route.fulfill({ json: { assignments: [] } }));

  await page.goto("/communities");
  await expect(page.getByRole("heading", { name: "Communities", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Suggest a community" }).first().click();
  await expect(page.getByRole("heading", { name: "Make room for a new circle" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to suggest a community" })).toBeVisible();

  await page.getByLabel("Email for a sign-in code").fill("demo@example.test");
  await page.getByRole("button", { name: "Email me a code" }).click();
  await page.getByLabel("6-digit code from your email").fill("123456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByLabel("Community name")).toBeVisible();
  await page.getByLabel("Community name").fill("New parent circle");
  await page.getByLabel("What would people come together around?").fill("A calm space for new parents to share practical support.");
  await page.getByLabel(/Topics/).fill("New parents");
  await page.getByRole("button", { name: "Suggest this community" }).click();

  await expect(page.getByText("Waiting for human review").first()).toBeVisible();
  await expect(page.getByText(/It can flag content for a human reviewer/)).toBeVisible();
  expect(proposalBody).toEqual({ name: "New parent circle", description: "A calm space for new parents to share practical support.", topics: ["New parents"] });

  await page.getByRole("link", { name: "View your proposal" }).click();
  await expect(page).toHaveURL(new RegExp(`/communities/${createdId}$`), { timeout: 20000 });
  await expect(page.getByText("This proposal is private.")).toBeVisible();
  await expect(page.getByRole("heading", { name: /AI community helper/ })).toBeVisible();
  await expect(page.getByText(/Human replies depend on people being available/)).toBeVisible();

  await page.goto("/moderation");
  await expect(page.getByRole("heading", { name: "Community proposals" })).toBeVisible();
  await page.getByLabel("I have confirmed a named human moderator and coverage for this community.").check();
  await page.getByRole("button", { name: "Approve community launch" }).click();
  await expect(page.getByRole("status").filter({ hasText: "approved for launch" })).toBeVisible();
  expect(reviewBody).toEqual({ coverageConfirmed: true });

  await page.goto(`/communities/${createdId}`);
  await expect(page.getByRole("heading", { name: "New parent circle", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contributor" })).toBeVisible();
  await expect(page.getByText("3 contributions")).toBeVisible();
  await expect(page.getByText("Human-verified role:")).toHaveCount(0);
  await expect(page.getByText(/AI helper/).first()).toBeVisible();
});
