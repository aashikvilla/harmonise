import { NextResponse } from "next/server";
import { isKillSwitchOn } from "@/lib/ops-limits";

export const runtime = "nodejs";

/** Public liveness probe. Booleans only — no keys, counts, or user data. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    checks: {
      databaseConfigured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      modelConfigured: Boolean(process.env.MODEL_API_KEY),
      killSwitch: isKillSwitchOn(),
    },
  });
}
