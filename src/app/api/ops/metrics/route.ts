import { NextResponse } from "next/server";
import { getOpsSummary } from "@/lib/ops-metrics";
import { isDatabaseConfigured, supabaseCount, supabaseRest } from "@/lib/db/supabase";

export const runtime = "nodejs";

/**
 * Aggregate operational metrics: request counts, errors, latency, token
 * totals, moderation queue depth + oldest queued age, and the
 * signup→join→post funnel. No private text, notes, or identities.
 * Protected by a shared secret (x-ops-secret header).
 */
export async function GET(request: Request) {
  const secret = process.env.OPS_METRICS_SECRET?.trim();
  if (!secret || request.headers.get("x-ops-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const summary = getOpsSummary();
  let queue: Record<string, number> | null = null;
  let funnel: Record<string, number> | null = null;
  let oldestQueuedAt: string | null = null;
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
      const oldest = await supabaseRest<Array<{ created_at: string }>>("moderation_events", {
        query: "?status=eq.queued&order=created_at.asc&select=created_at&limit=1",
      });
      oldestQueuedAt = oldest[0]?.created_at ?? null;
    } catch {
      queue = null;
    }
    try {
      const [accounts, memberships, posts] = await Promise.all([
        supabaseCount("profiles", "?select=id"),
        supabaseCount("memberships", "?status=eq.active"),
        supabaseCount("posts", "?select=id"),
      ]);
      funnel = { accounts, memberships, posts };
    } catch {
      funnel = null;
    }
  }
  return NextResponse.json({ ...summary, queue, funnel, oldestQueuedAt });
}
