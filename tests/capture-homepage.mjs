import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.HOMEPAGE_BASE_URL ?? "http://127.0.0.1:3000";
const output = fileURLToPath(new URL("../docs/harmonize-homepage/screenshots/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});

async function capture(viewport, prefix) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`${baseURL}/harmonize-motion-revival.html`);
  await page.screenshot({ path: path.join(output, `${prefix}-hero-reference.jpg`), type: "jpeg", quality: 88 });
  await page.goto(baseURL);
  const frame = page.frameLocator("iframe");
  await frame.locator("#hero-art").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(output, `${prefix}-hero-next.jpg`), type: "jpeg", quality: 88 });

  const scrollTo = async (selector, fraction = 0) => frame.locator(selector).evaluate((element, value) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY + element.clientHeight * value);
  }, fraction).then(() => page.waitForTimeout(900));
  const snap = async (name) => page.screenshot({ path: path.join(output, `${prefix}-${name}.jpg`), type: "jpeg", quality: 88 });

  await scrollTo("#beyond", 0.45);
  await snap("beyond-mid");
  await scrollTo("#experience");
  await snap("conversation");
  await scrollTo("#communities");
  await snap("community");
  await scrollTo("#reciprocity");
  await snap("reciprocity");
  await scrollTo("#chapters");
  await snap("chapter-family");
  await frame.getByRole("tab", { name: "Work" }).click();
  await scrollTo("#chapters");
  await page.waitForTimeout(850);
  await snap("chapter-work");
  await frame.getByRole("tab", { name: "Belonging" }).click();
  await scrollTo("#chapters");
  await page.waitForTimeout(850);
  await snap("chapter-belonging");
  await scrollTo(".care-section");
  await snap("care");
  await scrollTo("#closing-gather", 0.01);
  await snap("gather-start");
  await scrollTo("#closing-gather", 0.96);
  await snap("gather-end");
  await context.close();
  if (errors.length) throw new Error(`${prefix} browser errors: ${errors.join("; ")}`);
}

try {
  await capture({ width: 1440, height: 900 }, "desktop");
  await capture({ width: 390, height: 844 }, "mobile");
} finally {
  await browser.close();
}
