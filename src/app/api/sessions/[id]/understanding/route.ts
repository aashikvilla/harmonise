import { NextResponse } from "next/server";
import { bodyTooLarge, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured, isUuid } from "@/lib/db/supabase";
import { saveUnderstanding, validUnderstandingInput } from "@/lib/db/sessions";

export const runtime = "nodejs";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!isUuid(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (await checkRateLimit(request, "session-understanding", 60)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (bodyTooLarge(request, 8_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const input = parsed.ok && typeof parsed.value === "object" && parsed.value !== null
    ? validUnderstandingInput(parsed.value as Record<string, unknown>)
    : null;
  if (!input) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const understanding = await saveUnderstanding(user.id, id, input);
    if (!understanding) return NextResponse.json({ error: "not-found" }, { status: 404 });
    return NextResponse.json({ understanding });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
