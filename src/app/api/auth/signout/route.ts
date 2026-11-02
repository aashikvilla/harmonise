import { NextResponse } from "next/server";
import { accessTokenFrom, isDatabaseConfigured } from "@/lib/db/supabase";
import { clearAuthCookies, supabaseAuth } from "@/lib/auth-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = accessTokenFrom(request);
  if (token && isDatabaseConfigured()) {
    try {
      await supabaseAuth("/logout", { token });
    } catch {
      /* local sign-out still proceeds */
    }
  }
  return clearAuthCookies(NextResponse.json({ ok: true }));
}
