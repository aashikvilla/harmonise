import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { blockedMembershipIds, checkPostsAccess, createPost, listPosts, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  try {
    const access = await checkPostsAccess(user?.id ?? null, id);
    if (!access.ok) {
      const status = access.reason === "not-found" ? 404 : access.reason === "signed-out" ? 401 : 403;
      return NextResponse.json({ error: access.reason }, { status });
    }
    const excluded = user ? await blockedMembershipIds(user.id, id) : [];
    const posts = await listPosts(id, access.moderator, excluded);
    return NextResponse.json({ posts, moderator: access.moderator });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-post", 20)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 12_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.body !== "string" || !record.body.trim() || record.body.length > 4000) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await createPost(user.id, id, record.body, record.consentVersion);
    if ("error" in result) {
      const status = result.error === "stale-consent" ? 409 : result.error === "blocked" ? 403 : result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ post: result.post });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
