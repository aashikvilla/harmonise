import { selectSingle, supabaseRest } from "@/lib/db/supabase";

export const CONTRIBUTION_THRESHOLDS = {
  contributor: { contributions: 3, activeDays: 2 },
  communityRegular: { contributions: 10, activeDays: 5 },
} as const;

export type CommunityProgressLevel = "new-member" | "contributor" | "community-regular";

export type CommunityProgressSummary = {
  level: CommunityProgressLevel;
  contributions: number;
  activeDays: number;
  thresholds: typeof CONTRIBUTION_THRESHOLDS;
  verification: { enabled: false } | { enabled: true; role: string | null };
};

export function isCommunityRoleVerificationEnabled() {
  return process.env.COMMUNITY_ROLE_VERIFICATION_ENABLED?.trim().toLowerCase() === "true";
}

export function communityProgressLevel(contributions: number, activeDays: number): CommunityProgressLevel {
  if (
    contributions >= CONTRIBUTION_THRESHOLDS.communityRegular.contributions &&
    activeDays >= CONTRIBUTION_THRESHOLDS.communityRegular.activeDays
  ) {
    return "community-regular";
  }
  if (
    contributions >= CONTRIBUTION_THRESHOLDS.contributor.contributions &&
    activeDays >= CONTRIBUTION_THRESHOLDS.contributor.activeDays
  ) {
    return "contributor";
  }
  return "new-member";
}

export async function getCommunityProgressSummary(communityId: string, userId: string, membershipId: string): Promise<CommunityProgressSummary> {
  const rows = await supabaseRest<Array<{ contributions: number; active_days: number }>>(
    "rpc/community_member_contribution_summary",
    { method: "POST", body: { p_community_id: communityId, p_user_id: userId } },
  );
  const summary = selectSingle(rows);
  const contributions = Math.max(0, Number(summary?.contributions ?? 0));
  const activeDays = Math.max(0, Number(summary?.active_days ?? 0));

  let verification: CommunityProgressSummary["verification"] = { enabled: false };
  if (isCommunityRoleVerificationEnabled()) {
    const verificationRows = await supabaseRest<Array<{ role_label: string }>>("community_member_verifications", {
      query: `?community_id=eq.${encodeURIComponent(communityId)}&membership_id=eq.${encodeURIComponent(membershipId)}&select=role_label&limit=1`,
    });
    verification = { enabled: true, role: verificationRows[0]?.role_label ?? null };
  }

  return {
    level: communityProgressLevel(contributions, activeDays),
    contributions,
    activeDays,
    thresholds: CONTRIBUTION_THRESHOLDS,
    verification,
  };
}
