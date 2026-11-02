import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { clearAuthCookies, refreshTokenFrom, setAuthCookies, supabaseAuth } from "@/lib/auth-server";

export const runtime = "nodejs";

type RefreshResponse = { access_token?: unknown; refresh_token?: unknown };

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (await checkRateLimit(request, "auth-refresh", 20)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const refreshToken = refreshTokenFrom(request);
  if (!refreshToken) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  try {
    const result = await supabaseAuth<RefreshResponse>("/token?grant_type=refresh_token", { body: { refresh_token: refreshToken } });
    if (typeof result.access_token !== "string" || typeof result.refresh_token !== "string") throw new Error("bad session");
    logRouteCall({ route: "/api/auth/refresh", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return setAuthCookies(NextResponse.json({ ok: true }), result.access_token, result.refresh_token);
  } catch {
    logRouteCall({ route: "/api/auth/refresh", status: 401, latencyMs: Date.now() - started, requestId, outcome: "error", errorKind: "bad-refresh" });
    return clearAuthCookies(NextResponse.json({ error: "signed-out" }, { status: 401 }));
  }
}
