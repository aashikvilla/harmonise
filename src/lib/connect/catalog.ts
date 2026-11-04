/**
 * Fixed adviser match IDs. The model may only reference these IDs; they are
 * suggestions, not live communities. Live community data (names, counts,
 * membership, posts) always comes from /api/communities.
 */

export type CommunityId = "rebuilding" | "legal-clarity" | "steady-ground";

export const COMMUNITY_IDS: readonly CommunityId[] = ["rebuilding", "legal-clarity", "steady-ground"];

/** Deterministic crisis screen. Runs before any model call, on client and server. */
const CRISIS_PATTERNS: RegExp[] = [
  /suicid/i,
  /self[\s-]?harm/i,
  /hurt(ing)? myself/i,
  /want(ing)? to die/i,
  /wish (i was|i were) dead/i,
  /kill(ing)? (myself|me)\b/i,
  /end my life/i,
  /overdos/i,
  /\bnot safe\b/i,
  /unsafe/i,
  /immediate danger/i,
  /\bin danger\b/i,
  /harm(ing)? (someone|another|other|a person|him|her|them)\b/i,
  /hurt(ing)? (someone|another|other|a person|him|her|them)\b/i,
  /kill (someone|another|other|a person|him|her|them)\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

/** Visible-text leak guard: model guidance must never name or hint at matching. */
const LEAK_PATTERNS: RegExp[] = [
  /rebuilding/i,
  /legal-clarity/i,
  /steady-ground/i,
  /separation: practical clarity/i,
  /rebuilding after separation/i,
  /finding steady ground/i,
  /communit/i,
  /support group/i,
  /peer group/i,
];

export function leaksCommunityReference(text: string): boolean {
  return LEAK_PATTERNS.some((pattern) => pattern.test(text));
}
