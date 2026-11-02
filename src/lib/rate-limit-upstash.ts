import { configureRateLimitStore, type RateLimitStore } from "@/lib/meta-model";

/**
 * Optional shared rate-limit backend over Upstash Redis REST (no new dependencies).
 * Active only when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set;
 * otherwise the process-memory limiter stays in place (single instance only).
 */
function createUpstashRateLimitStore(url: string, token: string): RateLimitStore {
  return {
    async checkAndRecord(key, maxRequests, windowMs) {
      const now = Date.now();
      const redisKey = `harmonise:ratelimit:${key}`;
      try {
        const response = await fetch(`${url}/pipeline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify([
            ["ZREMRANGEBYSCORE", redisKey, 0, now - windowMs],
            ["ZCARD", redisKey],
          ]),
          signal: AbortSignal.timeout(2_000),
        });
        if (!response.ok) return false;
        const results = (await response.json()) as Array<{ result?: unknown }>;
        const count = Number(results?.[1]?.result ?? 0);
        if (Number.isFinite(count) && count >= maxRequests) return true;
        await fetch(`${url}/pipeline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify([
            ["ZADD", redisKey, now, `${now}-${Math.floor(Math.random() * 1e9)}`],
            ["PEXPIRE", redisKey, windowMs],
          ]),
          signal: AbortSignal.timeout(2_000),
        }).catch(() => undefined);
        return false;
      } catch {
        // Fail open on limiter outages; the provider still enforces its own quotas.
        return false;
      }
    },
  };
}

let initialized = false;

/** Call once at server startup; safe to call repeatedly. */
export function initSharedRateLimiting() {
  if (initialized) return;
  initialized = true;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    configureRateLimitStore(createUpstashRateLimitStore(url, token));
  }
}
