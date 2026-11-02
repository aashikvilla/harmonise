import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { setAuthCookies, supabaseAuth, validEmail } from "@/lib/auth-server";

export const runtime = "nodejs";

type VerifyResponse = { access_token?: unknown; refresh_token?: unknown; user?: { id?: unknown } };

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) {
    logRouteCall({ route: "/api/auth/verify", status: 503, latencyMs: Date.now() - started, requestId, outcome: "unavailable", errorKind: "not-configured" });
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (await checkRateLimit(request, "auth-verify", 10)) {
    logRouteCall({ route: "/api/auth/verify", status: 429, latencyMs: Date.now() - started, requestId, outcome: "rate-limited" });
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  if (bodyTooLarge(request, 2_000)) return NextResponse.json({ error: "invalid" }, { status: 413 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  const email = validEmail(record.email);
  const code = typeof record.code === "string" ? record.code.trim() : "";
  if (!email || !/^[0-9]{6,8}$/.test(code)) {
    logRouteCall({ route: "/api/auth/verify", status: 400, latencyMs: Date.now() - started, requestId, outcome: "invalid" });
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  try {
    const result = await supabaseAuth<VerifyResponse>("/verify", { body: { email, token: code, type: "email" } });
    if (typeof result.access_token !== "string" || typeof result.refresh_token !== "string" || typeof result.user?.id !== "string") {
      throw new Error("bad session");
    }
    await ensureProfile(result.user.id);
    logRouteCall({ route: "/api/auth/verify", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return setAuthCookies(NextResponse.json({ ok: true }), result.access_token, result.refresh_token);
  } catch {
    logRouteCall({ route: "/api/auth/verify", status: 401, latencyMs: Date.now() - started, requestId, outcome: "error", errorKind: "bad-code" });
    return NextResponse.json({ error: "invalid-code" }, { status: 401 });
  }
}
