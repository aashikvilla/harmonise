/** Shared limits and shapes for the live adviser API. No secrets here. */

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_TURNS = 4;
export const MAX_HISTORY_CHARS = 800;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX_REQUESTS = 10;

export type AdviceMatch = { id: string; reason: string };

export const THEME_IDS = [
  "family-expectations",
  "relationship-uncertainty",
  "work-pressure",
  "relocation",
  "belonging",
  "personal-autonomy",
  "communication",
  "hobbies",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];
export const SUPPORT_NEEDS = ["human-perspective", "quiet-reading", "shared-activity", "not-sure"] as const;
export type SupportNeed = (typeof SUPPORT_NEEDS)[number];

export type AdviceResult = {
  reflection: string;
  steps: string[];
  perspective: string;
  matches: AdviceMatch[];
  model?: string;
};

export type AdviceRequestBody = {
  message?: unknown;
  history?: unknown;
};

export type HistoryTurn = { role: "user" | "adviser"; text: string };

export function cleanHistory(value: unknown): HistoryTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: HistoryTurn[] = [];
  for (const item of value) {
    if (turns.length >= MAX_HISTORY_TURNS) break;
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    if (record.role !== "user" && record.role !== "adviser") continue;
    if (typeof record.text !== "string") continue;
    const text = record.text.trim().slice(0, MAX_HISTORY_CHARS);
    if (text.length > 0) turns.push({ role: record.role, text });
  }
  return turns;
}
