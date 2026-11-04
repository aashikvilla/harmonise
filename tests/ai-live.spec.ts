import { expect, test } from "@playwright/test";

/**
 * Keyed live-model spec (Phase 1 AI features). Each test spends exactly one
 * Meta call, so the file runs on desktop only and skips entirely unless
 * MODEL_API_KEY is present in the test-runner environment. Ordinary
 * `npm run test:e2e` therefore never spends provider credits.
 *
 * Never prints prompts or completions: assertions check shapes, enums, and
 * lengths only. All inputs are synthetic; no real user narratives.
 */

const COMMUNITY_IDS = ["legal-clarity", "rebuilding", "steady-ground"];
const TRIAGE_CONCERNS = [
  "none",
  "harassment",
  "personal-data",
  "coercive-advice",
  "medical-or-legal-claim",
  "self-harm",
  "threat",
  "other",
];

test.setTimeout(120_000);

test.beforeEach(async () => {
  test.skip(process.env.MODEL_API_KEY === undefined || process.env.MODEL_API_KEY === "", "Live-model tests need MODEL_API_KEY in the runner environment.");
  test.skip(test.info().project.name !== "desktop", "One project only: each test spends a provider call.");
});

test("private chat returns a live Muse Spark response without a scripted fallback", async ({ page }) => {
  const response = await page.request.post("/api/chat", {
    data: { message: "Work has felt overwhelming lately and I cannot switch off in the evening.", history: [] },
    timeout: 60_000,
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { reply: string; suggestedThemes: string[]; supportNeed: string; needSummary: string };
  expect(body.reply.trim().length).toBeGreaterThan(0);
  expect(body.suggestedThemes.every((theme) => ["family-expectations", "relationship-uncertainty", "work-pressure", "relocation", "belonging", "personal-autonomy", "communication", "hobbies"].includes(theme))).toBe(true);
  expect(body.needSummary.trim().length).toBeGreaterThan(0);
});

test("advice returns reflection, steps, perspective, and community matches", async ({ page }) => {
  const response = await page.request.post("/api/advice", {
    data: {
      message: "Work deadlines keep moving and I cannot switch off. What is one small thing I can try this week?",
      history: [],
    },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    reflection: string;
    steps: string[];
    perspective: string;
    matches: { id: string; reason: string }[];
  };
  expect(body.reflection.trim().length).toBeGreaterThan(0);
  expect(body.steps.length).toBeGreaterThanOrEqual(2);
  expect(body.steps.length).toBeLessThanOrEqual(4);
  expect(body.perspective.trim().length).toBeGreaterThan(0);
  for (const match of body.matches) {
    expect(COMMUNITY_IDS).toContain(match.id);
    expect(match.reason.trim().length).toBeGreaterThan(0);
  }
});

test("triage classifies a benign post with a valid schema", async ({ page }) => {
  const response = await page.request.post("/api/moderation/triage", {
    data: { text: "I asked my parents for more time to think. It was hard but I said what mattered to me." },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as {
    concern: string;
    severity: string;
    rationale: string;
    recommendedAction: string;
  };
  expect(TRIAGE_CONCERNS).toContain(body.concern);
  expect(["low", "review", "urgent"]).toContain(body.severity);
  expect(["no-action", "human-review", "urgent-human-review"]).toContain(body.recommendedAction);
  expect(body.rationale.trim().length).toBeGreaterThan(0);
});

test("transcribe accepts generated silence and returns a transcript field", async ({ page }) => {
  const rate = 24000;
  const samples = rate * 1;
  const pcm = Buffer.alloc(samples * 2);
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + pcm.length, 4);
  head.write("WAVE", 8);
  head.write("fmt ", 12);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(pcm.length, 40);
  const response = await page.request.post("/api/voice/transcribe", {
    multipart: {
      audio: { name: "silence.wav", mimeType: "audio/wav", buffer: Buffer.concat([head, pcm]) },
    },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { transcript: unknown };
  expect(typeof body.transcript).toBe("string");
});
