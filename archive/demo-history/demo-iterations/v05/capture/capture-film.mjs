import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3038";
const outDir = resolve("demo-iterations/v05/capture");
const webmPath = resolve(outDir, "react-capture.webm");
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: outDir, size: { width: 1600, height: 900 } }, reducedMotion: "reduce" });
const page = await context.newPage();

async function hold(seconds) { await page.waitForTimeout(process.env.FAST_CAPTURE === "1" ? 25 : seconds * 1000); }
async function scene(name) { await page.screenshot({ path: resolve(outDir, name + ".png") }); }
async function sendChat(text) {
  await page.getByRole("textbox", { name: "Your message" }).fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}
async function atBottom(selector) { await page.locator(selector).evaluate((element) => { element.scrollTop = element.scrollHeight; }); }
async function goToFamilyDiscussions() {
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Communities" }).click();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Discussions" }).click();
  await atBottom(".tab-panel");
}

// First use: clean entry, real talk/read choices, one short fictional line.
await page.goto(origin + "/demo/", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "A place to begin, at your pace" }).waitFor();
await scene("01-clean-entry");
await hold(7);
await page.getByRole("button", { name: "Talk something through" }).click();
await page.getByRole("heading", { name: "You can start anywhere." }).waitFor();
await scene("02-talk-choice");
await hold(5);
await sendChat("I feel ungrateful asking my parents for room to think.");
await page.getByText(/We can keep it broad/i).waitFor();
await scene("03-one-line-local-response");
await hold(9);

// Correct a tentative interpretation using actual controls and local rules.
await page.getByRole("button", { name: "Something with someone" }).click();
await hold(3);
await sendChat("My parents want an answer now. I need time to work out what I want.");
await page.getByRole("heading", { name: "Have I got this right?" }).waitFor();
await scene("04-tentative-context");
await hold(6);
await page.getByRole("button", { name: "Not quite" }).click();
await scene("05-not-quite");
await hold(3);
await page.getByRole("button", { name: "Edit in my words" }).click();
const composer = page.getByRole("textbox", { name: "Your message" });
await composer.fill("I want room to think before I decide what I want to say to my parents.");
await scene("06-user-correction-draft");
await hold(5);
await page.getByRole("button", { name: "Send" }).click();
await page.getByText("I want room to think before I decide what I want to say to my parents.", { exact: true }).waitFor();
await scene("07-correction-and-local-rule");
await hold(8);
await page.getByRole("button", { name: "Yes, that’s closer" }).click();
await page.getByRole("button", { name: "Hear experiences" }).click();
await page.getByRole("heading", { name: "Not just similar words. Similar situations." }).waitFor();
await scene("08-user-selected-family-result");
await hold(8);

// Actual React group and Ravi consent controls.
await page.getByRole("button", { name: "Explore community" }).first().click();
await page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 1 }).waitFor();
await page.getByRole("button", { name: "Join this example group" }).click();
await page.getByRole("tab", { name: "Experiences" }).click();
await page.locator(".story-card").filter({ hasText: "Ravi" }).getByRole("button", { name: "Read experience" }).click();
await page.getByRole("heading", { name: "One person's experience" }).waitFor();
await page.getByRole("heading", { name: "Ravi accepts replies in the group only" }).waitFor();
await scene("09-ravi-group-only");
await hold(8);
await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
await page.getByLabel("Your alias").fill("QuietRiver");
await page.getByLabel("Your question").fill("When you needed a pause, what words helped you slow the conversation?");
await page.getByText(/Ravi accepts questions in the group only, not by private message/i).waitFor();
await scene("10-ravi-exact-consent");
await hold(14);
await page.getByRole("checkbox", { name: /I reviewed this exact alias, audience and question/i }).check();
await page.getByRole("button", { name: "Continue to prepared response" }).click();
await page.getByRole("heading", { name: "A perspective from Ravi" }).waitFor();
await page.getByText(/Prepared illustrative group reply/i).waitFor();
await scene("11-prepared-ravi-sample");
await hold(8);

// Bounded contribution with separate private notes, exact audience preview, and consent.
await goToFamilyDiscussions();
const contribution = "I still don't have an answer. One thing I tried was asking for time to think before replying. We argued, and I'm still working out what I want.";
await page.getByLabel("Your words, only if you choose to share").fill(contribution);
await page.getByRole("button", { name: "Preview audience and text" }).click();
await page.getByText(/Your private conversation is not included/i).waitFor();
await scene("12-dev-contribution-preview");
await hold(12);
await page.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).check();
await page.getByRole("button", { name: "Post in this example group" }).click();
await page.getByText(contribution, { exact: true }).waitFor();
await page.getByText(/Not published or visible to other people/i).waitFor();
await scene("13-local-contribution-posted");
await hold(10);

// Existing React professional-support caveat; no provider is verified/bookable.
await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Find Support" }).click();
await page.getByRole("heading", { name: "Find Support" }).waitFor();
await page.getByRole("button", { name: "Explore professional support" }).click();
await page.getByRole("heading", { name: "Professional and community team" }).waitFor();
await page.getByText(/No provider directory or credential checks are connected/i).waitFor();
await page.getByRole("heading", { name: "We don't have a verified provider for these preferences yet." }).waitFor();
await scene("14-professional-support-caveat");
await hold(8);

// Planned architecture status card, clearly disconnected.
await page.evaluate(() => {
  const overlay = document.createElement("div");
  overlay.id = "v05-architecture";
  overlay.innerHTML = "<div class='v05-status'>PLANNED META INTEGRATION · NOT CONNECTED IN THIS PREVIEW</div><h2>Proposed roles, not running services</h2><div class='v05-cards'><article><b>Planned Meta Muse Spark</b><p>Dialogue and structured, correctable context</p></article><article><b>Planned Muse Voice Transcribe</b><p>Optional speech-to-text, reviewed before sending</p></article></div><div class='v05-boundary'><span>Approved material only · sources and audience remain visible</span><span>Human moderator decision · no report is routed or permissions enforced here</span></div>";
  overlay.style.cssText = "position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;justify-content:center;gap:24px;padding:70px 8%;background:#f7f6f2;color:#202722;font-family:system-ui,sans-serif";
  const style = document.createElement("style");
  style.textContent = "#v05-architecture .v05-status{font-size:15px;font-weight:800;letter-spacing:.09em;color:#245e51}#v05-architecture h2{margin:0;font:500 46px/1.08 Georgia,serif}#v05-architecture .v05-cards{display:grid;grid-template-columns:1fr 1fr;gap:24px}#v05-architecture article{min-height:150px;padding:24px;border:2px solid #315f52;border-radius:12px;background:#fffefa}#v05-architecture article b{font-size:26px}#v05-architecture article p{margin:12px 0 0;font-size:23px;line-height:1.25}#v05-architecture .v05-boundary{display:flex;justify-content:space-between;gap:25px;padding-top:20px;border-top:2px solid #cbd8ce;font-size:17px;font-weight:650}";
  document.head.append(style);
  document.body.append(overlay);
});
await scene("15-planned-architecture-status");
await hold(10);
await page.evaluate(() => {
  document.getElementById("v05-architecture")?.remove();
  document.querySelectorAll("style").forEach((style) => { if (style.textContent.includes("#v05-architecture")) style.remove(); });
});

// Return to the actual local contribution feed for the human ending.
await goToFamilyDiscussions();
await page.evaluate(() => {
  const overlay = document.createElement("div");
  overlay.id = "v05-agency";
  overlay.innerHTML = "<strong>He still has questions.</strong><span>One day, if he chooses, he can offer someone else one honest part of what he tried—and keep the rest private.</span>";
  overlay.style.cssText = "position:fixed;left:10%;right:10%;bottom:28px;z-index:100000;display:flex;align-items:center;justify-content:center;gap:24px;padding:16px 24px;border:2px solid #315f52;border-radius:12px;background:rgba(255,254,250,.97);color:#202722;font:600 20px/1.25 system-ui,sans-serif";
  document.body.append(overlay);
});
await scene("16-arjun-agency-close");
await hold(14);
await page.evaluate(() => document.getElementById("v05-agency")?.remove());

await context.close();
const video = page.video();
await video.saveAs(webmPath);
await browser.close();
console.log(JSON.stringify({ webmPath, viewport: "1600x900", actualReactInteractions: true }));
