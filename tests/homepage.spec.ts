import { expect, test } from "@playwright/test";

test("homepage presents the connected product and routes to real entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /A place to think things through/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start a conversation" })).toHaveAttribute("href", "/connect");
  await expect(page.getByRole("link", { name: "Explore communities" })).toHaveAttribute("href", "/communities");
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText(/fictional community|fictional response|sample member/i)).toHaveCount(0);
});

test("homepage actions open the real sign-in and community routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start a conversation" }).click();
  await expect(page).toHaveURL(/\/connect$/);
  await expect(page.getByRole("heading", { name: /Share something difficult/i })).toBeVisible();
});
