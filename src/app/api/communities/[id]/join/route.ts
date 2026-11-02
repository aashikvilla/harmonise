import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { joinCommunity, validAlias, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "community-join", 10)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  const alias = validAlias(record.alias);
  if (!alias) return NextResponse.json({ error: "invalid-alias" }, { status: 400 });
  try {
    const result = await joinCommunity(user.id, id, alias);
    if ("error" in result) {
      const status = result.error === "blocked" ? 403 : 404;
      logRouteCall({ route: "POST /api/communities/[id]/join", status, latencyMs: Date.now() - started, requestId, outcome: "error", errorKind: result.error });
      return NextResponse.json({ error: result.error }, { status });
    }
    logRouteCall({ route: "POST /api/communities/[id]/join", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ membership: result.membership });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
