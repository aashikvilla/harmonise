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

export type Coach = {
  id: string;
  initials: string;
  name: string;
  scope: string;
  story: string;
  points: number;
  format: string;
  price: string;
};

export const COACHES: Coach[] = [
  {
    id: "coach-amara",
    initials: "AA",
    name: "Amara A.",
    scope: "Separation and starting over",
    story:
      "Amara rebuilt her daily life after a long marriage ended. She supports members who are starting over with routines, housing, and identity. (Sample coach.)",
    points: 482,
    format: "30-minute intro chat (example)",
    price: "$25 example session",
  },
  {
    id: "coach-rafael",
    initials: "RM",
    name: "Rafael M.",
    scope: "Co-parenting and family pressure",
    story:
      "Rafael learned to co-parent steadily through two difficult years. He supports members navigating family pressure with calm, practical habits. (Sample coach.)",
    points: 356,
    format: "30-minute intro chat (example)",
    price: "$20 example session",
  },
  {
    id: "coach-lena",
    initials: "LK",
    name: "Lena K.",
    scope: "Grief, loneliness, and new routines",
    story:
      "Lena found steady ground after loss by rebuilding one routine at a time. She supports members who feel untethered or alone. (Sample coach.)",
    points: 519,
    format: "30-minute intro chat (example)",
    price: "$25 example session",
  },
];

export type SuggestedMilestone = { id: string; title: string; hint: string };

export const SUGGESTED_MILESTONES: SuggestedMilestone[] = [
  { id: "m-named", title: "Named what I'm going through", hint: "Putting words to it, privately, in your own time." },
  { id: "m-step", title: "Tried one next step", hint: "Any small action from your guidance counts." },
  { id: "m-circle", title: "Joined a circle", hint: "Only if and when you choose to." },
  { id: "m-checkin", title: "Checked in three evenings", hint: "Steady presence, at your own pace." },
];
