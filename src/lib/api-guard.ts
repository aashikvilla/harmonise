import { NextResponse } from "next/server";
import type { MetaUsage } from "@/lib/meta-model";
import { recordRouteMetric } from "@/lib/ops-metrics";

/** Shared server-only guards for Meta-backed routes. Never logs request bodies. */

export function newRequestId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `req-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
}

export function bodyTooLarge(request: Request, maxBytes: number) {
  return Number(request.headers.get("content-length") ?? "0") > maxBytes;
}

export async function parseJsonBody(request: Request): Promise<{ ok: true; value: unknown } | { ok: false }> {
  try {
    return { ok: true, value: (await request.json()) as unknown };
  } catch {
    return { ok: false };
  }
}

export type RouteLogFields = {
  route: string;
  status: number;
  latencyMs: number;
  requestId: string;
  outcome: "ok" | "invalid" | "rate-limited" | "crisis-screened" | "unavailable" | "error";
  providerLatencyMs?: number;
  usage?: MetaUsage;
  model?: string;
  errorKind?: string;
};

/** Single-line server log: route, status, latency, request id, usage counts only. */
export function logRouteCall(fields: RouteLogFields) {
  const line: Record<string, unknown> = {
    route: fields.route,
    status: fields.status,
    latencyMs: fields.latencyMs,
    requestId: fields.requestId,
    outcome: fields.outcome,
  };
  if (fields.providerLatencyMs !== undefined) line.providerLatencyMs = fields.providerLatencyMs;
  if (fields.errorKind) line.errorKind = fields.errorKind;
  if (fields.model) line.model = fields.model;
  if (fields.usage) {
    if (fields.usage.inputTokens !== undefined) line.inputTokens = fields.usage.inputTokens;
    if (fields.usage.outputTokens !== undefined) line.outputTokens = fields.usage.outputTokens;
    if (fields.usage.totalTokens !== undefined) line.totalTokens = fields.usage.totalTokens;
  }
  console.log(JSON.stringify(line));
  recordRouteMetric({
    route: fields.route,
    status: fields.status,
    latencyMs: fields.latencyMs,
    providerLatencyMs: fields.providerLatencyMs,
    inputTokens: fields.usage?.inputTokens,
    outputTokens: fields.usage?.outputTokens,
  });
}

export type MetaHeaders = {
  requestId: string;
  providerLatencyMs?: number;
  usage?: MetaUsage;
  model?: string;
  errorKind?: string;
};

/** Attach safe observability metadata (no prompts, completions, keys, or audio). */
export function withMetaHeaders<T>(response: NextResponse<T>, meta: MetaHeaders) {
  response.headers.set("x-harmonise-request-id", meta.requestId);
  if (meta.providerLatencyMs !== undefined) {
    response.headers.set("x-meta-latency-ms", String(meta.providerLatencyMs));
  }
  if (meta.usage?.inputTokens !== undefined) response.headers.set("x-meta-input-tokens", String(meta.usage.inputTokens));
  if (meta.usage?.outputTokens !== undefined) response.headers.set("x-meta-output-tokens", String(meta.usage.outputTokens));
  if (meta.usage?.totalTokens !== undefined) response.headers.set("x-meta-total-tokens", String(meta.usage.totalTokens));
  if (meta.model !== undefined) response.headers.set("x-meta-model", meta.model);
  if (meta.errorKind !== undefined) response.headers.set("x-meta-error-kind", meta.errorKind);
  return response;
}
