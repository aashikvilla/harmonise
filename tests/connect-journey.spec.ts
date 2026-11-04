import { test, expect, type Page } from "@playwright/test";

const CONTRIBUTIONS = [{
  communityId: "community-1",
  communityName: "Rebuilding circle",
  alias: "Quiet Fern",
  role: "member",
  posts: [{ id: "post-1", body: "First weekend in the new place, cooked a real dinner.", status: "visible", createdAt: "2026-01-02T10:00:00.000Z", replyCount: 2, thanks: 3 }],
  replies: 4,
  thanksReceived: 3,
  level: "Contributor",
}];

const OPEN_PROMOTION = { requests: [{ id: "req-1", community_id: "community-1", requested_role: "volunteer", note: "Happy to welcome new members.", status: "open", reviewer_rationale: "", created_at: "2026-01-03T10:00:00.000Z" }] };

async function mockAuth(page: Page) {
  let signedIn = false;
  await page.route("**/api/auth/me", (route) => route.fulfill({
    status: signedIn ? 200 : 401,
    contentType: "application/json",
    body: signedIn ? '{"id":"member-1","email":"fern@example.com"}' : '{"error":"signed-out"}',
  }));
  await page.route("**/api/auth/password", (route) => {
    signedIn = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
}

async function enterMember(page: Page) {
  await page.goto("/connect");
  await page.getByLabel("Email", { exact: true }).fill("fern@example.com");
  await page.getByLabel("Password", { exact: true }).fill("safe-test-password-123");
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/connect\/member$/);
  await expect(page.getByRole("heading", { name: "Find connection" })).toBeVisible();
}

test.describe("Member data uses API records", () => {
  test("contribution tab shows the returned record and no invented milestones", async ({ page }) => {
    await mockAuth(page);
    await page.route("**/api/account/contributions", (route) => route.fulfill({ status: 200, json: { contributions: CONTRIBUTIONS } }));
    await page.route("**/api/communities/*/promotions", (route) => route.fulfill({ status: 200, json: OPEN_PROMOTION }));
    await enterMember(page);
    await expect(page.getByText("1 posts · 1 circles")).toBeVisible();
    await expect(page.getByText("Helpfulness points")).toHaveCount(0);

    await page.getByRole("button", { name: "My contributions" }).click();
    const contributions = page.locator('section[aria-label="Your community contributions"]');
    await expect(contributions.getByText("1 posts", { exact: true })).toBeVisible();
    await expect(contributions.getByText(/1 circles · 4 replies · 3 thanks received/)).toBeVisible();
    await expect(contributions.getByText(/Rebuilding circle ·/)).toBeVisible();
    await expect(contributions.getByText(/First weekend in the new place/)).toBeVisible();
    await expect(page.getByText(/Named what I'm going through/)).toHaveCount(0);
  });

  test("supporter requests show their human review state without preview profiles", async ({ page }) => {
    await mockAuth(page);
    await page.route("**/api/account/contributions", (route) => route.fulfill({ status: 200, json: { contributions: CONTRIBUTIONS } }));
    await page.route("**/api/communities/*/promotions", (route) => route.fulfill({ status: 200, json: OPEN_PROMOTION }));
    await enterMember(page);
    await page.getByRole("button", { name: "Support Coaches" }).click();
    await expect(page.getByText(/does not publish a coach roster/)).toBeVisible();
    await expect(page.getByText("Amara A.")).toHaveCount(0);
    await expect(page.getByText(/waiting for a moderator review/).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Request volunteer review" })).toHaveCount(0);
    await page.getByRole("button", { name: "Your supporter applications" }).click();
    const dialog = page.getByRole("dialog", { name: "Your supporter applications" });
    await expect(dialog.getByText(/waiting for a moderator/)).toBeVisible();
  });

  test("empty and unavailable states are explicit instead of presenting sample activity", async ({ page }) => {
    await mockAuth(page);
    await page.route("**/api/account/contributions", (route) => route.fulfill({ status: 200, json: { contributions: [] } }));
    await enterMember(page);
    await page.getByRole("button", { name: "My contributions" }).click();
    await expect(page.getByText(/You have not joined a circle yet/)).toBeVisible();
    await expect(page.getByText("0 posts", { exact: true })).toBeVisible();
    await expect(page.getByText(/named what I'm going through/i)).toHaveCount(0);
  });
});
