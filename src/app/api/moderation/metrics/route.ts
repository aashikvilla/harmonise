import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getMetrics, isCommunityModerator } from "@/lib/db/moderation";
import { validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

/** Aggregate moderation metrics. No private text, reviewer notes, or identities. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const communityId = new URL(request.url).searchParams.get("community") ?? "";
  if (!validCommunityId(communityId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    if (!(await isCommunityModerator(user.id, communityId))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const metrics = await getMetrics(communityId);
    return NextResponse.json({ metrics });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
