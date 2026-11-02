import { NextResponse } from "next/server";
import { isDatabaseConfigured, supabaseRest } from "@/lib/db/supabase";
import { isModelConfigured } from "@/lib/meta-model";

export const runtime = "nodejs";

/** Readiness probe: servable with or without a database, but reports DB reachability. */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ready: true, database: { configured: false, reachable: false }, model: { configured: isModelConfigured() } });
  }
  try {
    await supabaseRest("communities", { query: "?select=id&limit=1" });
    return NextResponse.json({ ready: true, database: { configured: true, reachable: true }, model: { configured: isModelConfigured() } });
  } catch {
    return NextResponse.json({ ready: true, database: { configured: true, reachable: false }, model: { configured: isModelConfigured() } }, { status: 200 });
  }
}
