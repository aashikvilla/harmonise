import type { ConsentAction } from "@/lib/db/types";

/**
 * Versioned consent copy. Every share action records the exact version shown,
 * the audience, a hash of the exact approved text, and the timestamp.
 * Bump the version whenever the wording or the audience semantics change.
 */
export const CONSENT_VERSION = "2026-11-02.1";

export const CONSENT_COPY: Record<
  ConsentAction,
  { title: string; audienceNote: string; revocationNote: string }
> = {
  post: {
    title: "Review before posting",
    audienceNote: "This text will be visible to members of this community under your alias for this community only.",
    revocationNote: "You can delete your post at any time. Deletion removes it from Harmonise; copies already seen by others cannot be recalled.",
  },
  reply: {
    title: "Review before replying",
    audienceNote: "This reply will be visible to members of this community under your alias for this community only.",
    revocationNote: "You can delete your reply at any time. Deletion removes it from Harmonise; copies already seen by others cannot be recalled.",
  },
  question: {
    title: "Review before asking",
    audienceNote: "This question will be visible to members of this community under your alias for this community only.",
    revocationNote: "You can delete your question at any time. Deletion removes it from Harmonise; copies already seen by others cannot be recalled.",
  },
};

export async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function consentSummary(action: ConsentAction, communityName: string, alias: string) {
  const copy = CONSENT_COPY[action];
  return `${copy.title} · ${communityName} · alias ${alias} (consent ${CONSENT_VERSION})`;
}
