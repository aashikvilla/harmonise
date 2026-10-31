import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3033";
const outDir = resolve(process.env.CAPTURE_OUT_DIR ?? "demo-iterations/v15/capture");
const webmPath = resolve(outDir, "react-capture.webm");
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: outDir, size: { width: 1600, height: 900 } }, reducedMotion: "reduce" });
const page = await context.newPage();
const sceneTimes = [];
const captureStarted = Date.now();
async function hold(seconds) { await page.waitForTimeout(process.env.FAST_CAPTURE === "1" ? 35 : seconds * 1000); }
async function scene(name) { sceneTimes.push({ name, seconds: (Date.now() - captureStarted) / 1000 }); await page.screenshot({ path: resolve(outDir, name + ".png") }); }
async function sendChat(text) { const box = page.getByRole("textbox", { name: "Your message" }); await box.fill(""); await box.pressSequentially(text, { delay: 24 }); await page.getByRole("button", { name: "Send" }).click(); }

// Real first-use screen, explicit choice and first typed interaction.
await page.goto(origin + "/", { waitUntil: "networkidle" });
await page.getByRole("heading", { name: "I can’t tell my family what I want without feeling ungrateful." }).waitFor();
await page.getByText("Interactive product preview", { exact: true }).waitFor();
await page.getByText("FICTIONAL SCENARIO · ARJUN", { exact: true }).waitFor();
await page.getByText("Private reflection you can correct before exploring peer experiences.", { exact: true }).waitFor();
await scene("01-arjun-fictional-hook");
await hold(6);
await page.getByRole("button", { name: "Start privately" }).click();
await page.getByRole("textbox", { name: "Your message" }).waitFor();
await scene("02-start-privately");
await hold(3);
await sendChat("Things at home feel uncertain. My family keeps asking what I want, and I don't know yet.");
await page.getByText("Prepared local example · no model connected", { exact: true }).waitFor();
await page.getByRole("button", { name: "Not quite" }).waitFor();
await scene("03-prepared-first-reply");
await hold(8);

// Show the user's explicit correction choice before they rewrite the interpretation.
await page.getByRole("button", { name: "Not quite" }).click();
await page.getByRole("status").filter({ hasText: "Not quite. Tell me what I missed in your own words." }).waitFor();
await scene("04-not-quite-selected");
await hold(4);
await page.getByRole("button", { name: "Edit in my words" }).click();
const composer = page.getByRole("textbox", { name: "Your message" });
await composer.fill("");
await composer.pressSequentially("I can talk with my partner. It's my parents. I want time to decide what I want.", { delay: 24 });
await scene("05-arjun-rewrites");
await hold(7);
await page.getByRole("button", { name: "Send" }).click();
await page.getByText("I can talk with my partner. It's my parents. I want time to decide what I want.", { exact: true }).waitFor();
const revised = page.getByRole("textbox", { name: "WHAT HE CONFIRMED · EDITABLE" });
await revised.waitFor();
await revised.fill("I want time to decide what I want, without someone choosing stay or leave for me.");
await page.locator(".causal-understanding").getByText(/Prepared local example · no model connected/i).waitFor();
await page.locator(".causal-understanding").evaluate((element) => element.scrollIntoView({ block: "center", behavior: "instant" }));
await scene("06-changed-editable-reflection");
await hold(18);
await page.getByRole("button", { name: "Yes, that’s closer" }).click();
await page.getByRole("button", { name: "Hear experiences" }).click();
await page.getByRole("heading", { name: "Not just similar words. Similar situations." }).waitFor();
await page.getByRole("button", { name: "Explore community" }).first().click();
await page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 2 }).waitFor();
await page.getByRole("tab", { name: "Discussions" }).click();
await page.locator(".historical-thread").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Day 4 Naming the pressure/ }).waitFor();
await scene("07-day-4-peer-perspective");
await hold(9);

// One navigable prepared historical thread with distinct peer, host, unresolved and moderator roles.
await page.getByRole("button", { name: /Day 9 A conversation that stayed difficult/ }).click();
await page.getByText(/Thread host · fictional human community role/).waitFor();
await scene("08-day-9-host-boundary");
await hold(8);
await page.getByRole("button", { name: /Flag directive reply · prepared example/ }).click();
await page.getByText(/Fictional moderator holds the directive reply from view/i).waitFor();
await page.locator(".prepared-triage").scrollIntoViewIfNeeded();
await scene("09-prepared-no-report");
await hold(4);
await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
await page.getByText(/Side thread · no replies yet/).waitFor();
await scene("10-day-16-dev-unanswered");
await hold(8);

// Separate exact-audience Ravi preview; leave consent unchecked and send nothing.
await page.getByRole("tab", { name: "Experiences" }).click();
await page.locator(".story-card").filter({ hasText: "Ravi" }).getByRole("button", { name: "Read experience" }).click();
await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
await page.getByText(/Ravi accepts questions in the group only, not by private message/i).waitFor();
const raviQuestion = page.getByRole("textbox", { name: "Your question" });
await raviQuestion.fill("What helped you ask for time?");
await page.getByRole("complementary").getByText("What helped you ask for time?", { exact: true }).waitFor();
if (await page.getByRole("checkbox", { name: /I reviewed this exact alias/i }).isChecked()) throw new Error("Ravi consent must remain unchecked");
await scene("11-ravi-before-edit");
await hold(5);
await raviQuestion.fill("");
await raviQuestion.pressSequentially("What helped you ask for time before answering?", { delay: 28 });
await page.getByRole("complementary").getByText("What helped you ask for time before answering?", { exact: true }).waitFor();
await scene("12-ravi-changed-preview");
await hold(20);
await page.getByRole("button", { name: "Cancel · keep my draft" }).click();
await page.getByRole("button", { name: "Back to community" }).click();
await page.getByRole("tab", { name: "Discussions" }).click();

// Support caveat is an actual app route, with no directory or bookings.
await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Find Support" }).click();
await page.getByRole("button", { name: "Explore professional support" }).click();
await page.getByText(/No provider directory or credential checks are connected/i).waitFor();
await page.getByRole("heading", { name: "We don't have a verified provider for these preferences yet." }).waitFor();
await scene("13-support-caveat");
await hold(12);

// Return through the support screen to the peer thread, then choose and keep a private takeaway.
await page.getByRole("button", { name: "Return to peer perspectives" }).click();
await page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 1 }).waitFor();
await page.getByRole("tab", { name: "Discussions" }).click();
await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
await page.getByText(/Side thread · no replies yet/).waitFor();
await page.locator(".historical-thread").scrollIntoViewIfNeeded();
await scene("13a-support-return-peers");
await hold(4);
await page.getByRole("button", { name: "Keep this takeaway privately" }).click();
await page.getByText(/Arjun chose this takeaway to keep privately/).waitFor();
await scene("14-selected-private-takeaway");
await hold(16);
await page.getByRole("button", { name: "Maybe later" }).click();
await page.getByText(/Maybe later selected/).waitFor();
await scene("15-private-only-choice");
await hold(8);
await page.getByRole("button", { name: "Offer one thing that helped" }).click();
const finalPreview = page.locator(".dev-bounded-preview");
await finalPreview.scrollIntoViewIfNeeded();
await page.getByRole("status").filter({ hasText: "Selected: Offer one thing that helped" }).waitFor();
await page.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).waitFor();
if (await finalPreview.getByRole("checkbox").isChecked()) throw new Error("The final preview consent must begin unchecked");
if (!(await finalPreview.getByRole("button", { name: "Post in this example group" }).isDisabled())) throw new Error("The final post must stay disabled without consent");
await scene("16-optional-offer-selected");
await hold(6);
const devDraft = finalPreview.getByRole("textbox", { name: "Edit the one part you may offer" });
await devDraft.fill("");
await devDraft.pressSequentially("I asked for time to think before replying. I am still working out what I want.", { delay: 25 });
if (await finalPreview.getByRole("checkbox").isChecked()) throw new Error("Editing must leave contribution consent unchecked");
if (!(await finalPreview.getByRole("button", { name: "Post in this example group" }).isDisabled())) throw new Error("Editing must keep post disabled");
await scene("17-exact-unsent-dev-draft");
await hold(12);
await page.getByRole("button", { name: "Review my choices" }).click();
await page.getByRole("region", { name: "Arjun's final local choices" }).waitFor();
await page.locator(".agency-close").scrollIntoViewIfNeeded();
await scene("18-composed-agency-close");
await hold(18);
await import("node:fs/promises").then(({ writeFile }) => writeFile(resolve(outDir, "timeline.json"), JSON.stringify(sceneTimes, null, 2) + "\n"));
await context.close();
await page.video().saveAs(webmPath);
await browser.close();
console.log(JSON.stringify({ webmPath, viewport: "1600x900", actualReactInteractions: true, sceneTimes }));
