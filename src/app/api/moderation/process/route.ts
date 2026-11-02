import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { processNextEvent } from "@/lib/db/moderation";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Queue worker: triages one queued event per call. Protected by a worker
 * secret so only the scheduled job can invoke it. Call repeatedly (or on a
 * schedule) until it reports empty.
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
  try {
    const outcome = await processNextEvent();
    logRouteCall({ route: "POST /api/moderation/process", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json(outcome);
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
