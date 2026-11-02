import { NextResponse } from "next/server";
import { supabaseUrl } from "@/lib/db/supabase";

/** Server-only Supabase Auth (GoTrue) calls plus session-cookie helpers. */

export const ACCESS_COOKIE = "sb-access";
export const REFRESH_COOKIE = "sb-refresh";
const ACCESS_MAX_AGE = 60 * 60;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export async function supabaseAuth<T>(path: string, init: { method?: string; body?: unknown; token?: string }): Promise<T> {
  const base = supabaseUrl();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!base || !anon) throw new Error("auth not configured");
  const response = await fetch(`${base}/auth/v1${path}`, {
    method: init.method ?? "POST",
    headers: {
      apikey: anon,
      "Content-Type": "application/json",
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    const error = new Error("auth upstream error") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ACCESS_COOKIE, accessToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: ACCESS_MAX_AGE });
  response.cookies.set(REFRESH_COOKIE, refreshToken, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: REFRESH_MAX_AGE });
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return response;
}

export function refreshTokenFrom(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(REFRESH_COOKIE.length + 1)) : "";
}

export function validEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
