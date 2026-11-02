import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getCommunityWithCounts, getCommunityAgent, getMembership, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

/** Public-safe helper identity, visible only to an active member or owner. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const community = await getCommunityWithCounts(id);
    if (!community) return NextResponse.json({ error: "not-found" }, { status: 404 });
    const membership = await getMembership(user.id, id);
    const owner = community.created_by === user.id;
    if (!owner && membership?.status !== "active") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const agent = await getCommunityAgent(id);
    if (!agent) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    return NextResponse.json({
      agent: {
        displayName: agent.display_name,
        status: agent.status,
        disclosure: "AI helper. It offers advisory safety triage to human moderators and cannot take moderation actions.",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
