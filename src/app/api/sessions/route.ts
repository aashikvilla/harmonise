import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { createSession, listSessions } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const sessions = await listSessions(user.id);
    logRouteCall({ route: "GET /api/sessions", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "sessions", 30)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  if (bodyTooLarge(request, 4_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  const title = typeof record.title === "string" && record.title.trim() ? record.title.trim().slice(0, 120) : "Untitled conversation";
  try {
    const session = await createSession(user.id, title);
    logRouteCall({ route: "POST /api/sessions", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
