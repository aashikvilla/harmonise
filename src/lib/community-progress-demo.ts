import { CONTRIBUTION_THRESHOLDS, type CommunityProgressLevel } from "@/lib/community-progress";

/** Synthetic counts represent qualifying unique contributions only. Never insert these aliases into Auth or memberships. */
export const COMMUNITY_PROGRESS_DEMO_FIXTURES: Array<{
  demoOnly: true;
  alias: string;
  level: CommunityProgressLevel;
  contributions: number;
  activeDays: number;
}> = [
  { demoOnly: true, alias: "Example Willow", level: "new-member", contributions: 1, activeDays: 1 },
  { demoOnly: true, alias: "Example Harbor", level: "contributor", contributions: CONTRIBUTION_THRESHOLDS.contributor.contributions, activeDays: CONTRIBUTION_THRESHOLDS.contributor.activeDays },
  { demoOnly: true, alias: "Example Meadow", level: "community-regular", contributions: CONTRIBUTION_THRESHOLDS.communityRegular.contributions, activeDays: CONTRIBUTION_THRESHOLDS.communityRegular.activeDays },
];
