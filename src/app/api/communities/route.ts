import { NextResponse } from "next/server";
import { dbFailureStatus, isDatabaseConfigured } from "@/lib/db/supabase";
import { listCommunities } from "@/lib/db/community";

export const runtime = "nodejs";

/** Public directory: existence and real counts only, never post contents. */
export async function GET() {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    const communities = await listCommunities();
    return NextResponse.json({ communities });
  } catch (error) {
    return NextResponse.json({ error: "unavailable" }, { status: dbFailureStatus(error) });
  }
}
