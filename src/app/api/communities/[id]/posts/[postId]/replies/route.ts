import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { blockedMembershipIds, checkPostsAccess, createReply, listReplies, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { id, postId } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id) || !isUuid(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  try {
    const access = await checkPostsAccess(user?.id ?? null, id);
    if (!access.ok) {
      const status = access.reason === "not-found" ? 404 : access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: access.reason }, { status });
    }
    const excluded = user ? await blockedMembershipIds(user.id, id) : [];
    const replies = await listReplies(postId, access.moderator, excluded);
    return NextResponse.json({ replies });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const { id, postId } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id) || !isUuid(postId)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-reply", 30)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 8_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.body !== "string" || !record.body.trim() || record.body.length > 2000) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await createReply(user.id, id, postId, record.body, record.consentVersion);
    if ("error" in result) {
      if (result.error === "crisis") return NextResponse.json({ crisis: true });
      if (result.error === "archived") return NextResponse.json({ error: "archived" }, { status: 403 });
      const status = result.error === "stale-consent" ? 409 : result.error === "blocked" ? 403 : result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ reply: result.reply });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
