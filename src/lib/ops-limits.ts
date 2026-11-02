import { getAuthUser } from "@/lib/db/supabase";

/** Global kill switch: when set, model-backed routes fail closed without calling Meta. */
export function isKillSwitchOn() {
  return process.env.HARMONISE_KILL_SWITCH === "1";
}

function dailyQuota() {
  const configured = Number(process.env.DAILY_MODEL_CALLS_PER_USER ?? "100");
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : 100;
}

/**
 * Per-user daily quota for model-backed routes (single-instance memory).
 * Anonymous callers stay governed by IP rate limits; signed-in callers get an
 * additional per-account budget. A shared backend should replace this before
 * multi-instance production use.
 */
const quotaBuckets = new Map<string, { day: string; count: number }>();

export function checkUserQuota(userId: string, route: string) {
  const day = new Date().toISOString().slice(0, 10);
  const key = `${route}:${userId}`;
  const bucket = quotaBuckets.get(key);
  if (!bucket || bucket.day !== day) {
    quotaBuckets.set(key, { day, count: 1 });
    if (quotaBuckets.size > 20000) quotaBuckets.clear();
    return false;
  }
  bucket.count += 1;
  return bucket.count > dailyQuota();
}

/** Resolve the caller's user id only when a token is present; otherwise null. */
export async function userIdForQuota(request: Request): Promise<string | null> {
  const hasToken = Boolean(request.headers.get("authorization") || request.headers.get("cookie")?.includes("sb-access="));
  if (!hasToken) return null;
  try {
    return (await getAuthUser(request))?.id ?? null;
  } catch {
    return null;
  }
}
