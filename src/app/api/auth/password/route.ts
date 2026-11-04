import { NextResponse } from "next/server";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { setAuthCookies, supabaseAuth, validEmail } from "@/lib/auth-server";

export const runtime = "nodejs";

type PasswordSession = {
  access_token?: unknown;
  refresh_token?: unknown;
  user?: { id?: unknown; email?: unknown };
};

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  const finish = (status: number, outcome: "unavailable" | "rate-limited" | "invalid" | "error", body: Record<string, string>) => {
    logRouteCall({ route: "/api/auth/password", status, latencyMs: Date.now() - started, requestId, outcome });
    return NextResponse.json(body, { status });
  };

  if (!isDatabaseConfigured()) return finish(503, "unavailable", { error: "unavailable" });
  if (await checkRateLimit(request, "auth-password", 10)) return finish(429, "rate-limited", { error: "try-again" });
  if (bodyTooLarge(request, 4_000)) return finish(413, "invalid", { error: "invalid" });
  const parsed = await parseJsonBody(request);
  const record = parsed.ok && typeof parsed.value === "object" && parsed.value !== null
    ? parsed.value as Record<string, unknown>
    : {};
  const email = validEmail(record.email);
  const password = typeof record.password === "string" ? record.password : "";
  const action = record.action;
  if (!email || password.length < 12 || password.length > 128 || !["sign-in", "sign-up"].includes(String(action))) {
    return finish(400, "invalid", { error: "invalid" });
  }
  if (action === "sign-up" && (record.adultConfirmed !== true || record.aiNoticeAccepted !== true)) {
    return finish(400, "invalid", { error: "disclosures-required" });
  }

  try {
    const result = action === "sign-up"
      ? await supabaseAuth<PasswordSession>("/signup", { body: { email, password } })
      : await supabaseAuth<PasswordSession>("/token?grant_type=password", { body: { email, password } });
    if (typeof result.access_token !== "string" || typeof result.refresh_token !== "string" || typeof result.user?.id !== "string") {
      return finish(409, "invalid", { error: "confirmation-required" });
    }
    await ensureProfile(result.user.id);
    const response = NextResponse.json({ ok: true, email: validEmail(result.user.email) ?? email });
    logRouteCall({ route: "/api/auth/password", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return setAuthCookies(response, result.access_token, result.refresh_token);
  } catch {
    return finish(401, "error", { error: "sign-in-failed" });
  }
}
