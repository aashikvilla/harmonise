/** Honest community-to-theme relevance. Shown as overlap only — never scores. */

export const COMMUNITY_THEMES: Record<string, string[]> = {
  rebuilding: ["relationship-uncertainty", "personal-autonomy", "belonging"],
  "legal-clarity": ["personal-autonomy", "communication"],
  "steady-ground": ["work-pressure", "relocation", "belonging", "family-expectations"],
};

export const THEME_LABELS: Record<string, string> = {
  "family-expectations": "family expectations",
  "relationship-uncertainty": "relationship uncertainty",
  "work-pressure": "work pressure",
  relocation: "relocation",
  belonging: "belonging",
  "personal-autonomy": "personal autonomy",
  communication: "communication",
  hobbies: "hobbies",
};

export function overlappingThemes(communityId: string, confirmedThemes: string[]) {
  const related = COMMUNITY_THEMES[communityId] ?? [];
  return related.filter((theme) => confirmedThemes.includes(theme));
}
