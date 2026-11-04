import { expect, test } from "@playwright/test";

test("homepage presents the connected product and routes to real entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /You don't need the right words to begin/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /harmonize\. home/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "See how it feels" })).toHaveAttribute("href", "/connect");
  await expect(page.getByRole("link", { name: /Explore real communities/i })).toHaveAttribute("href", "/communities");
  await expect(page.getByRole("heading", { name: /AI can help with the words/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Muse Voice Transcribe/i })).toBeVisible();
  await expect(page.getByText(/intention, not a measured outcome/i)).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText(/fictional community|fictional response|sample member/i)).toHaveCount(0);
});

test("homepage actions open the real sign-in and community routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "See how it feels" }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole("heading", { name: /Share something difficult/i })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: /Explore real communities/i }).click();
  await expect(page).toHaveURL(/\/communities$/);
  await expect(page.getByRole("heading", { name: "Communities", exact: true })).toBeVisible();
});
