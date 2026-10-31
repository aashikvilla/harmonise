import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3022";
const outDir = resolve("demo-iterations/v01/capture");
const webmPath = resolve(outDir, "react-capture.webm");
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: outDir, size: { width: 1600, height: 900 } }, reducedMotion: "reduce" });
const page = await context.newPage();

async function hold(seconds) {
  await page.waitForTimeout(process.env.FAST_CAPTURE === "1" ? 25 : seconds * 1000);
}

async function scene(name) {
  await page.screenshot({ path: resolve(outDir, `${name}.png`) });
}

await page.goto(`${origin}/demo?scenario=arjun`, { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "You can start anywhere." }).waitFor();
await page.evaluate(() => {
  const label = document.createElement("div");
  label.textContent = "INTERACTIVE PRODUCT PREVIEW · FICTIONAL SAMPLE SCENARIOS";
  label.style.cssText = "position:fixed;right:28px;top:16px;z-index:99999;padding:7px 11px;border:1px solid #95a89b;border-radius:99px;background:rgba(255,254,250,.94);color:#315f52;font:600 12px/1.25 system-ui,sans-serif;letter-spacing:.04em;pointer-events:none";
  label.id = "film-preview-label";
  document.body.append(label);
  const headerStatus = document.querySelector(".header-status");
  if (headerStatus) headerStatus.setAttribute("data-preview-hidden", "true");
  const style = document.createElement("style");
  style.id = "film-preview-style";
  style.textContent = ".header-status[data-preview-hidden='true']{visibility:hidden}";
  document.head.append(style);
});

// 0:00–0:14 · Hook: the first visit holds an unresolved feeling and a clear refusal.
await page.getByRole("button", { name: /Day 1 Something feels strange/ }).click();
await page.locator(".chat-log").evaluate((element) => { element.scrollTop = element.scrollHeight; });
await scene("01-hook");
await hold(14);
await page.evaluate(() => {
  document.getElementById("film-preview-label")?.remove();
  document.getElementById("film-preview-style")?.remove();
  document.querySelector(".header-status")?.removeAttribute("data-preview-hidden");
});

// 0:14–0:40 · Day 4 correction and editable transcript review.
await page.getByRole("button", { name: /Day 4 Correcting the assumption/ }).click();
await page.locator(".chat-log").evaluate((element) => { element.scrollTop = element.scrollHeight; });
await scene("02-day-four");
await hold(13);
await page.getByRole("button", { name: "Review sample transcript" }).click();
await page.getByRole("textbox", { name: "Your transcript" }).fill("I want to ask Dad for a little time before I answer.");
await scene("03-transcript-review");
await hold(13);

// 0:40–1:01 · Confirm the corrected family context and compare the mismatch with grounded stories.
await page.getByRole("button", { name: "Yes, that’s closer" }).click();
await page.getByRole("button", { name: "Hear experiences" }).click();
await page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 2 }).waitFor();
await scene("04-understanding-shift");
await hold(13);
await page.getByRole("button", { name: "Not for me · change these results" }).click();
await scene("05-grounded-match");
await hold(8);

// 1:01–1:17 · Day 9 preparation, then the disappointing Day 16 return.
await page.getByRole("button", { name: "My Space", exact: true }).click();
await page.getByRole("button", { name: /Day 9 A conversation/ }).click();
await page.locator(".chat-log").evaluate((element) => { element.scrollTop = 0; });
await scene("06-day-nine");
await hold(8);
await page.getByRole("button", { name: /Day 16 A question/ }).click();
await page.locator(".chat-log").evaluate((element) => { element.scrollTop = 0; });
await scene("07-day-sixteen");
await hold(8);

// 1:17–1:38 · Historical discussion with several members and a fictional host.
await page.getByRole("button", { name: "Communities", exact: true }).click();
await page.getByRole("button", { name: "Explore community" }).first().click();
await page.getByRole("button", { name: "Join this example group" }).click();
await page.getByRole("tab", { name: "Discussions" }).click();
await page.locator(".tab-panel").evaluate((element) => { element.scrollTop = element.scrollHeight; });
await scene("08-community-thread");
await hold(21);

// 1:38–2:02 · Ravi's imperfect example; exact group, alias and question review before the prepared reply.
await page.getByRole("tab", { name: "Experiences" }).click();
await page.getByRole("button", { name: "Read experience" }).first().click();
await page.locator("#main-content").evaluate((element) => { element.scrollTop = element.scrollHeight; });
await scene("09-ravi-experience");
await hold(8);
await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
await page.getByLabel("Your alias").fill("QuietRiver");
await page.getByLabel("Your question").fill("When you needed a pause, what words helped you slow the conversation?");
await scene("10-exact-group-consent");
await hold(9);
await page.getByRole("checkbox", { name: /I reviewed this exact alias, audience and question/i }).check();
await page.getByRole("button", { name: "Continue to prepared response" }).click();
await scene("11-prepared-ravi-reply");
await hold(7);

// 2:02–2:32 · Six weeks later, Arjun drafts a small group contribution to Dev.
await page.getByRole("button", { name: "Communities", exact: true }).click();
await page.getByRole("button", { name: "Explore community" }).first().click();
await page.getByRole("tab", { name: "Discussions" }).click();
await page.getByLabel("Your words, only if you choose to share").fill("I still don't have an answer. One thing I tried was asking for time to think before replying. We argued, and I'm still working out what I want.");
await page.getByRole("button", { name: "Preview audience and text" }).click();
await scene("12-week-six-contribution-review");
await hold(12);
await page.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).check();
await page.getByRole("button", { name: "Post in this example group" }).click();
await scene("13-week-six-contribution-posted");
await hold(18);

// 2:32–2:44 · A restricted workflow preview records an example decision.
await page.getByRole("button", { name: "Find Support", exact: true }).click();
await page.getByRole("button", { name: /Review a reported post/ }).click();
await page.getByRole("button", { name: "Request revision" }).click();
await scene("14-moderation-review");
await hold(12);

// 2:44–2:54 · Film-only slate explains the intended, not yet connected, model roles.
await page.evaluate(() => {
  const overlay = document.createElement("div");
  overlay.id = "film-architecture";
  overlay.innerHTML = `<div class="arch-tag">PLANNED META INTEGRATION · NOT CONNECTED IN THIS PREVIEW</div><h2>A reflection can become a relevant, consented experience.</h2><div class="arch-flow"><article><small>USER CHOOSES</small><strong>“Family pressure”</strong><p>“Experiences, no verdict.”</p></article><b>→</b><article><small>FUTURE MUSE SPARK</small><strong>Context + intent</strong><p>Structured, correctable understanding</p></article><b>→</b><article><small>PERMISSIONED RETRIEVAL</small><strong>Approved stories</strong><p>Audience and source stay visible</p></article></div><div class="arch-foot"><span>Muse Voice Transcribe · optional speech-to-text, reviewed before sending</span><span>Harmful content · human moderator decision</span></div>`;
  overlay.style.cssText = "position:fixed;inset:0;z-index:100000;display:flex;flex-direction:column;justify-content:center;gap:30px;padding:90px 9%;background:#f7f6f2;color:#202722;font-family:system-ui,sans-serif";
  const style = document.createElement("style");
  style.textContent = "#film-architecture h2{max-width:1000px;margin:0;font:500 52px/1.08 Georgia,serif;letter-spacing:-.035em}#film-architecture .arch-tag{color:#315f52;font-size:15px;font-weight:700;letter-spacing:.11em}#film-architecture .arch-flow{display:grid;grid-template-columns:1fr 50px 1fr 50px 1fr;align-items:center;gap:16px}#film-architecture .arch-flow article{min-height:190px;display:flex;flex-direction:column;gap:12px;padding:23px;border:1px solid #cbd8ce;border-radius:12px;background:#fffefa}#film-architecture .arch-flow small{color:#315f52;font-weight:700;letter-spacing:.08em}#film-architecture .arch-flow strong{font:28px Georgia,serif}#film-architecture .arch-flow p{margin:0;color:#52605a;font-size:19px}#film-architecture .arch-flow b{color:#205b5a;font-size:34px;text-align:center}#film-architecture .arch-foot{display:flex;justify-content:space-between;gap:30px;padding-top:20px;border-top:1px solid #d6ddd7;color:#38443e;font-size:17px}";
  document.head.append(style);
  document.body.append(overlay);
});
await scene("15-planned-architecture");
await hold(10);

// 2:54–2:58 · Close on agency and mutual contribution.
await page.evaluate(() => {
  const overlay = document.getElementById("film-architecture");
  if (overlay) overlay.innerHTML = `<div style="max-width:1050px;margin:0 auto;text-align:center"><div style="font:italic 56px Georgia,serif;color:#205b5a">Harmonise</div><p style="margin:24px 0 0;font:500 43px/1.18 Georgia,serif">A place to think, connect,<br>and someday help someone else.</p><small style="display:block;margin-top:36px;color:#52605a;font:600 14px system-ui,sans-serif;letter-spacing:.08em">INTERACTIVE PRODUCT PREVIEW · SIMULATED SCENARIOS</small></div>`;
});
await scene("16-close");
await hold(4);

await context.close();
const video = page.video();
await video.saveAs(webmPath);
await browser.close();
console.log(JSON.stringify({ webmPath, viewport: "1600x900", interactions: "Playwright against the exported React application" }));
