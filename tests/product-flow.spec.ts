import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON() as { message?: unknown };
    const message = typeof body.message === "string" ? body.message : "";
    const familyContext = /family|parents|dad|partner/i.test(message);
    const wantsTime = /time to decide|at my own pace/i.test(message);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: /completely different/i.test(message)
          ? "We can keep it broad. Is it something happening with someone, or more how you’ve been feeling lately?"
          : "Thank you for sharing that. What feels most important to you right now?",
        suggestedThemes: familyContext ? ["family-expectations", "personal-autonomy"] : [],
        supportNeed: "human-perspective",
        needSummary: wantsTime ? "You want time to decide what you want, without someone choosing stay or leave for you." : "You want space to talk through what feels uncertain, at your own pace.",
      }),
    });
  });
  await page.route("**/api/voice/transcribe", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ transcript: "I want to share these words after reviewing them." }) });
  });
});

async function openArjun(page: Page) {
  await page.goto("/app?path=talk");
  await expect(page.getByRole("heading", { name: "You can start anywhere." })).toBeVisible();
}

async function sendChat(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Your message" }).fill(text);
  await page.getByRole("button", { name: "Send" }).click();
}

async function reachCommunity(page: Page) {
  await openArjun(page);
  await sendChat(page, "I don't know... things at home feel weird lately.");
  await page.getByRole("button", { name: "Something with someone" }).click();
  await sendChat(page, "Actually, I can talk with my wife. My parents' expectations are the hard part.");
  await page.getByRole("button", { name: "Yes, that’s closer" }).click();
  await page.getByRole("button", { name: "Hear experiences" }).click();
}

test("first use names the audience and private-to-peer promise before Start privately", async ({ page }) => {
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "I can’t tell my family what I want without feeling ungrateful." })).toBeVisible();
  await expect(page.getByText("ARJUN · A FICTIONAL STORY", { exact: true })).toBeVisible();
  await expect(page.getByText(/For adults facing family pressure\./i)).toBeVisible();
  await expect(page.getByText(/Arjun's fictional story · Meta AI chat when configured/i)).toBeVisible();
  await expect(page.getByText("Think it through privately, review a tentative reflection, then choose whether to share.", { exact: true })).toBeVisible();
  await expect(page.locator(".entry-mechanism")).toHaveCount(0);
  await page.getByRole("button", { name: "Start privately" }).click();
  await expect(page.getByRole("textbox", { name: "Your message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Use voice" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore quietly" })).toBeVisible();
  await expect(page.locator(".chat-provenance")).toHaveText("Meta AI · Muse Spark · Review each response and suggested theme");
  await sendChat(page, "Things at home feel uncertain.");
  await expect(page.getByText("Things at home feel uncertain.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Not quite" })).toBeVisible();
});

test("a user correction updates the editable Muse Spark reflection", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Start privately" }).click();
  await sendChat(page, "Things at home feel uncertain. My family keeps asking what I want.");
  await page.getByRole("button", { name: "Not quite" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not quite. Tell me what I missed in your own words." })).toBeVisible();
  await page.getByRole("button", { name: "Edit in my words" }).click();
  await page.getByRole("textbox", { name: "Your message" }).fill("I can talk with my partner. It's my parents. I want time to decide what I want.");
  await page.getByRole("button", { name: "Send" }).click();
  const updated = page.getByRole("textbox", { name: "WHAT YOU CONFIRMED · EDITABLE" });
  await expect(updated).toHaveValue("You want time to decide what you want, without someone choosing stay or leave for you.");
  await expect(page.locator(".causal-understanding").getByText(/Muse Spark’s suggestion is editable/i)).toBeVisible();
  await updated.fill("I want to decide at my own pace.");
  await expect(updated).toHaveValue("I want to decide at my own pace.");
});

test("Arjun can choose a concrete private takeaway immediately after confirming the correction", async ({ page }) => {
  await page.goto("/app");
  await page.getByRole("button", { name: "Start privately" }).click();
  await sendChat(page, "Things at home feel uncertain. My family keeps asking what I want.");
  await page.getByRole("button", { name: "Not quite" }).click();
  await page.getByRole("button", { name: "Edit in my words" }).click();
  await page.getByRole("textbox", { name: "Your message" }).fill("I can talk with my partner. It's my parents. I want time to decide what I want.");
  await page.getByRole("button", { name: "Send" }).click();
  await page.getByRole("textbox", { name: "WHAT YOU CONFIRMED · EDITABLE" }).fill("I can ask for time before deciding.");
  await page.getByRole("button", { name: "Yes, that’s closer" }).click();
  const choice = page.getByRole("region", { name: "Arjun's optional private takeaway" });
  await expect(choice).toContainText("I can ask for time before deciding.");
  await choice.getByRole("button", { name: "Keep this takeaway privately" }).click();
  await expect(choice.getByRole("status")).toHaveText("Arjun chose to keep this in the browser session only. Nothing is sent.");
});

test("scenario and example query params both open an editable unsent Arjun opener", async ({ page }) => {
  for (const query of ["scenario=arjun", "story=arjun"]) {
    await page.goto(`/app?${query}`);
    const composer = page.getByRole("textbox", { name: "Your message" });
    await expect(composer).toHaveValue("I don't know... things at home feel weird lately.");
    await expect(page.getByRole("heading", { name: "You can start anywhere." })).not.toBeFocused();
    await expect(page.locator(".chat-provenance")).toContainText("Muse Spark");
  }
});

test("Arjun's four prepared return visits can be opened and resumed", async ({ page }) => {
  await page.goto("/app?scenario=arjun");
  await expect(page.getByText("29 written exchanges")).toBeVisible();
  await page.getByRole("button", { name: /Day 1 Something feels strange/ }).click();
  await expect(page.getByText("Things at home feel strange. I don't even know how to explain it.")).toBeVisible();
  await page.getByRole("button", { name: /Day 4 Correcting the assumption/ }).click();
  await expect(page.getByText("I wasn't talking about separating. It's my parents. I can't say no without feeling ungrateful.")).toBeVisible();
  await expect(page.getByText(/Voice transcription is not connected yet/i)).toBeVisible();
  await page.getByRole("button", { name: /Day 9 A conversation/ }).click();
  await expect(page.getByText("Could I try saying: I need until next weekend to think?")).toBeVisible();
  await page.getByRole("button", { name: /Day 4 Correcting the assumption/ }).click();
  await expect(page.getByText("I wasn't talking about separating. It's my parents. I can't say no without feeling ungrateful.")).toBeVisible();
  await page.getByRole("button", { name: /Day 16 A question/ }).click();
  await expect(page.getByText("I tried talking to Dad. He listened, but we argued.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByRole("heading", { name: "You can start anywhere." })).toBeVisible();
});

test("microphone denial leaves the text composer usable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => Promise.reject(new DOMException("Permission denied", "NotAllowedError")) },
    });
  });
  await page.goto("/app?path=talk");
  await page.getByRole("button", { name: "Use voice" }).click();
  await expect(page.getByText(/Microphone access wasn’t granted/i)).toBeVisible();
  await sendChat(page, "I can still type what I want to say.");
  await expect(page.getByText("I can still type what I want to say.", { exact: true })).toBeVisible();
});

test("recorded audio is transcribed by Meta and stays editable before sending", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) },
    });
    class MockRecorder {
      state = "inactive";
      start() { this.state = "recording"; }
      ondataavailable?: (event: { data: Blob }) => void;
      onstop?: () => void;
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array([1])], { type: "audio/webm" }) }); this.onstop?.(); }
    }
    class MockAudioContext {
      decodeAudioData = async () => ({ sampleRate: 24000, length: 24000, numberOfChannels: 1, getChannelData: () => new Float32Array(24000) });
      close = async () => {};
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: MockRecorder });
    Object.defineProperty(window, "AudioContext", { configurable: true, value: MockAudioContext });
  });
  await page.goto("/app?path=talk");
  await page.getByRole("button", { name: "Use voice" }).click();
  await expect(page.getByText(/Recording · up to 2 minutes/)).toBeVisible();
  await page.getByRole("button", { name: "Stop and review" }).click();
  await page.getByRole("button", { name: "Transcribe with Meta" }).click();
  await expect(page.getByRole("textbox", { name: "Review and edit the transcript" })).toHaveValue("I want to share these words after reviewing them.");
  await page.getByRole("button", { name: "Use this in my message" }).click();
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText("I want to share these words after reviewing them.", { exact: true })).toBeVisible();
});

test("independent spaces support group-only contact, reviewed contribution and human review", async ({ page }) => {
  // This is the longest desktop journey; allow the same headroom as the
  // neighboring live-backend journeys when both viewport projects run.
  test.setTimeout(60_000);
  const externalRequests: string[] = [];
  const appOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").origin;
  page.on("request", (request) => {
    if (!request.url().startsWith("data:") && new URL(request.url()).origin !== appOrigin) externalRequests.push(request.url());
  });
  await reachCommunity(page);
  await expect(page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 2 })).toBeVisible();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await expect(page.getByText(/Community host note · fictional role/i)).toBeVisible();
  await expect(page.getByText(/no live moderator/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Join community" })).toBeVisible();
  await page.getByRole("tab", { name: "Discussions" }).click();
  await expect(page.getByRole("heading", { name: "Questions people might explore" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Does anyone know how to tell your parents what you want when they see it as disrespect?" })).toBeVisible();
  await page.getByRole("button", { name: /Day 9 A conversation that stayed difficult/ }).click();
  await expect(page.getByText(/Fictional story · fictional participants · written content/)).toBeVisible();
  await expect(page.getByText(/Thread host · fictional human community role/)).toBeVisible();
  await expect(page.getByText(/I can listen; I can’t decide for you/i)).toBeVisible();
  await page.getByRole("button", { name: /Review a directive reply/ }).click();
  await expect(page.getByText(/Fictional moderator holds the directive reply from view/i)).toBeVisible();
  await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
  await expect(page.getByText(/Side thread · no replies yet/)).toBeVisible();
  await page.getByRole("button", { name: "Offer one thing that helped" }).click();
  const devPreview = page.locator(".dev-bounded-preview");
  await expect(devPreview.getByText("Alias: QuietRiver")).toBeVisible();
  await expect(devPreview.getByRole("checkbox")).not.toBeChecked();
  await expect(devPreview.getByRole("button", { name: "Add to community" })).toBeDisabled();
  await expect(devPreview.getByText(/Nothing is sent to a real group or person\./)).toBeVisible();
  await page.getByRole("button", { name: /Day 4 Naming the pressure/ }).click();
  await expect(page.locator(".discussion-card")).toHaveCount(11);
  await page.getByRole("tab", { name: "People" }).click();
  await expect(page.getByText("Ravi", { exact: true })).toBeVisible();
  await expect(page.getByText(/Ravi.*group replies only/i)).toBeVisible();
  await page.getByRole("tab", { name: "Experiences" }).click();
  await page.getByRole("button", { name: "Read experience" }).first().click();
  await expect(page.getByRole("heading", { name: "One person's experience" })).toBeVisible();
  await expect(page.getByText(/One person's account, not a recommendation/i)).toBeVisible();
  await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
  await expect(page.getByText(/Ravi accepts questions in the group only, not by private message/i)).toBeVisible();
  await expect(page.getByText(/Family Expectations group · Ravi may reply in group/i)).toBeVisible();
  await expect(page.getByText(/Your private conversation and journey are not included/i)).toBeVisible();
  await page.getByRole("button", { name: "Cancel · keep my draft" }).click();
  await page.getByRole("button", { name: "Back to community" }).click();
  await page.getByRole("tab", { name: "Discussions" }).click();
  await expect(page.getByRole("heading", { name: "Questions people might explore" })).toBeVisible();
  await page.getByRole("button", { name: "Join community" }).click();
  await expect(page.getByText(/Your choice applies in this browser only/i)).toBeVisible();
  await page.getByRole("textbox", { name: "Your words, only if you choose to share" }).fill("I'm still figuring this out. I wrote down what I wanted to say. My dad didn't agree, but I said a little more clearly what mattered to me.");
  await page.getByRole("button", { name: "Review audience and text" }).click();
  await expect(page.getByText("Alias: QuietRiver · this group only")).toBeVisible();
  await expect(page.getByText(/Your private conversation is not included/i)).toBeVisible();
  await page.locator(".group-reply-composer").getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).check();
  await page.getByRole("button", { name: "Post in this community" }).click();
  await expect(page.getByText(/Not published or visible to other people/i)).toBeVisible();
  await page.getByRole("button", { name: "Find Support" }).click();
  await page.getByRole("button", { name: "Review a reported post" }).click();
  await page.getByRole("button", { name: "Request revision" }).click();
  await expect(page.getByText(/Human review choice recorded/)).toBeVisible();
  await expect(page.getByText(/No post or account changed/)).toBeVisible();
  await page.getByRole("button", { name: "Connections" }).click();
  await page.getByRole("button", { name: "View a fictional incoming request" }).click();
  await page.getByRole("button", { name: "Block this fictional member" }).click();
  await expect(page.getByText(/Blocked in this browser/)).toBeVisible();
  await page.getByRole("button", { name: "Find Support" }).click();
  await page.getByRole("button", { name: "Explore professional support" }).click();
  await expect(page.getByRole("heading", { name: "We don't have a verified provider for these preferences yet." })).toBeVisible();
  await page.getByRole("button", { name: "My Journey" }).click();
  await page.getByRole("button", { name: "Paused" }).click();
  await expect(page.getByRole("button", { name: "Paused" })).toHaveAttribute("aria-pressed", "true");
  expect(externalRequests).toEqual([]);
});

test("Ravi preview edits live, support has a return path, and Arjun can keep a takeaway privately", async ({ page }) => {
  await reachCommunity(page);
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Experiences" }).click();
  await page.getByRole("button", { name: "Read experience" }).first().click();
  await page.getByRole("button", { name: "Ask Ravi in the group" }).click();
  const question = page.getByRole("textbox", { name: "Your question" });
  await question.fill("What helped you ask for time?");
  await expect(page.getByRole("complementary").getByText("What helped you ask for time?", { exact: true })).toBeVisible();
  await expect(page.getByRole("complementary").getByText(/Family Expectations group · Ravi may reply in group/)).toBeVisible();
  await expect(page.getByRole("checkbox", { name: /I reviewed this exact alias/i })).not.toBeChecked();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Find Support" }).click();
  await page.getByRole("button", { name: "Explore professional support" }).click();
  await expect(page.getByRole("heading", { name: "We don't have a verified provider for these preferences yet." })).toBeVisible();
  await page.getByRole("button", { name: "Return to peer perspectives" }).click();
  await expect(page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 1 })).toBeVisible();
  await page.getByRole("tab", { name: "Discussions" }).click();
  await page.getByRole("button", { name: /Day 16 Keeping the question open/ }).click();
  await page.getByRole("button", { name: "Keep this takeaway privately" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Arjun chose this in the browser session only" })).toBeVisible();
  await page.getByRole("button", { name: "Offer one thing that helped" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Selected: Offer one thing that helped" })).toBeVisible();
  const preview = page.locator(".dev-bounded-preview");
  const draft = preview.getByRole("textbox", { name: "Edit the one part you may offer" });
  await draft.fill("I asked for time to think before replying. I am still working out what I want.");
  await expect(draft).toHaveValue("I asked for time to think before replying. I am still working out what I want.");
  await expect(preview.getByRole("checkbox")).not.toBeChecked();
  const addButton = preview.getByRole("button", { name: "Add to community" });
  await expect(addButton).toBeDisabled();
  await preview.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).check();
  await expect(addButton).toBeEnabled();
  await addButton.click();
  await expect(preview.getByRole("status")).toHaveText("Added to this fictional community view. Nothing was sent to any real group or person.");
  await expect(preview).toContainText("Fictional content");
  await draft.fill("I needed time before replying.");
  await expect(preview.getByRole("checkbox")).not.toBeChecked();
  await expect(addButton).toBeDisabled();
  await expect(preview.getByRole("status")).toHaveCount(0);
  await preview.getByRole("checkbox", { name: /I reviewed this exact text and group audience/i }).check();
  await addButton.click();
  await expect(preview.getByRole("status")).toHaveText("Added to this fictional community view. Nothing was sent to any real group or person.");
  await preview.getByRole("button", { name: "Review my choices" }).click();
  const close = page.getByRole("region", { name: "Arjun's final local choices" });
  await expect(close).toContainText("I can ask for time before deciding.");
  await expect(close).toContainText("One helpful thing for Dev");
  await expect(close).toContainText("Private context excluded");
  await expect(close).toContainText("Nothing is sent to a real group or person.");
  await expect(close).toContainText("I needed time before replying.");
  await expect(close).toContainText("Consent recorded in this browser only. No real audience received it.");
});

test("quiet reading opens a story without alias, question, joining or feedback", async ({ page }) => {
  await page.goto("/app?path=quiet");
  await expect(page.getByRole("heading", { name: "Explore communities and experiences" })).toBeVisible();
  await expect(page.getByText(/Quiet reading · no alias/i)).toBeVisible();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Experiences" }).click();
  await page.getByRole("button", { name: "Read experience" }).first().click();
  await expect(page.getByRole("heading", { name: "One person's experience" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Ravi" })).toHaveCount(0);
  await expect(page.getByLabel("Pseudonym")).toHaveCount(0);
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("arbitrary typed text stays tentative until the user confirms an interpretation", async ({ page }) => {
  await openArjun(page);
  await sendChat(page, "A completely different concern about my job.");
  await expect(page.getByText(/We can keep it broad/i)).toBeVisible();
  await sendChat(page, "I would like quiet support.");
  await sendChat(page, "I don't want someone to tell me what to do.");
  await expect(page.getByText(/No theme suggested yet\. You can keep talking or explore without a match\./i)).toBeVisible();
  await page.getByRole("button", { name: "Not quite" }).click();
  await expect(page.getByText("Not confirmed yet")).toBeVisible();
});

test("rejecting a broad legal topic changes discovery and the no-match branch is honest", async ({ page }) => {
  await reachCommunity(page);
  await page.getByRole("button", { name: "Not for me · change these results" }).click();
  await expect(page.getByText(/Broad legal-topic suggestions are set aside/i)).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Family Expectations & Personal Choices" })).toBeVisible();
  await page.getByRole("button", { name: "None of these feels relevant" }).click();
  await expect(page.getByRole("heading", { name: "There isn't a close fit in these communities." })).toBeVisible();
});

test("revoking Ravi's scope removes his story and blocks the question route", async ({ page }) => {
  await page.goto("/app?path=support");
  const summary = page.getByRole("textbox", { name: "Edit the shareable version" });
  await summary.fill("I chose to ask someone to listen before sharing more opinions.");
  await page.getByRole("button", { name: "Review what could be shared" }).click();
  await expect(page.locator(".public-preview").getByText("I chose to ask someone to listen before sharing more opinions.")).toBeVisible();
  const publish = page.getByRole("button", { name: "Apply choices to this scenario" });
  await expect(publish).toBeDisabled();
  await page.getByRole("button", { name: "Approve this summary" }).click();
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(page.getByText(/approved story is available in this scenario/i)).toBeVisible();
  await page.getByRole("checkbox", { name: "Allow one question in this fictional story" }).uncheck();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Communities" }).click();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Experiences" }).click();
  await page.getByRole("button", { name: "Read experience" }).first().click();
  await expect(page.getByRole("heading", { name: "Ravi accepts replies in the group only" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask Ravi" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to community" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My Journey" }).click();
  await page.getByRole("button", { name: "Review contribution choices" }).click();
  await page.getByRole("button", { name: "Remove from discovery" }).click();
  await expect(page.getByText(/removed from this scenario's discovery/i)).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Communities" }).click();
  await expect(page.getByRole("heading", { name: "Explore communities and experiences" })).toBeVisible();
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await expect(page.getByRole("button", { name: "Read experience" })).toHaveCount(2);
  await expect(page.getByText("Fictional contributor · Nisha")).toBeVisible();
  await expect(page.getByText("Fictional contributor · Mira")).toBeVisible();
});

test("story reflection and voluntary sharing keep the prior takeaway branches usable", async ({ page }) => {
  await reachCommunity(page);
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await page.getByRole("tab", { name: "Experiences" }).click();
  await page.getByRole("button", { name: "Read experience" }).first().click();
  await expect(page.getByRole("heading", { name: "Ravi accepts replies in the group only" })).toBeVisible();
  await page.getByRole("button", { name: "Reflect on what you read" }).click();
  await page.getByRole("button", { name: "Not helpful" }).click();
  await expect(page.getByText(/Thanks for saying so/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Read another perspective" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Take a break" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explore qualified support" })).toBeVisible();
  await page.getByLabel("Edit this, write your own, or leave it blank").fill("I want someone to listen before offering advice.");
  await page.getByRole("button", { name: "Keep privately" }).click();
  await expect(page.getByText(/Kept in this session only/i)).toBeVisible();
  await page.getByLabel("Choose an optional next step").selectOption("Talk with someone I trust");
  await page.getByRole("button", { name: "View my journey" }).click();
  await expect(page.getByText(/Your private takeaway/)).toBeVisible();
  await page.getByRole("button", { name: "Start separately" }).click();
  await expect(page.getByRole("heading", { name: "New City, Feeling Lonely After Work" })).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My Journey" }).click();
  await expect(page.getByText(/You started this chapter separately. The relationship conversation did not shape these topics/)).toBeVisible();
  await page.getByRole("button", { name: "Review contribution choices" }).click();
  await page.getByRole("button", { name: "Review what could be shared" }).click();
  await expect(page.locator(".public-preview")).toContainText("What others would see · fictional");
  await page.getByRole("button", { name: "Remove from discovery" }).click();
  await expect(page.getByText(/removed from this scenario's discovery/i)).toBeVisible();
});

test("My Journey keeps work and family conversation transcripts separate", async ({ page }) => {
  await openArjun(page);
  await sendChat(page, "At home, family expectations are weighing on me.");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My Journey" }).click();
  await page.getByRole("button", { name: /Work decisions/ }).click();
  await expect(page.getByRole("heading", { name: "You can start anywhere." })).toBeVisible();
  await sendChat(page, "My manager changed the project deadline.");
  await expect(page.getByText("At home, family expectations are weighing on me.", { exact: true })).toHaveCount(0);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My Journey" }).click();
  await page.getByRole("button", { name: /Family and choices/ }).click();
  await expect(page.getByText("At home, family expectations are weighing on me.", { exact: true })).toBeVisible();
  await expect(page.getByText("My manager changed the project deadline.")).toHaveCount(0);
});

test("navigation reaches safety information and supports keyboard use without horizontal overflow", async ({ page }, testInfo) => {
  await page.goto("/app?path=talk");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Find Support" }).click();
  await expect(page.getByRole("heading", { name: "Find Support" })).toBeVisible();
  await expect(page.getByText(/No messages are monitored and safety is not assessed here/i)).toBeVisible();
  await page.screenshot({ path: `/tmp/harmonise-${testInfo.project.name}-help.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("hero and core flows fit 1920x1080 and mobile viewports without horizontal overflow", async ({ page }, testInfo) => {
  await page.goto("/app");
  await page.screenshot({ path: `/tmp/harmonise-${testInfo.project.name}-landing.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.goto("/app?story=arjun");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await sendChat(page, "Things at home feel uncertain.");
  await page.getByRole("button", { name: "Something with someone" }).click();
  await sendChat(page, "My parents' expectations are part of it.");
  await page.getByRole("button", { name: "Yes, that’s closer" }).click();
  await page.screenshot({ path: `/tmp/harmonise-${testInfo.project.name}-understanding.png`, fullPage: true });
  await page.getByRole("button", { name: "Hear experiences" }).click();
  await expect(page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 2 })).toBeVisible();
  await page.screenshot({ path: `/tmp/harmonise-${testInfo.project.name}-discovery.png`, fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/app?path=quiet");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/app?story=arjun");
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  const findSupport = nav.getByRole("button", { name: "Find Support" });
  await expect(findSupport).toBeVisible();
  await expect(findSupport).toBeInViewport();
  expect(await nav.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/app?path=quiet");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Explore community" }).first().click();
  await expect(page.getByRole("heading", { name: "Family Expectations & Personal Choices", level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
