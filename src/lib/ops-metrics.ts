/** In-memory operational counters. Metadata only — never prompts, completions, keys, or user ids. */

type Bucket = {
  count: number;
  errors: number;
  rateLimited: number;
  latencySum: number;
  latencyMax: number;
  providerLatencySum: number;
  providerCalls: number;
  inputTokens: number;
  outputTokens: number;
};

const buckets = new Map<string, Bucket>();
const startedAt = new Date().toISOString();
let killSwitchDrops = 0;
let quotaDrops = 0;

function bucket(route: string) {
  let current = buckets.get(route);
  if (!current) {
    current = {
      count: 0,
      errors: 0,
      rateLimited: 0,
      latencySum: 0,
      latencyMax: 0,
      providerLatencySum: 0,
      providerCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
    };
    buckets.set(route, current);
  }
  return current;
}

export function recordRouteMetric(input: {
  route: string;
  status: number;
  latencyMs: number;
  providerLatencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
}) {
  const current = bucket(input.route);
  current.count += 1;
  if (input.status >= 500) current.errors += 1;
  if (input.status === 429) current.rateLimited += 1;
  current.latencySum += input.latencyMs;
  current.latencyMax = Math.max(current.latencyMax, input.latencyMs);
  if (input.providerLatencyMs !== undefined) {
    current.providerLatencySum += input.providerLatencyMs;
    current.providerCalls += 1;
  }
  current.inputTokens += input.inputTokens ?? 0;
  current.outputTokens += input.outputTokens ?? 0;
}

export function recordKillSwitchDrop() {
  killSwitchDrops += 1;
}

export function recordQuotaDrop() {
  quotaDrops += 1;
}

export type RouteMetrics = {
  route: string;
  count: number;
  errors: number;
  rateLimited: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  avgProviderLatencyMs: number | null;
  inputTokens: number;
  outputTokens: number;
};

export function getRouteMetrics(): RouteMetrics[] {
  return [...buckets.entries()].map(([route, current]) => ({
    route,
    count: current.count,
    errors: current.errors,
    rateLimited: current.rateLimited,
    avgLatencyMs: current.count > 0 ? Math.round(current.latencySum / current.count) : 0,
    maxLatencyMs: current.latencyMax,
    avgProviderLatencyMs: current.providerCalls > 0 ? Math.round(current.providerLatencySum / current.providerCalls) : null,
    inputTokens: current.inputTokens,
    outputTokens: current.outputTokens,
  }));
}

export function getOpsSummary() {
  const routes = getRouteMetrics();
  const totals = routes.reduce(
    (sum, route) => ({
      requests: sum.requests + route.count,
      errors: sum.errors + route.errors,
      inputTokens: sum.inputTokens + route.inputTokens,
      outputTokens: sum.outputTokens + route.outputTokens,
    }),
    { requests: 0, errors: 0, inputTokens: 0, outputTokens: 0 },
  );
  return { startedAt, now: new Date().toISOString(), killSwitchDrops, quotaDrops, totals, routes };
}
