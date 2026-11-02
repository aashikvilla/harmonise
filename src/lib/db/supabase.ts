/** Server-only Supabase access over plain fetch (no new dependencies). */

export function supabaseUrl() {
  return process.env.SUPABASE_URL?.trim().replace(/\/$/, "") || "";
}

export function isDatabaseConfigured() {
  return Boolean(supabaseUrl() && process.env.SUPABASE_ANON_KEY?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

type RestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: string;
  prefer?: string;
};

export class SupabaseError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super("Supabase request failed");
  }
}

function serviceHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function supabaseRest<T>(table: string, options: RestOptions = {}): Promise<T> {
  const base = supabaseUrl();
  if (!base || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new SupabaseError(503, "not-configured");
  const response = await fetch(`${base}/rest/v1/${table}${options.query ?? ""}`, {
    method: options.method ?? "GET",
    headers: { ...serviceHeaders(), ...(options.prefer ? { Prefer: options.prefer } : {}) },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    let code = "upstream-error";
    try {
      const payload = (await response.json()) as { code?: unknown };
      if (typeof payload.code === "string") code = payload.code;
    } catch {
      /* ignore unreadable error bodies */
    }
    throw new SupabaseError(response.status >= 500 ? 502 : response.status, code);
  }
  if (response.status === 204) return [] as unknown as T;
  return (await response.json()) as T;
}

export function selectSingle<T>(rows: T[]): T | null {
  return rows.length > 0 ? rows[0] : null;
}

export function accessTokenFrom(request: Request) {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("sb-access="));
  return match ? decodeURIComponent(match.slice("sb-access=".length)) : "";
}

export type AuthUser = { id: string; email?: string };

/** Validate a user JWT against Supabase Auth. Never trusts client-supplied ids. */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = accessTokenFrom(request);
  const base = supabaseUrl();
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (!token || !base || !anon) return null;
  try {
    const response = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return null;
    const user = (await response.json()) as { id?: unknown; email?: unknown };
    if (typeof user.id !== "string" || !user.id) return null;
    return { id: user.id, email: typeof user.email === "string" ? user.email : undefined };
  } catch {
    return null;
  }
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function dbFailureStatus(error: unknown) {
  if (error instanceof SupabaseError) {
    if (error.code === "not-configured") return 503;
    if (error.status === 404) return 404;
    if (error.status >= 400 && error.status < 500) return 400;
    return 502;
  }
  return 503;
}
