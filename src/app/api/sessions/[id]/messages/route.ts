import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { appendMessage } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (await checkRateLimit(request, "session-messages", 60)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (bodyTooLarge(request, 12_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (record.role !== "user" && record.role !== "assistant") return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (typeof record.text !== "string" || !record.text.trim() || record.text.length > 4000) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const message = await appendMessage(user.id, id, record.role, record.text.trim());
    if (!message) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
