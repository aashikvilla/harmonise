import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, supabaseRest } from "@/lib/db/supabase";
import { moderatorMemberships } from "@/lib/db/moderation";
import type { CommunityRow } from "@/lib/db/types";

export const runtime = "nodejs";

/** Communities where the caller serves as an active moderator. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const memberships = await moderatorMemberships(user.id);
    if (memberships.length === 0) return NextResponse.json({ assignments: [] });
    const communities = await supabaseRest<CommunityRow[]>("communities", {
      query: `?id=in.(${memberships.map((member) => member.community_id).join(",")})&select=id,name`,
    });
    const names = new Map(communities.map((community) => [community.id, community.name]));
    return NextResponse.json({
      assignments: memberships.map((member) => ({
        community_id: member.community_id,
        community_name: names.get(member.community_id) ?? member.community_id,
        membership_id: member.id,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
