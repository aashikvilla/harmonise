import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { supabaseAuth, validEmail } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) {
    logRouteCall({ route: "/api/auth/otp", status: 503, latencyMs: Date.now() - started, requestId, outcome: "unavailable", errorKind: "not-configured" });
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (await checkRateLimit(request, "auth-otp", 5)) {
    logRouteCall({ route: "/api/auth/otp", status: 429, latencyMs: Date.now() - started, requestId, outcome: "rate-limited" });
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const email = parsed.ok ? validEmail((parsed.value as Record<string, unknown>).email) : null;
  if (!email) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    await supabaseAuth("/otp", { body: { email, create_user: true } });
  } catch {
    logRouteCall({ route: "/api/auth/otp", status: 503, latencyMs: Date.now() - started, requestId, outcome: "unavailable", errorKind: "provider-error" });
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  logRouteCall({ route: "/api/auth/otp", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
  return NextResponse.json({ ok: true });
}
