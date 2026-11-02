import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";
import { getAccountNotifications } from "@/lib/db/community";
import { checkUserRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

/** In-app notifications: replies to my posts, decisions on my reports, appeal outcomes. 7-day window. */
export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  if (await checkUserRateLimit(user.id, "notifications", 30)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  try {
    const notifications = await getAccountNotifications(user.id);
    return NextResponse.json({ notifications });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
