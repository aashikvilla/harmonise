import { expect, test } from "@playwright/test";

test("private conversation uses the Harmonise design tokens and presents a signed-out state", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 401, json: { error: "signed-out" } }));
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "Talk it through, at your pace." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sign in to start a saved conversation" })).toBeVisible();
  const styles = await page.evaluate(() => ({
    paper: getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
    coral: getComputedStyle(document.documentElement).getPropertyValue("--teal").trim(),
    serif: getComputedStyle(document.documentElement).getPropertyValue("--serif").trim(),
  }));
  expect(styles.paper).toBe("#fffaf5");
  expect(styles.coral).toBe("#af554f");
  expect(styles.serif).toContain("Georgia");
  await expect(page.getByRole("link", { name: "Communities" })).toBeVisible();
});

test("voice transcription is discoverable in the signed-in private conversation", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ status: 200, json: { id: "member-1", email: "fern@example.com" } }));
  await page.route("**/api/sessions", (route) => route.fulfill({ json: { sessions: [] } }));
  await page.goto("/app");
  await expect(page.getByRole("region", { name: "Private AI conversation" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record a voice message" })).toBeVisible();
  await expect(page.getByText("Voice is transcribed by Meta. Review and edit the transcript before sending it to the adviser.")).toBeVisible();
});
