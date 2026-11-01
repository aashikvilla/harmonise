/** Fixed application-controlled catalog. The model may only reference these IDs. */

export type CommunityId = "rebuilding" | "legal-clarity" | "steady-ground";

export type Community = {
  id: CommunityId;
  name: string;
  description: string;
  memberCount: string;
  cadence: string;
  topics: string[];
  agentName: string;
  boundaries: string[];
  extraNote?: string;
};

export const COMMUNITY_IDS: readonly CommunityId[] = ["rebuilding", "legal-clarity", "steady-ground"];

export const COMMUNITIES: Record<CommunityId, Community> = {
  rebuilding: {
    id: "rebuilding",
    name: "Rebuilding after separation",
    description:
      "For separation, divorce, breakup, co-parenting, identity change, and starting over — with people who are rebuilding too.",
    memberCount: "1,240 members (sample)",
    cadence: "Evening check-ins",
    topics: ["Starting over", "Co-parenting", "Identity change", "Breakup", "Divorce"],
    agentName: "Rebuilding circle agent",
    boundaries: [
      "Share only what feels safe; no one must share details.",
      "No contact details or meeting requests in the feed.",
      "Support, not advice-giving: speak from your own experience.",
    ],
  },
  "legal-clarity": {
    id: "legal-clarity",
    name: "Separation: practical clarity",
    description:
      "For preparing questions and decisions before speaking with a qualified legal professional. Peer discussion only.",
    memberCount: "860 members (sample)",
    cadence: "Questions welcome",
    topics: ["Preparing questions", "Paperwork", "Decisions", "Next steps"],
    agentName: "Clarity circle agent",
    boundaries: [
      "Peer discussion is never legal advice.",
      "Bring lists of questions, not legal documents.",
      "A qualified legal professional makes the call on your situation.",
    ],
    extraNote: "Never present peer discussion as legal advice.",
  },
  "steady-ground": {
    id: "steady-ground",
    name: "Finding steady ground",
    description:
      "For uncertainty, grief, loneliness, family pressure, anxiety, and disrupted routines — a slow, supportive pace.",
    memberCount: "2,105 members (sample)",
    cadence: "Slow, supportive",
    topics: ["Uncertainty", "Grief", "Loneliness", "Family pressure", "Routines"],
    agentName: "Steady ground circle agent",
    boundaries: [
      "Slow pace: short posts are welcome.",
      "No fixing others; witnessing is enough.",
      "Flag worrying posts instead of engaging with them.",
    ],
  },
};

export function getCommunity(id: string): Community | null {
  if (id === "rebuilding" || id === "legal-clarity" || id === "steady-ground") return COMMUNITIES[id];
  return null;
}

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

export type FeedPost = { id: string; author: string; time: string; text: string; helpful: number };
export type ScheduledCard = { id: string; title: string; text: string };

export const SAMPLE_FEEDS: Record<CommunityId, FeedPost[]> = {
  rebuilding: [
    { id: "rb-1", author: "Maya (sample)", time: "Evening check-in", text: "First weekend in the new place. Quiet, but mine. Small win: I cooked a real dinner.", helpful: 24 },
    { id: "rb-2", author: "Dev (sample)", time: "Evening check-in", text: "Co-parenting handoff went smoothly today. Writing down what worked so I remember it next time.", helpful: 18 },
  ],
  "legal-clarity": [
    { id: "lc-1", author: "Priya (sample)", time: "Questions welcome", text: "My list for the lawyer keeps growing. Top item: what paperwork should I gather first?", helpful: 11 },
    { id: "lc-2", author: "Sam (sample)", time: "Questions welcome", text: "Reminder that helped me: write questions down, don't rehearse arguments. Brought a calmer list.", helpful: 15 },
  ],
  "steady-ground": [
    { id: "sg-1", author: "June (sample)", time: "Slow check-in", text: "Grief came in waves today. Naming it here instead of carrying it alone.", helpful: 31 },
    { id: "sg-2", author: "Theo (sample)", time: "Slow check-in", text: "One routine kept: morning walk. Everything else can wait.", helpful: 22 },
  ],
};

export const SCHEDULED_CARDS: Record<CommunityId, ScheduledCard[]> = {
  rebuilding: [{ id: "rb-s1", title: "Tonight's prompt", text: "What is one small thing that felt like yours today?" }],
  "legal-clarity": [{ id: "lc-s1", title: "Today's prompt", text: "What is one question you want answered before your next decision?" }],
  "steady-ground": [{ id: "sg-s1", title: "Gentle prompt", text: "What is one routine — however small — that steadied you this week?" }],
};

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
