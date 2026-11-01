import { expect, test, type Locator, type Page } from "@playwright/test";

async function experience(page: Page): Promise<Locator> {
  await page.goto("/");
  const frame = page.frameLocator('iframe[title="Harmonize — a space for unfinished thoughts"]');
  await expect(frame.getByRole("heading", { name: /You don't need the right words to begin/i })).toBeVisible();
  return frame.locator("body");
}

test("homepage preserves the source illustration and reversible scroll journey", async ({ page }) => {
  const body = await experience(page);
  const frame = page.frameLocator("iframe");
  await expect(frame.locator("#hero-art svg.scene-svg")).toBeVisible();
  await expect(frame.locator("#hero-art svg path.hero-thread")).toHaveCount(1);
  await expect(frame.getByRole("link", { name: /Start privately/i })).toHaveAttribute("href", "./app/");

  const beyond = frame.locator("#beyond");
  await beyond.evaluate((element) => {
    const p = element.getBoundingClientRect().top + window.scrollY + element.clientHeight * 0.45;
    window.scrollTo(0, p);
  });
  await expect.poll(() => frame.locator("#beyond-sticky").evaluate((element) => element.style.getPropertyValue("--p"))).not.toBe("0");
  const forward = await frame.locator("#path-traveler").getAttribute("transform");
  await beyond.evaluate((element) => {
    const p = element.getBoundingClientRect().top + window.scrollY + element.clientHeight * 0.12;
    window.scrollTo(0, p);
  });
  await expect.poll(() => frame.locator("#path-traveler").getAttribute("transform")).not.toBe(forward);
  await expect(body).toBeVisible();
});

test("homepage primary action opens the product space", async ({ page }) => {
  const frame = page.frameLocator('iframe[title="Harmonize — a space for unfinished thoughts"]');
  await page.goto("/");
  await frame.getByRole("link", { name: /Start privately/i }).click();
  await expect(page).toHaveURL(/\/app\/?$/);
  await expect(page.getByRole("heading", { name: "I can’t tell my family what I want without feeling ungrateful." })).toBeVisible();
});

test("chat days replay, pause and restart with the authored fictional examples", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frame = page.frameLocator("iframe");
  await experience(page);
  await frame.getByRole("tab", { name: "Day 4" }).click();
  await expect(frame.locator("#conversation-scroll")).toContainText("Can we continue what I was talking about the other night?");
  await expect(frame.locator("#conversation-scroll")).toContainText("I don't want anyone to tell me what to choose.", { timeout: 15000 });
  await frame.getByRole("button", { name: "Restart chat replay" }).click();
  await expect(frame.locator("#conversation-scroll")).toContainText("Can we continue what I was talking about the other night?");
  await expect(frame.locator(".day-tab[aria-selected=true]")).toHaveAttribute("data-day", "4");
});

test("community filter, topic scenes, and keyboard tabs remain interactive", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frame = page.frameLocator("iframe");
  await experience(page);
  await frame.getByRole("button", { name: "Host perspective" }).click();
  await expect(frame.locator("#thread-messages")).toContainText("Ananya");
  await expect(frame.locator(".thread-line").filter({ hasText: "Nisha" })).toBeHidden();
  await frame.getByRole("button", { name: "Read conversation" }).click();
  await expect(frame.locator("#thread-messages")).toContainText("Nisha");

  const family = frame.getByRole("tab", { name: "Family" });
  await family.focus();
  await page.keyboard.press("ArrowRight");
  await expect(frame.getByRole("tab", { name: "Work" })).toHaveAttribute("aria-selected", "true");
  await expect(frame.locator('.chapter-art-scene[data-scene="1"]')).toHaveClass(/active/);
  await page.keyboard.press("ArrowRight");
  await expect(frame.getByRole("tab", { name: "Belonging" })).toHaveAttribute("aria-selected", "true");
  await expect(frame.locator('.chapter-art-scene[data-scene="2"]')).toHaveClass(/active/);
});

test("sharing is editable and local, with escape closure and focus return", async ({ page }) => {
  const frame = page.frameLocator("iframe");
  await experience(page);
  const trigger = frame.getByRole("button", { name: /Review a sharing choice/i });
  await trigger.click();
  const dialog = frame.getByRole("dialog", { name: "Only what you choose." });
  await expect(dialog).toBeVisible();
  await expect(frame.locator("#share-text")).toBeFocused();
  await frame.locator("#share-text").fill("Only this edited text should appear.");
  await frame.getByRole("button", { name: "Approve this sharing choice" }).click();
  await expect(frame.getByRole("status")).toHaveText("Choice saved in this browser. Nothing was posted or sent to anyone.");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("mobile menu works and reduced motion keeps all scenes readable without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const frame = page.frameLocator("iframe");
  await experience(page);
  const menu = frame.getByRole("button", { name: "Open navigation" });
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(frame.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await frame.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Communities" }).click();
  await expect(frame.getByRole("heading", { name: /A different view can change everything/i })).toBeVisible();
  await expect.poll(() => frame.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(frame.locator("#gather-scene-mobile")).toBeAttached();

  const captionsClearOfArt = await frame.locator(".community-illustration").evaluate((illustration) => {
    const art = illustration.querySelector("svg")!.getBoundingClientRect();
    const caption = illustration.querySelector(".art-small-note")!.getBoundingClientRect();
    return caption.top >= art.bottom;
  });
  expect(captionsClearOfArt).toBe(true);
  const careCaptionClearOfArt = await frame.locator(".care-story-art").evaluate((illustration) => {
    const art = illustration.querySelector("svg")!.getBoundingClientRect();
    const caption = illustration.querySelector(".care-art-caption")!.getBoundingClientRect();
    return caption.top >= art.bottom;
  });
  expect(careCaptionClearOfArt).toBe(true);
  await expect(frame.locator(".traveler-note")).toBeHidden();

  await page.setViewportSize({ width: 320, height: 800 });
  const headerClearance = await frame.locator(".site-header").evaluate((header) => {
    const logo = header.querySelector(".brand")!.getBoundingClientRect();
    const menuButton = header.querySelector(".mobile-menu-toggle")!.getBoundingClientRect();
    return { noOverlap: logo.right < menuButton.left, noPageOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth };
  });
  expect(headerClearance).toEqual({ noOverlap: true, noPageOverflow: true });
});

test("pointer depth and closing gathering animate and reverse when scrolling back", async ({ page }) => {
  const frame = page.frameLocator("iframe");
  await experience(page);
  const finePointer = await frame.locator("body").evaluate(() => matchMedia("(pointer:fine)").matches);
  if (finePointer) {
    await page.mouse.move(1120, 330);
    await expect.poll(() => frame.locator("#hero-art").getAttribute("style")).toContain("--mx");
    const parallax = await frame.locator("#hero-art").evaluate((element) => getComputedStyle(element).getPropertyValue("--mx"));
    expect(Number(parallax)).not.toBe(0);
  }

  const finale = frame.locator("#closing-gather");
  const setProgress = (value: number) => finale.evaluate((element, p) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.clientHeight * p);
  }, value);
  const gatherProgress = () => frame.locator(".closing-sticky").evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue("--gather")));
  await setProgress(0);
  await expect.poll(gatherProgress).toBeLessThan(0.001);
  const start = await frame.locator("#gather-scene .gather-person").first().getAttribute("transform");
  await setProgress(0.9);
  await expect.poll(gatherProgress).toBeGreaterThan(0.99);
  const end = await frame.locator("#gather-scene .gather-person").first().getAttribute("transform");
  expect(end).not.toBe(start);
  await setProgress(0);
  await expect.poll(gatherProgress).toBeLessThan(0.001);
  const back = await frame.locator("#gather-scene .gather-person").first().getAttribute("transform");
  const coordinates = (value: string | null) => (value?.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const [startX, startY] = coordinates(start);
  const [backX, backY] = coordinates(back);
  expect(Math.abs(backX - startX)).toBeLessThan(1);
  expect(Math.abs(backY - startY)).toBeLessThan(1);
});
