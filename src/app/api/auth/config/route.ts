import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";

/** Public capability flags only. Never exposes keys or user state. */
export async function GET() {
  const enabled = isDatabaseConfigured();
  return NextResponse.json({ databaseEnabled: enabled, authEnabled: enabled });
}
