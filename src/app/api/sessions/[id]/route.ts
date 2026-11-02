import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { deleteSession, getSessionFull, renameSession } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const full = await getSessionFull(user.id, id);
    if (!full) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json(full);
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (bodyTooLarge(request, 4_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim()) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const session = await renameSession(user.id, id, record.title.trim());
    if (!session) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  const started = Date.now();
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const deleted = await deleteSession(user.id, id);
    logRouteCall({ route: "DELETE /api/sessions/[id]", status: deleted ? 200 : 404, latencyMs: Date.now() - started, requestId, outcome: deleted ? "ok" : "error" });
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "not-found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
