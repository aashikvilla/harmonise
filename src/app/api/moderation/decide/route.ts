import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { DECISIONS, recordDecision, type DecisionKind } from "@/lib/db/moderation";

export const runtime = "nodejs";

/** A human reviewer decides. No AI result can take this action. */
export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "moderation-decide", 60)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 4_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.reportId !== "string" || !(DECISIONS as readonly string[]).includes(record.decision as string)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const rationale = typeof record.rationale === "string" ? record.rationale : "";
  if (record.decision !== "no-action" && !rationale.trim()) {
    return NextResponse.json({ error: "rationale-required" }, { status: 400 });
  }
  if (rationale.length > 1000) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await recordDecision(user.id, record.reportId, record.decision as DecisionKind, rationale);
    if ("error" in result) {
      const status = result.error === "forbidden" ? 403 : result.error === "closed" ? 409 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }
    logRouteCall({ route: "POST /api/moderation/decide", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ decision: result.decision });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
