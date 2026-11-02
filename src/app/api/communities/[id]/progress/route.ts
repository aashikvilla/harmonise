import { NextResponse } from "next/server";
import { checkUserRateLimit } from "@/lib/meta-model";
import { getCommunityProgressSummary } from "@/lib/community-progress";
import { getMembership, validCommunityId } from "@/lib/db/community";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-progress", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  try {
    const membership = await getMembership(user.id, id);
    if (!membership || membership.status !== "active") return NextResponse.json({ error: "not-active-member" }, { status: 403 });
    const progress = await getCommunityProgressSummary(id, user.id, membership.id);
    return NextResponse.json(progress, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
