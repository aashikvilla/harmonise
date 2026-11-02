/** Synthetic counts represent qualifying unique contributions only. Never insert these aliases into Auth or memberships. */
export const COMMUNITY_PROGRESS_DEMO_FIXTURES: Array<{
  demoOnly: true;
  alias: string;
  level: "new-member" | "contributor" | "community-regular";
  contributions: number;
  activeDays: number;
}> = [
  { demoOnly: true, alias: "Example Willow", level: "new-member", contributions: 1, activeDays: 1 },
  { demoOnly: true, alias: "Example Harbor", level: "contributor", contributions: 3, activeDays: 2 },
  { demoOnly: true, alias: "Example Meadow", level: "community-regular", contributions: 10, activeDays: 5 },
];
