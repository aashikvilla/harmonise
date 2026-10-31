import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3038";
const outDir = resolve(process.env.CAPTURE_OUT_DIR ?? "demo-iterations/v07/capture");
const webmPath = resolve(outDir, "react-capture.webm");
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: outDir, size: { width: 1600, height: 900 } }, reducedMotion: "reduce" });
const page = await context.newPage();
const sceneTimes = [];
const captureStarted = Date.now();
async function hold(seconds) { await page.waitForTimeout(process.env.FAST_CAPTURE === "1" ? 35 : seconds * 1000); }
async function scene(name) { sceneTimes.push({ name, seconds: (Date.now() - captureStarted) / 1000 }); await page.screenshot({ path: resolve(outDir, name + ".png") }); }
async function sendChat(text) { await page.getByRole("textbox", { name: "Your message" }).fill(text); await page.getByRole("button", { name: "Send" }).click(); }
async function showThread() {
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Communities" }).click();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Discussions" }).click();
  await page.locator(".historical-thread").scrollIntoViewIfNeeded();
}

// Real first-use screen, explicit choice and first typed interaction.
await page.goto(origin + "/", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: /For adults under family or relationship pressure/ }).waitFor();
await page.getByText("Interactive product preview", { exact: true }).waitFor();
await scene("01-first-use");
await hold(4);
await page.getByRole("button", { name: "Start privately" }).click();
await page.getByRole("textbox", { name: "Your message" }).waitFor();
await scene("02-start-privately");
await hold(4);
await sendChat("Things at home feel uncertain. My family keeps asking what I want, and I don't know yet.");
await page.getByRole("button", { name: "Not quite" }).waitFor();
await scene("03-first-interaction-local-rule");
await hold(14);

// The correction is continuous and user-authored; all response rules remain local.
await page.getByRole("button", { name: "Not quite" }).click();
await page.getByRole("button", { name: "Edit in my words" }).click();
const composer = page.getByRole("textbox", { name: "Your message" });
await composer.fill("I can talk with my partner. It's my parents. I want time to decide what I want.");
await scene("04-user-correction-draft");
await hold(11);
await page.getByRole("button", { name: "Send" }).click();
await page.getByText("I can talk with my partner. It's my parents. I want time to decide what I want.", { exact: true }).waitFor();
await page.getByText(/Planned, not connected:/).waitFor();
await scene("05-correction-and-planned-roles");
await hold(16);
await page.getByRole("button", { name: "Yes, that’s closer" }).click();
await page.getByRole("button", { name: "Hear experiences" }).click();
await page.getByRole("heading", { name: "Not just similar words. Similar situations." }).waitFor();
await page.getByRole("button", { name: "Explore community" }).first().click();
await page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 2 }).waitFor();
await page.getByRole("tab", { name: "Discussions" }).click();
await page.locator(".historical-thread").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Day 4 Naming the pressure/ }).waitFor();
await scene("06-day-4-thread");
await hold(17);

// One navigable prepared historical thread with distinct peer, host, unresolved and moderator roles.
await page.getByRole("button", { name: /Day 9 A conversation that stayed difficult/ }).click();
await page.getByText(/Thread host · fictional human community role/).waitFor();
await scene("07-day-9-thread");
await hold(16);
await page.getByRole("button", { name: /Flag directive reply · prepared example/ }).click();
await page.getByText(/Fictional moderator holds the directive reply from view/i).waitFor();
await page.locator(".prepared-triage").scrollIntoViewIfNeeded();
await scene("08-prepared-moderator-triage");
await hold(11);
await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
await page.getByText(/Side thread · no replies yet/).waitFor();
await scene("09-day-16-open-question");
await hold(18);

// Separate exact-audience Ravi preview; leave consent unchecked and send nothing.
await page.getByRole("tab", { name: "Experiences" }).click();
await page.locator(".story-card").filter({ hasText: "Ravi" }).getByRole("button", { name: "Read experience" }).click();
await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
await page.getByText(/Ravi accepts questions in the group only, not by private message/i).waitFor();
await scene("10-ravi-exact-audience-preview");
await hold(15);
await page.getByRole("button", { name: "Cancel · keep my draft" }).click();
await page.getByRole("button", { name: "Back to community" }).click();
await page.getByRole("tab", { name: "Discussions" }).click();

// Support caveat is an actual app route, with no directory or bookings.
await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Find Support" }).click();
await page.getByRole("button", { name: "Explore professional support" }).click();
await page.getByText(/No provider directory or credential checks are connected/i).waitFor();
await page.getByRole("heading", { name: "We don't have a verified provider for these preferences yet." }).waitFor();
await scene("11-professional-support-caveat");
await hold(4);

// Return to the actual Day 16 UI. End on the optional bounded preview, still private and unsent.
await showThread();
await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
await page.getByRole("button", { name: "Maybe later" }).click();
await scene("12-maybe-later-choice");
await hold(4);
await page.getByRole("button", { name: "Offer one thing that helped" }).click();
const finalPreview = page.locator(".dev-bounded-preview");
await finalPreview.scrollIntoViewIfNeeded();
await page.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).waitFor();
if (await finalPreview.getByRole("checkbox").isChecked()) throw new Error("The final preview consent must begin unchecked");
if (!(await finalPreview.getByRole("button", { name: "Post in this example group" }).isDisabled())) throw new Error("The final post must stay disabled without consent");
await scene("13-final-bounded-choice");
await hold(38);
await import("node:fs/promises").then(({ writeFile }) => writeFile(resolve(outDir, "timeline.json"), JSON.stringify(sceneTimes, null, 2) + "\n"));
await context.close();
await page.video().saveAs(webmPath);
await browser.close();
console.log(JSON.stringify({ webmPath, viewport: "1600x900", actualReactInteractions: true, sceneTimes }));
