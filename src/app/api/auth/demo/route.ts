import { NextResponse } from "next/server";
import { logRouteCall, newRequestId } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";
import { isDatabaseConfigured } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { setAuthCookies, supabaseAuth } from "@/lib/auth-server";

export const runtime = "nodejs";

type PasswordSession = {
  access_token?: unknown;
  refresh_token?: unknown;
  user?: { id?: unknown };
};

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  const finish = (status: number, outcome: "unavailable" | "rate-limited" | "error", message: string) => {
    logRouteCall({ route: "/api/auth/demo", status, latencyMs: Date.now() - started, requestId, outcome });
    return NextResponse.json({ error: message }, { status });
  };
  if (!isDatabaseConfigured()) return finish(503, "unavailable", "unavailable");
  if (await checkRateLimit(request, "auth-demo", 5)) return finish(429, "rate-limited", "try-again");

  const email = process.env.DEMO_ACCOUNT_EMAIL?.trim().toLowerCase();
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!email || !password) return finish(503, "unavailable", "unavailable");

  let session: PasswordSession | null = null;
  try {
    // Provision on first use. If the account already exists (or two first uses race), sign in.
    try {
      const created = await supabaseAuth<PasswordSession>("/signup", { body: { email, password } });
      if (typeof created.access_token === "string" && typeof created.refresh_token === "string") session = created;
    } catch {
      // Existing demo account: the password sign-in below is the only fallback.
    }
    if (!session) {
      session = await supabaseAuth<PasswordSession>("/token?grant_type=password", { body: { email, password } });
    }
    if (typeof session.access_token !== "string" || typeof session.refresh_token !== "string" || typeof session.user?.id !== "string") {
      return finish(503, "unavailable", "demo-unavailable");
    }
    await ensureProfile(session.user.id);
    const response = NextResponse.json({ ok: true });
    logRouteCall({ route: "/api/auth/demo", status: 200, latencyMs: Date.now() - started, requestId, outcome: "ok" });
    return setAuthCookies(response, session.access_token, session.refresh_token);
  } catch {
    return finish(503, "unavailable", "demo-unavailable");
  }
}
