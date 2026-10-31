import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = resolve('demo-iterations/v27/capture');
const videoDir = resolve(base, 'video');
await mkdir(videoDir, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  recordVideo: { dir: videoDir, size: { width: 1600, height: 900 } },
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const marks = [];
const checks = {};
await page.goto('http://127.0.0.1:3033/', { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: /I can’t tell my family what I want/ }).waitFor();
const start = Date.now();
const moveTo = async (locator) => {
  const box = await locator.boundingBox();
  if (box) await page.mouse.move(Math.round(box.x + Math.min(30, box.width / 2)), Math.round(box.y + Math.min(18, box.height / 2)), { steps: 6 });
};
const type = async (locator, text) => { await locator.click(); await locator.press('Control+A'); await locator.pressSequentially(text, { delay: 22 }); };
async function scene(name, caption, seconds, action = async () => {}) {
  const before = Date.now();
  await action();
  const actualStart = Date.now();
  await page.waitForTimeout(Math.max(0, seconds * 1000 - (actualStart - before)));
  marks.push({ name, startSeconds: Number(((before - start) / 1000).toFixed(3)), endSeconds: Number(((Date.now() - start) / 1000).toFixed(3)), caption });
}

await scene('01-hook', '“I can’t tell my family what I want without feeling ungrateful.”\nFictional · prepared scenario.', 3.5);
await scene('02-audience-and-path', 'For people navigating family pressure: clarify privately,\ncorrect the reflection, then decide whether to share.', 3.5);
await scene('03-private-choice', 'He chooses a private first step.\nNo one else sees this reflection.', 5, async () => {
  await page.getByRole('button', { name: 'Start privately' }).click();
  await page.getByRole('textbox', { name: 'Your message' }).waitFor();
});
const input = page.getByRole('textbox', { name: 'Your message' });
await scene('04-own-words', 'Arjun puts the family pressure\ninto his own words.', 6, async () => {
  await type(input, 'I can’t tell my family what I want without feeling ungrateful.');
});
await scene('05-prepared-reflection-and-role', 'Muse Spark might suggest a theme; Arjun decides if it fits.\nPrepared local example · no model connected.', 7, async () => {
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByText('Prepared local example · no model connected').first().waitFor();
});
await scene('06-tentative-meaning', 'A possible meaning is offered\nas something he can check.', 6, async () => {
  await moveTo(page.getByText('Might matter:', { exact: false }).first());
});
await scene('07-reject', 'He says “Not quite.”\nThe first interpretation does not stand.', 5, async () => {
  await page.getByRole('button', { name: 'Not quite' }).click();
});
await scene('08-correction', 'He corrects it: he needs time\nto decide for himself.', 7, async () => {
  await type(input, 'I want time to decide what I want, without someone choosing stay or leave for me.');
});
await scene('09-changed-result', 'The editable reflection changes\nto include his correction.', 5.5, async () => {
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const updated = page.getByLabel('Updated editable understanding');
  await updated.waitFor();
  checks.changedReflection = await updated.locator('textarea').inputValue();
  if (checks.changedReflection !== 'You want time to decide what you want, without someone choosing stay or leave for you.') throw new Error('Corrected reflection did not change');
  const correctedField = updated.locator('textarea');
  await correctedField.evaluate((element) => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const correctedBox = await correctedField.boundingBox();
  checks.changedReflectionVisible = Boolean(correctedBox && correctedBox.y >= 80 && correctedBox.y + correctedBox.height <= 740);
  if (!checks.changedReflectionVisible) throw new Error(`Corrected reflection is outside the film aperture: ${JSON.stringify(correctedBox)}`);
  await moveTo(correctedField);
});
await scene('10-confirmed-theme', 'He confirms the theme himself.\nThe product does not decide what is true.', 6, async () => {
  await page.getByRole('button', { name: 'Yes, that’s closer' }).click();
  await page.getByRole('button', { name: 'Hear experiences' }).waitFor();
});
await scene('11-choice-to-explore', 'Only now does he choose\nto hear other experiences.', 6, async () => {
  await page.getByRole('button', { name: 'Hear experiences' }).click();
  await page.locator('.relevance-compare').waitFor();
  checks.themeReachedDiscovery = (await page.locator('.relevance-compare').innerText()).includes('Family Expectations & Personal Choices');
  if (!checks.themeReachedDiscovery) throw new Error('Confirmed theme did not reach discovery');
});
await scene('12-correction-changes-results', 'He sets aside broad legal results.\nFamily context stays in view.', 7, async () => {
  await page.getByRole('button', { name: 'Not for me · change these results' }).click();
  checks.rejectedBaseline = (await page.locator('.relevance-compare').innerText()).includes('Broad legal-topic suggestions are set aside');
  if (!checks.rejectedBaseline) throw new Error('Broad results did not change');
  await moveTo(page.locator('.relevance-compare'));
});
await scene('13-enter-community', 'He opens the family expectations\ncommunity preview.', 5, async () => {
  await page.getByRole('button', { name: 'Explore community' }).first().click();
  await page.getByRole('heading', { name: 'Family Expectations & Personal Choices' }).first().waitFor();
});
await scene('14-fiction-label', 'The community example is prepared\nand fictional, not live.', 5, async () => {
  await page.getByRole('tab', { name: 'Discussions' }).click();
  await page.getByRole('button', { name: 'Day 4' }).waitFor();
  await page.getByRole('button', { name: 'Day 4' }).click();
});
await scene('15-peer-perspective', 'Ravi names a different path: a trusted friend\nhelped him speak with family.', 7, async () => {
  await page.getByRole('tab', { name: 'Experiences' }).click();
  const ravi = page.locator('.story-card').filter({ hasText: 'Ravi' });
  await ravi.getByRole('button', { name: 'Read experience' }).click();
  await page.locator('.story-detail-header').waitFor();
  checks.raviProvenance = await page.locator('.story-detail-header').innerText();
  if (!checks.raviProvenance.includes('Illustrative experience · Ravi')) throw new Error('Prepared story provenance missing');
  await page.locator('.story-overlap').scrollIntoViewIfNeeded();
});
await scene('16-shared-pressure', 'They share family pressure,\nbut the circumstances differ.', 6, async () => {
  const overlap = page.locator('.story-overlap');
  await overlap.scrollIntoViewIfNeeded(); await moveTo(overlap);
});
await scene('17-different-support', 'Ravi had someone he trusted.\nArjun has not said he does.', 7, async () => {
  const difference = page.locator('.difference-panel');
  await difference.scrollIntoViewIfNeeded(); await moveTo(difference);
  checks.difference = (await difference.innerText()).slice(0, 500);
});
await scene('18-group-only', 'If Arjun asks, Ravi accepts questions\nin the group only, never by DM.', 6, async () => {
  await page.getByRole('button', { name: 'Ask Ravi in the group' }).click();
  await page.getByRole('heading', { name: 'Ask Ravi in the group' }).waitFor();
});
await scene('19-edited-question', 'He edits the question\nto ask for time before answering.', 7, async () => {
  const question = page.getByRole('textbox', { name: 'Your question' });
  await type(question, 'Could I take time to decide before answering?');
  checks.questionPreview = await page.locator('.recipient-preview dd').nth(2).innerText();
  if (checks.questionPreview !== 'Could I take time to decide before answering?') throw new Error('Edited question does not match audience preview');
});
await scene('20-consent-boundary', 'Group and alias are shown.\nPrivate reflection is excluded.', 7, async () => {
  await page.mouse.wheel(0, 350); await page.waitForTimeout(300);
  const consent = page.getByRole('checkbox', { name: /I reviewed this exact alias/ });
  const proceed = page.getByRole('button', { name: 'Continue to prepared response' });
  checks.consentUnchecked = !(await consent.isChecked()) && !(await proceed.isEnabled());
  if (!checks.consentUnchecked) throw new Error('Outreach must remain unconsented and disabled');
});
await scene('21-cancel', 'He cancels.\nNothing is sent; the draft remains his.', 5, async () => {
  await page.getByRole('button', { name: 'Cancel · keep my draft' }).click();
  await page.locator('.story-detail-header').waitFor();
  await page.getByRole('button', { name: 'Back to community' }).click();
});
await scene('22-no-reply-yet', 'A later prepared thread has no reply yet.\nA response is not promised.', 7, async () => {
  await page.getByRole('tab', { name: 'Discussions' }).click();
  await page.getByRole('button', { name: 'Day 16' }).click();
  await page.getByText('No replies yet', { exact: false }).waitFor();
});
await scene('23-private-takeaway', 'Arjun keeps one takeaway privately\nfor this preview session.', 6, async () => {
  await page.getByRole('button', { name: 'Maybe later' }).click();
  await page.getByRole('button', { name: 'Keep this takeaway privately' }).click();
  checks.takeaway = await page.getByRole('status').last().innerText();
  if (!checks.takeaway.includes('preview session only')) throw new Error('Session-only outcome missing');
});
await scene('24-bounded-offer', 'He may offer one bounded thing\nthat helped to Dev’s example group.', 6, async () => {
  await page.getByRole('button', { name: 'Offer one thing that helped' }).click();
  const preview = page.locator('.dev-bounded-preview');
  await preview.scrollIntoViewIfNeeded();
  await page.getByRole('status').filter({ hasText: 'Selected: Offer one thing that helped' }).waitFor();
});
await scene('25-edit-and-review', 'He edits the exact contribution.\nConsent remains unchecked until review.', 7, async () => {
  const preview = page.locator('.dev-bounded-preview');
  const draft = preview.getByRole('textbox', { name: 'Edit the one part you may offer' });
  await draft.fill('I asked for time to think before replying. I am still working out what I want.');
  checks.offerConsentUnchecked = !(await preview.getByRole('checkbox').isChecked()) && await preview.getByRole('button', { name: 'Add to preview group' }).isDisabled();
  if (!checks.offerConsentUnchecked) throw new Error('Bounded offer must remain unconsented and unsent');
});
await scene('26-local-preview-added', 'He adds it to the fictional preview.\nNothing is sent to a real group or person.', 6, async () => {
  const preview = page.locator('.dev-bounded-preview');
  await preview.getByRole('checkbox', { name: /I reviewed this exact text and group audience/ }).check();
  const add = preview.getByRole('button', { name: 'Add to preview group' });
  if (!(await add.isEnabled())) throw new Error('Reviewed local contribution should be enabled');
  await add.click();
  const confirmation = 'Added to this fictional preview group. Nothing was sent to any real group or person.';
  await preview.getByRole('status').filter({ hasText: confirmation }).waitFor();
  checks.localOnlyConfirmation = await preview.getByRole('status').innerText();
  if (!checks.localOnlyConfirmation.includes('Nothing was sent to any real group or person')) throw new Error('Local-only confirmation missing');
  await page.getByRole('button', { name: 'Review my choices' }).click();
  const close = page.getByRole('region', { name: "Arjun's final local choices" });
  await close.waitFor();
  await close.scrollIntoViewIfNeeded();
  checks.finalChoice = (await close.innerText()).slice(0, 800);
  if (!(checks.finalChoice.includes('privately') || checks.finalChoice.includes('private'))) throw new Error('Private end choice missing');
  if (!checks.finalChoice.includes('Added to fictional local preview')) throw new Error('Local contribution state missing from final choice');
  if (!checks.finalChoice.includes('Nothing is sent to a real group or person')) throw new Error('Final local-only boundary missing');
});
const video = page.video();
await context.close();
const videoPath = resolve(videoDir, 'v27-real-product-session.webm');
await video.saveAs(videoPath);
await browser.close();
await writeFile(resolve(base, 'capture-marks.json'), JSON.stringify({ scenes: marks, checks, captureViewport: '1600x900', productRoute: 'http://127.0.0.1:3033/', interaction: 'Actual Playwright interactions against the running fictional product preview.' }, null, 2) + '\n');
console.log(JSON.stringify({ scenes: marks, checks, videoPath }, null, 2));
