import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getMembership, getReactionSummary, toggleReaction, validCommunityId } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

function ids(request: Request, params: { id: string; postId: string }) {
  if (!isDatabaseConfigured()) return { status: 503 as const };
  if (!validCommunityId(params.id)) return { status: 400 as const };
  return { status: 200 as const, communityId: params.id, postId: params.postId };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const resolved = ids(request, await params);
  if (resolved.status !== 200) return NextResponse.json({ error: "invalid" }, { status: resolved.status });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "reactions-read", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const membership = await getMembership(user.id, resolved.communityId);
    const summary = await getReactionSummary(resolved.postId, membership?.id ?? null);
    if (!summary) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    logRouteCall({ route: "reactions", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json(summary);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; postId: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const resolved = ids(request, await params);
  if (resolved.status !== 200) return NextResponse.json({ error: "invalid" }, { status: resolved.status });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "reactions-toggle", 60)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const result = await toggleReaction(user.id, resolved.communityId, resolved.postId);
    if (!result) return NextResponse.json({ error: "unavailable" }, { status: 503 });
    if ("error" in result) {
      const status = result.error === "not-found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    logRouteCall({ route: "reactions", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
