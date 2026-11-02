import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { featurePost, listFeaturedPosts, unfeaturePost, validCommunityId } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "featured-read", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const posts = await listFeaturedPosts(id);
    if (!posts) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    logRouteCall({ route: "featured", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ posts });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "featured-write", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const record = (await request.json().catch(() => null)) as { postId?: unknown } | null;
  if (!record || typeof record.postId !== "string") return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await featurePost(user.id, id, record.postId);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) {
      const status = result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "featured-write", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const postId = new URL(request.url).searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await unfeaturePost(user.id, id, postId);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) {
      const status = result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
