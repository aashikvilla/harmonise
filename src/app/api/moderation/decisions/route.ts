import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getDecisionLog } from "@/lib/db/moderation";
import { validCommunityId } from "@/lib/db/community";

/** Moderator-only audit trail of moderation decisions for one community. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const community = new URL(request.url).searchParams.get("community");
  if (!community || !validCommunityId(community)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const log = await getDecisionLog(user.id, community);
    if ("error" in log) return NextResponse.json({ error: log.error }, { status: 403 });
    return NextResponse.json({ decisions: log });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
