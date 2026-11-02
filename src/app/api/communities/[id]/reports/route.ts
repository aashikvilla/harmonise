import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { createReport, validCommunityId } from "@/lib/db/community";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!validCommunityId(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (await checkRateLimit(request, "community-report", 10)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (bodyTooLarge(request, 4_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.reason !== "string" || !record.reason.trim()) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const result = await createReport(
      user.id,
      id,
      { postId: typeof record.postId === "string" ? record.postId : undefined, replyId: typeof record.replyId === "string" ? record.replyId : undefined },
      record.reason,
    );
    if ("error" in result) {
      const status =
        result.error === "invalid-target" ? 400
        : result.error === "community-busy" ? 429
        : result.error === "blocked" ? 403
        : result.error === "not-found" ? 404
        : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    logRouteCall({ route: "POST /api/communities/[id]/reports", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ report: { id: result.report.id, status: result.report.status } });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
