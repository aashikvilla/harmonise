import { expect, test } from "@playwright/test";

test("product screens carry the Motion Revival identity into the Harmonize experience", async ({ page }) => {
  await page.goto("/app?path=talk");

  await expect(page.getByRole("link", { name: "Harmonize home" })).toBeVisible();
  await expect(page.locator(".brand-symbol path")).toHaveAttribute("d", /M8 23C8 14/);
  await expect(page.getByRole("heading", { name: "You can start anywhere." })).toBeVisible();

  const theme = await page.evaluate(() => ({
    paper: getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
    coral: getComputedStyle(document.documentElement).getPropertyValue("--teal").trim(),
    serif: getComputedStyle(document.documentElement).getPropertyValue("--serif").trim(),
  }));
  expect(theme.paper).toEqual("#fffaf5");
  expect(theme.coral).toEqual("#af554f");
  expect(theme.serif).toContain('"DM Serif Display"');
  expect(theme.serif).toContain("Georgia");

  await page.getByRole("button", { name: "Communities", exact: true }).click();
  await expect(page.locator(".community-card").first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => page.locator(".screen-content").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
});
