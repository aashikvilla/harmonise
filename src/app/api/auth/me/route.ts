import { NextResponse } from "next/server";
import { getAuthUser, isDatabaseConfigured } from "@/lib/db/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  return NextResponse.json({ id: user.id });
}
