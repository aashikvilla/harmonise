import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { reviewCommunityScopeChange, rollbackCommunityScopeChange, validCommunityId } from "@/lib/db/community";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid, SupabaseError } from "@/lib/db/supabase";
import { isCommunityModerator } from "@/lib/db/moderation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; proposalId: string }> }) {
  const { id, proposalId } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id) || !isUuid(proposalId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const parsed = await parseJsonBody(request);
  if (!parsed.ok || typeof parsed.value !== "object" || parsed.value === null || Array.isArray(parsed.value)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const body = parsed.value as Record<string, unknown>;
  if (body.decision !== "approved" && body.decision !== "rejected" && body.decision !== "rollback") return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (typeof body.rationale !== "string" || body.rationale.trim().length < 3 || body.rationale.trim().length > 1000) {
    return NextResponse.json({ error: "rationale-required" }, { status: 400 });
  }
  try {
    if (!(await isCommunityModerator(user.id, id))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const change = body.decision === "rollback"
      ? await rollbackCommunityScopeChange({
          changeId: proposalId,
          communityId: id,
          reviewerId: user.id,
          rationale: body.rationale.trim(),
        })
      : await reviewCommunityScopeChange({
          changeId: proposalId,
          communityId: id,
          reviewerId: user.id,
          decision: body.decision,
          rationale: body.rationale.trim(),
        });
    if (!change || change.community_id !== id) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ change });
  } catch (error) {
    if (error instanceof SupabaseError && error.code === "P0002") {
      return NextResponse.json({ error: "not-found" }, { status: 404 });
    }
    if (error instanceof SupabaseError && ["23505", "40001"].includes(error.code)) {
      return NextResponse.json({ error: body.decision === "rollback" ? "rollback-unavailable" : "scope-changed" }, { status: 409 });
    }
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
