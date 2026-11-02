import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { decideAppeal } from "@/lib/db/moderation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (record.outcome !== "upheld" && record.outcome !== "overturned") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await decideAppeal(user.id, id, record.outcome);
    if ("error" in result) {
      const status = result.error === "forbidden" || result.error === "same-reviewer" ? 403 : result.error === "closed" ? 409 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }
    logRouteCall({ route: "POST /api/moderation/appeals/[id]/decide", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ appeal: result.appeal });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
