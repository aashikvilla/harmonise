import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { facilitateOldestUnansweredAsk, listCommunities } from "@/lib/db/community";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Facilitator worker: answers one unanswered question per call as the
 * community's clearly-labelled AI guide. Protected by the worker secret.
 * Pass ?community=<id> or omit to scan approved communities in turn.
 */
export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  const secret = process.env.MODERATION_WORKER_SECRET?.trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") ?? "";
  const cronOk = !!cronSecret && authHeader.toLowerCase().startsWith("bearer ") && authHeader.slice(7) === cronSecret;
  const authorized = (!!secret && request.headers.get("x-worker-secret") === secret) || cronOk;
  if (!authorized) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const only = new URL(request.url).searchParams.get("community");
  try {
    const communities = only ? [{ id: only }] : await listCommunities(undefined);
    for (const community of communities) {
      const outcome = await facilitateOldestUnansweredAsk(community.id);
      if (outcome.facilitated) {
        logRouteCall({ route: "POST /api/moderation/facilitate", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
        return NextResponse.json({ ...outcome, communityId: community.id });
      }
      if (outcome.reason === "unavailable") {
        return NextResponse.json({ ...outcome, communityId: community.id }, { status: 502 });
      }
    }
    return NextResponse.json({ facilitated: false, reason: "empty" });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
