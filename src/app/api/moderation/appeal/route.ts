import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { fileAppeal } from "@/lib/db/moderation";

export const runtime = "nodejs";

/** Content authors appeal a decision for a second human look. */
export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "moderation-appeal", 10)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 4_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.decisionId !== "string" || typeof record.reason !== "string" || !record.reason.trim()) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await fileAppeal(user.id, record.decisionId, record.reason);
    if ("error" in result) {
      const status = result.error === "forbidden" ? 403 : result.error === "already-open" ? 409 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json({ appeal: result.appeal });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
