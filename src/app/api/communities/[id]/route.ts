import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getCommunityWithCounts, getMembership, publicCommunity, setCommunityArchived, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const community = await getCommunityWithCounts(id);
    if (!community) return NextResponse.json({ error: "not-found" }, { status: 404 });
    if (community.launch_status !== "approved") {
      const user = await getAuthUser(request);
      if (!user) return NextResponse.json({ error: "not-found" }, { status: 404 });
      if (community.launch_status === "archived") {
        const member = await getMembership(user.id, id);
        if (!member && community.created_by !== user.id) {
          return NextResponse.json({ error: "not-found" }, { status: 404 });
        }
      } else if (community.created_by !== user.id) {
        return NextResponse.json({ error: "not-found" }, { status: 404 });
      }
    }
    return NextResponse.json({ community: publicCommunity(community) });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

/** Moderator-only archive (read-only) / revive decision. Never silent deletion. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const record = (await request.json().catch(() => null)) as { archived?: unknown } | null;
  if (!record || typeof record.archived !== "boolean") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await setCommunityArchived(user.id, id, record.archived);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
    const community = await getCommunityWithCounts(id);
    return NextResponse.json({ community: community ? publicCommunity(community) : null });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
