import { NextResponse } from "next/server";
import { logRouteCall, newRequestId, parseJsonBody } from "@/lib/api-guard";
import { checkUserRateLimit } from "@/lib/meta-model";
import { dbFailureStatus, getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { deleteAccount } from "@/lib/db/sessions";
import { clearAuthCookies } from "@/lib/auth-server";

export const runtime = "nodejs";

/** Hard-deletes the account's Harmonise data. Requires typed confirmation. */
export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "account-delete", 3)) return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  const parsed = await parseJsonBody(request);
  const record = (parsed.ok && typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (record.confirm !== "delete my data") {
    return NextResponse.json({ error: "confirmation-required" }, { status: 400 });
  }
  try {
    const deleted = await deleteAccount(user.id);
    logRouteCall({ route: "POST /api/account/delete", status: deleted ? 200 : 502, latencyMs: Date.now() - started, requestId, outcome: deleted ? "ok" : "error" });
    if (!deleted) return NextResponse.json({ error: "unavailable" }, { status: 502 });
    return clearAuthCookies(NextResponse.json({ ok: true }));
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
