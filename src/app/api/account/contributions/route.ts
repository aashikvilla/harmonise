import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getMyContributions } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

/** The signed-in member's own contributions across communities (private). */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "contributions", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const contributions = await getMyContributions(user.id);
    return NextResponse.json({ contributions });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
