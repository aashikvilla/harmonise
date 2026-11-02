import { expect, test } from "@playwright/test";

test("demo sign-in leads from a private chat to an explicitly joined circle", async ({ page }) => {
  await page.route("**/api/advice", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reflection: "It sounds like family pressure is making it harder to hear what you want for yourself.",
        steps: [
          "Write down what matters to you before discussing the decision again.",
          "Choose one small routine that can make this week feel steadier.",
        ],
        perspective: "You can take time to understand your own priorities before deciding what to do.",
        matches: [{ id: "steady-ground", reason: "This circle discusses family pressure and small routines at a gentle pace." }],
      }),
    });
  });

  await page.goto("/");
  const homepage = page.frameLocator('iframe[title="Harmonize — a space for unfinished thoughts"]');
  await homepage.getByRole("link", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole("button", { name: "Sign in and continue to chat" })).toBeEnabled();

  // Exercise both entry tabs before continuing through the member demo.
  await page.getByRole("tab", { name: "Coach preview" }).click();
  await page.getByRole("tab", { name: "Member demo" }).click();
  await page.getByLabel("I confirm I am 18 or older.").check();
  await page.getByLabel("I understand my message will be sent to Meta Muse Spark for a response.").check();
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(2);
  await expect(page.locator('input[type="checkbox"]').nth(0)).toBeChecked();
  await expect(page.locator('input[type="checkbox"]').nth(1)).toBeChecked();
  await page.getByRole("button", { name: "Sign in and continue to chat" }).click();
  await expect(page).toHaveURL(/\/connect\/member$/);
  await expect(page.getByRole("heading", { name: "Find connection" })).toBeVisible();

  await page.getByLabel("Share what is happening").fill(
    "My family keeps pressuring me about a relationship decision. The pressure is disrupting my routine, and I want a calm way to think through what I actually want.",
  );
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("It sounds like family pressure is making it harder to hear what you want for yourself.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Communities that may understand" })).toHaveCount(0);

  await page.getByRole("button", { name: /show relevant communities/i }).click();
  await expect(page.getByRole("heading", { name: "Finding steady ground" })).toBeVisible();
  await page.getByRole("button", { name: /Join as alias/ }).click();
  await page.getByRole("button", { name: "Open in My circles" }).click();

  await expect(page.getByRole("heading", { name: "My circles" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Finding steady ground" })).toBeVisible();
  await expect(page.getByText("What is one routine — however small — that steadied you this week?")).toBeVisible();
  await expect(page.getByText("Prototype circle", { exact: true })).toBeVisible();
});
