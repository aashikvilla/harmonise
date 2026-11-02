import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getMyReportOutcomes, validCommunityId } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

/** A member's own reports with decisions and appeal states (for appeal entry points). */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const community = new URL(request.url).searchParams.get("community");
  if (!community || !validCommunityId(community)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "my-decisions", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const outcomes = await getMyReportOutcomes(user.id, community);
    return NextResponse.json({ outcomes });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
