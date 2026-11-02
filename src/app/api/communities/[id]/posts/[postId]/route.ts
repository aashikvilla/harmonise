import { NextResponse } from "next/server";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { deleteOwnPost, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

/** Authors delete their own posts. Moderator removals go through Phase 6 decisions. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { id, postId } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id) || !isUuid(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const deleted = await deleteOwnPost(user.id, postId);
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not-found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
