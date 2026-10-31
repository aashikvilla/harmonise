import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = resolve('demo-iterations/v24/capture');
const videoDir = resolve(base, 'video');
await mkdir(videoDir, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const marks = {};
const checks = {};
await page.goto('http://127.0.0.1:3033/', { waitUntil: 'domcontentloaded' });
await page.addStyleTag({ content: `#capture-cursor-v24{position:fixed;left:0;top:0;width:16px;height:16px;border:3px solid #fff;border-radius:50%;background:#139b83;box-shadow:0 1px 8px #16352fcc;z-index:2147483647;pointer-events:none;transform:translate(-50%,-50%);transition:transform 70ms linear;}` });
await page.evaluate(() => {
  const dot = document.createElement('div'); dot.id = 'capture-cursor-v24'; document.body.append(dot);
  window.addEventListener('mousemove', (event) => { dot.style.left = `${event.clientX}px`; dot.style.top = `${event.clientY}px`; });
});
let start = Date.now();
let beatNo = 0;
const stamp = (name) => { marks[name] = Number(((Date.now() - start) / 1000).toFixed(3)); };
const endBeat = async (name) => {
  const target = start + (beatNo + 1) * 4000;
  const remaining = target - Date.now();
  if (remaining > 0) await page.waitForTimeout(remaining);
  const elapsed = Number(((Date.now() - (start + beatNo * 4000)) / 1000).toFixed(3));
  if (elapsed > 5.0) throw new Error(`Beat ${beatNo} (${name}) lasted ${elapsed}s`);
  marks[`beat-${String(beatNo + 1).padStart(2, '0')}-${name}`] = Number(((Date.now() - start) / 1000).toFixed(3));
  beatNo += 1;
};
const move = async (x, y) => page.mouse.move(x, y, { steps: 8 });
const pauseAt = async (x, y) => { await move(x, y); };
const type = async (locator, text) => { await locator.click(); await locator.press('Control+A'); await locator.pressSequentially(text, { delay: 14 }); };

// 00–04: the fictional entry line and a visible pointer to the private-first action.
start = Date.now();
await page.mouse.move(385, 400, { steps: 6 });
await endBeat('entry');

// 04–08: activate the actual private-first path.
await page.getByRole('button', { name: 'Start privately' }).click();
await pauseAt(560, 610);
await endBeat('private-start');

// 08–12: type Arjun's prepared opening words in the real composer.
const input = page.getByRole('textbox', { name: 'Your message' });
await type(input, 'I can’t tell my family what I want without feeling ungrateful.');
await endBeat('opening-typed');

// 12–16: submit once and keep the adjacent local/no-model label with the reply.
await page.getByRole('button', { name: 'Send', exact: true }).click();
await page.getByText('Prepared local example · no model connected').first().waitFor();
await pauseAt(840, 600);
await endBeat('prepared-reply');

// 16–20: move focus through words, possible meaning, and the unconfirmed need.
for (const phrase of ['What you said:', 'Might matter:', 'What you want now:']) {
  const node = page.getByText(phrase, { exact: false }).first();
  await node.scrollIntoViewIfNeeded();
  const box = await node.boundingBox();
  if (box) await move(Math.round(box.x + 16), Math.round(box.y + 12));
}
await endBeat('reflection-layers');

// 20–24: reject the prepared possibility.
await page.getByRole('button', { name: 'Not quite' }).click();
await pauseAt(800, 630);
await endBeat('reject-possibility');

// 24–28: type the user's correction into the actual input.
await type(input, 'I want time to decide what I want, without someone choosing stay or leave for me.');
await endBeat('correction-typed');

// 28–32: submit once; the browser's editable reflection changes in this same take.
await page.getByRole('button', { name: 'Send', exact: true }).click();
const updated = page.getByLabel('Updated editable understanding');
await updated.waitFor();
checks.changedReflection = await updated.locator('textarea').inputValue();
if (checks.changedReflection !== 'You want time to decide what you want, without someone choosing stay or leave for you.') throw new Error(`Unexpected corrected reflection: ${checks.changedReflection}`);
await pauseAt(880, 425);
await endBeat('reflection-changed');

// 32–36: confirm the local reflection; narration keeps the future model role distinct.
await page.getByRole('button', { name: 'Yes, that’s closer' }).click();
await pauseAt(1060, 610);
await endBeat('confirm-reflection');

// 36–40: user chooses to hear experiences; the same session opens context-aware discovery.
await page.getByRole('button', { name: 'Hear experiences' }).click();
await page.locator('.relevance-compare').waitFor();
checks.contextComparison = (await page.locator('.relevance-compare').innerText()).slice(0, 900);
if (!checks.contextComparison.includes('Family Expectations & Personal Choices')) throw new Error('Confirmed family context did not reach prepared discovery');
await pauseAt(1080, 580);
await endBeat('discovery-context');

// 40–44: the visible fixed comparison is changed by the user's real “not for me” action.
await move(1020, 590);
await page.getByRole('button', { name: 'Not for me · change these results' }).click();
checks.rejectedBaseline = (await page.locator('.relevance-compare').innerText()).includes('Broad legal-topic suggestions are set aside');
if (!checks.rejectedBaseline) throw new Error('The selected change did not update the prepared comparison');
await endBeat('baseline-set-aside');

// 44–48: enter the context-selected Family Expectations community.
await page.getByRole('button', { name: 'Explore community' }).first().click();
await page.getByRole('heading', { name: 'Family Expectations & Personal Choices' }).first().waitFor();
await page.locator('.story-card').filter({ hasText: 'Ravi' }).scrollIntoViewIfNeeded();
await pauseAt(1120, 630);
await endBeat('community-selected');

// 48–52: open Ravi's actual prepared story with the global fiction label and illustrative attribution.
const raviCard = page.locator('.story-card').filter({ hasText: 'Ravi' });
await raviCard.getByRole('button', { name: 'Read experience' }).click();
await page.locator('.story-detail-header').waitFor();
checks.raviProvenance = await page.locator('.story-detail-header').innerText();
if (!checks.raviProvenance.includes('Illustrative experience · Ravi') || !(await page.getByText('Illustrative scenario · fictional participants').count())) throw new Error('Ravi provenance label is missing');
await pauseAt(1090, 390);
await endBeat('ravi-opened');

// 52–56: active scroll to the actual shared point and its source references.
const overlap = page.locator('.story-overlap');
await overlap.scrollIntoViewIfNeeded();
const overlapBox = await overlap.boundingBox();
if (overlapBox) await move(Math.round(overlapBox.x + 30), Math.round(overlapBox.y + 180));
await page.waitForTimeout(250);
await page.mouse.wheel(0, 180);
await endBeat('shared-point');

// 56–60: active scroll to the difference and unknowns.
const difference = page.locator('.difference-panel');
await difference.scrollIntoViewIfNeeded();
const differenceBox = await difference.boundingBox();
if (differenceBox) await move(Math.round(differenceBox.x + 26), Math.round(differenceBox.y + 170));
await page.waitForTimeout(250);
await page.mouse.wheel(0, 150);
await endBeat('difference-and-unknown');

// 60–64: use the real group-only question control.
const askButton = page.getByRole('button', { name: 'Ask Ravi in the group' });
await askButton.scrollIntoViewIfNeeded();
await askButton.click();
await page.getByRole('heading', { name: 'Ask Ravi in the group' }).waitFor();
await pauseAt(570, 620);
await endBeat('group-question');

// 64–68: edit the exact proposed question in the real form.
const question = page.getByRole('textbox', { name: 'Your question' });
await type(question, 'Could I take time to decide before answering?');
checks.questionPreview = await page.locator('.recipient-preview dd').nth(2).innerText();
if (checks.questionPreview !== 'Could I take time to decide before answering?') throw new Error(`Question preview is wrong: ${checks.questionPreview}`);
await endBeat('question-edited');

// 68–72: one active scroll brings audience, alias, exact question, exclusions, unchecked consent, and disabled continue together.
await move(1010, 625);
await page.mouse.wheel(0, 350);
await page.waitForTimeout(250);
const consent = page.getByRole('checkbox', { name: /I reviewed this exact alias/ });
const continueButton = page.getByRole('button', { name: 'Continue to prepared response' });
if (await consent.isChecked()) throw new Error('Consent must remain unchecked');
if (await continueButton.isEnabled()) throw new Error('Continue must remain disabled');
checks.questionConsentUnchecked = true;
checks.continueDisabled = true;
for (const locator of [question, page.locator('.recipient-preview'), consent, continueButton, page.getByRole('button', { name: 'Cancel · keep my draft' })]) {
  const box = await locator.boundingBox();
  if (!box || box.y < 0 || box.y + box.height > 720) throw new Error('Question, audience preview, consent, disabled continue and cancel must all fit together');
}
await pauseAt(1030, 575);
await endBeat('audience-and-consent');

// 72–76: use the real cancellation control; no response is sent and the draft stays in state.
await page.getByRole('button', { name: 'Cancel · keep my draft' }).click();
await page.locator('.story-detail-header').waitFor();
await pauseAt(570, 620);
await endBeat('cancel-keeps-draft');

// 76–80: return to the prepared group history and choose its real “Maybe later” outcome.
await page.getByRole('button', { name: 'Back to community' }).click();
await page.getByRole('tab', { name: 'Discussions' }).click();
await page.getByRole('button', { name: 'Day 16' }).click();
await page.getByRole('button', { name: 'Maybe later' }).click();
checks.maybeLater = await page.locator('.dev-choice-panel').innerText();
if (!checks.maybeLater.includes('Maybe later selected. The private reflection stays private.')) throw new Error('Maybe later did not produce its private outcome');
await pauseAt(1040, 615);
await endBeat('maybe-later');

// 80–84: select the actual private takeaway.
await page.getByRole('button', { name: 'Keep this takeaway privately' }).click();
checks.takeaway = await page.getByRole('status').last().innerText();
if (!checks.takeaway.includes('preview session only')) throw new Error('Session-only takeaway confirmation is missing');
await pauseAt(1080, 620);
await endBeat('private-takeaway');

// 84–88: leave the selected state visible with the session-only status in frame.
await page.getByText('Arjun chose this in the preview session only', { exact: false }).scrollIntoViewIfNeeded();
await move(1070, 630);
await endBeat('private-ending');

if (beatNo !== 22) throw new Error(`Expected 22 beats, got ${beatNo}`);
const video = page.video();
await context.close();
const videoPath = resolve(videoDir, 'v24-full-session.webm');
await video.saveAs(videoPath);
await browser.close();
await writeFile(resolve(base, 'capture-marks.json'), JSON.stringify({ marks, checks, actualBeatCount: beatNo, captureCursor: 'Fixed dot follows actual DOM mousemove events during Playwright mouse actions.' }, null, 2) + '\n');
console.log(JSON.stringify({ marks, checks, videoPath, actualBeatCount: beatNo }, null, 2));
