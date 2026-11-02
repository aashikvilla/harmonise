import { NextResponse } from "next/server";
import { dbFailureStatus, isDatabaseConfigured } from "@/lib/db/supabase";
import { getCommunityWithCounts, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const community = await getCommunityWithCounts(id);
    if (!community) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ community });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
