import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseURL = process.env.HOMEPAGE_BASE_URL ?? "http://127.0.0.1:3000";
const output = fileURLToPath(new URL("../docs/harmonize-homepage/screenshots/comparison/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });

async function compareViewport(prefix, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const version of ["reference", "next"]) {
    await page.goto(version === "reference" ? `${baseURL}/harmonize-motion-revival.html` : baseURL);
    const frame = version === "reference" ? page.mainFrame() : page.frame({ url: /harmonize-motion-revival\.html/ });
    if (!frame) throw new Error(`Missing ${version} document at ${prefix}`);
    const shot = (name) => page.screenshot({ path: path.join(output, `${prefix}-${name}-${version}.png`) });
    const scrollTo = async (selector, fraction = 0) => frame.locator(selector).evaluate((element, value) => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, element.getBoundingClientRect().top + scrollY + element.clientHeight * value);
    }, fraction);

    await shot("hero");
    await scrollTo("#beyond", 0.45);
    await shot("beyond");
    await scrollTo("#experience");
    await frame.getByRole("tab", { name: "Day 1", exact: true }).click();
    await frame.getByRole("button", { name: "Pause chat replay" }).click();
    await shot("conversation");
    await scrollTo("#communities");
    await shot("community");
    await scrollTo("#reciprocity");
    await shot("reciprocity");
    await scrollTo("#chapters");
    await shot("chapter-family");
    await frame.getByRole("tab", { name: "Work" }).click();
    await shot("chapter-work");
    await frame.getByRole("tab", { name: "Belonging" }).click();
    await shot("chapter-belonging");
    await scrollTo(".care-section");
    await shot("care");
    await scrollTo("#closing-gather", 0.01);
    await shot("gather-start");
    await scrollTo("#closing-gather", 0.96);
    await shot("gather-end");
  }
  await context.close();
}

try {
  await compareViewport("desktop", { width: 1440, height: 900 });
  await compareViewport("mobile", { width: 390, height: 844 });
} finally {
  await browser.close();
}
