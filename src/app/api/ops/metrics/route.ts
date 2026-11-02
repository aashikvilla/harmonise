import { NextResponse } from "next/server";
import { getOpsSummary } from "@/lib/ops-metrics";
import { isDatabaseConfigured, supabaseCount } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * Aggregate operational metrics: request counts, errors, latency, token
 * totals, and moderation queue depth. No private text, notes, or identities.
 * Protected by a shared secret (x-ops-secret header).
 */
export async function GET(request: Request) {
  const secret = process.env.OPS_METRICS_SECRET?.trim();
  if (!secret || request.headers.get("x-ops-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const summary = getOpsSummary();
  let queue: Record<string, number> | null = null;
  if (isDatabaseConfigured()) {
    try {
      const [queued, processing, triaged, dead, openReports] = await Promise.all([
        supabaseCount("moderation_events", "?status=eq.queued"),
        supabaseCount("moderation_events", "?status=eq.processing"),
        supabaseCount("moderation_events", "?status=eq.triaged"),
        supabaseCount("moderation_events", "?status=eq.dead"),
        supabaseCount("reports", "?status=eq.open"),
      ]);
      queue = { queued, processing, triaged, dead, openReports };
    } catch {
      queue = null;
    }
  }
  return NextResponse.json({ ...summary, queue });
}
