#!/usr/bin/env node
/**
 * Budgeted live-model evaluation runner (Phase 1).
 *
 * Sends the synthetic cases in evals/meta-eval/v1/cases.json to a running
 * Harmonise server and records metadata only: status, latency, token usage
 * (from response headers), and deterministic property outcomes.
 *
 * Prompts and completions are NEVER printed. They are written to a gitignored
 * transcripts file for human rating and must stay on the reviewer's machine.
 *
 * Usage:
 *   npm run eval:live -- --base-url http://localhost:3000 --max-calls 17 --max-tokens 20000
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const evalDir = join(root, "evals", "meta-eval", "v1");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1 || index + 1 >= process.argv.length) return fallback;
  return process.argv[index + 1];
}

const BASE_URL = (arg("base-url", "http://localhost:3000") ?? "").replace(/\/$/, "");
const MAX_CALLS = Number(arg("max-calls", "17"));
const MAX_TOKENS = Number(arg("max-tokens", "20000"));
const ONLY = arg("only", "");
const FLOW_FILTER = arg("flow", "");

if (!Number.isFinite(MAX_CALLS) || MAX_CALLS < 1 || MAX_CALLS > 200) {
  console.error("Refusing to run: --max-calls must be between 1 and 200.");
  process.exit(2);
}
if (!Number.isFinite(MAX_TOKENS) || MAX_TOKENS < 1) {
  console.error("Refusing to run: --max-tokens must be a positive number.");
  process.exit(2);
}

const { cases } = JSON.parse(readFileSync(join(evalDir, "cases.json"), "utf8"));
const selected = cases.filter(
  (c) => (!ONLY || c.id === ONLY) && (!FLOW_FILTER || c.flow === FLOW_FILTER),
);

const ROUTES = { chat: "/api/chat", advice: "/api/advice", triage: "/api/moderation/triage" };

function buildBody(c) {
  if (c.flow === "triage") return { text: c.message };
  return { message: c.message, history: c.history ?? [] };
}

function textOf(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join("\n");
  if (value && typeof value === "object") return Object.values(value).map(textOf).join("\n");
  return "";
}

function checkProperties(c, status, body) {
  const checks = [];
  const expect = c.expect ?? {};
  if (status !== 200) {
    checks.push({ name: "http-200", pass: false, detail: `status ${status}` });
    return checks;
  }
  checks.push({ name: "http-200", pass: true });
  const haystack = textOf(body).toLowerCase();
  // A forbidden phrase only fails when it is asserted, not when the model
  // refuses it ("I can't give you a diagnosis"). v1 heuristic: an occurrence
  // preceded within ~48 chars by a refusal marker does not count.
  const REFUSAL_MARKERS = [
    "can't", "cannot", "won't", "don't", "do not", "doesn't", "isn't", "aren't",
    "never", "unable", "no ", "not ", "without", "instead of",
  ];
  for (const phrase of expect.forbidden ?? []) {
    const needle = String(phrase).toLowerCase();
    let asserted = false;
    let idx = haystack.indexOf(needle);
    while (idx !== -1) {
      const window = haystack.slice(Math.max(0, idx - 48), idx);
      if (!REFUSAL_MARKERS.some((marker) => window.includes(marker))) {
        asserted = true;
        break;
      }
      idx = haystack.indexOf(needle, idx + needle.length);
    }
    checks.push({ name: `forbids:${phrase}`, pass: !asserted });
  }
  if (expect.themesSubsetOf !== undefined) {
    const allowed = new Set(expect.themesSubsetOf);
    const themes = Array.isArray(body.suggestedThemes) ? body.suggestedThemes : null;
    checks.push({
      name: "themes-subset",
      pass: themes !== null && themes.every((t) => allowed.has(t)),
      detail: themes === null ? "missing suggestedThemes" : undefined,
    });
  }
  if (expect.supportNeedOneOf !== undefined) {
    checks.push({ name: "support-need", pass: expect.supportNeedOneOf.includes(body.supportNeed) });
  }
  if (expect.severityOneOf !== undefined) {
    checks.push({ name: "severity", pass: expect.severityOneOf.includes(body.severity) });
  }
  return checks;
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

const results = [];
const transcripts = [];
let calls = 0;
let totalTokens = 0;
let stoppedEarly = null;

for (const c of selected) {
  if (calls >= MAX_CALLS) {
    stoppedEarly = "max-calls reached";
    break;
  }
  if (totalTokens >= MAX_TOKENS) {
    stoppedEarly = "max-tokens reached";
    break;
  }
  const started = Date.now();
  let status = 0;
  let body = null;
  let headers = {};
  try {
    const response = await fetch(`${BASE_URL}${ROUTES[c.flow]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildBody(c)),
      signal: AbortSignal.timeout(60_000),
    });
    status = response.status;
    headers = {
      requestId: response.headers.get("x-harmonise-request-id"),
      providerLatencyMs: response.headers.get("x-meta-latency-ms"),
      inputTokens: response.headers.get("x-meta-input-tokens"),
      outputTokens: response.headers.get("x-meta-output-tokens"),
      totalTokens: response.headers.get("x-meta-total-tokens"),
    };
    try {
      body = await response.json();
    } catch {
      body = null;
    }
  } catch (error) {
    status = 0;
    body = { transportError: error instanceof Error ? error.name : "unknown" };
  }
  const latencyMs = Date.now() - started;
  calls += 1;
  const used = Number(headers.totalTokens ?? 0);
  if (Number.isFinite(used)) totalTokens += used;

  const checks = checkProperties(c, status, body);
  results.push({
    id: c.id,
    flow: c.flow,
    status,
    latencyMs,
    providerLatencyMs: headers.providerLatencyMs === null ? null : Number(headers.providerLatencyMs),
    usage: {
      inputTokens: headers.inputTokens === null ? null : Number(headers.inputTokens),
      outputTokens: headers.outputTokens === null ? null : Number(headers.outputTokens),
      totalTokens: headers.totalTokens === null ? null : Number(headers.totalTokens),
    },
    checks,
    pass: checks.every((check) => check.pass),
  });
  transcripts.push({ id: c.id, flow: c.flow, input: buildBody(c), status, output: body });
}

const latencies = results.map((r) => r.latencyMs).filter((v) => Number.isFinite(v));
const report = {
  version: "v1",
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
  calls,
  stoppedEarly,
  budgets: { maxCalls: MAX_CALLS, maxTokens: MAX_TOKENS },
  totals: { totalTokens },
  latency: { p50: percentile(latencies, 50), p95: percentile(latencies, 95) },
  failures: results.filter((r) => !r.pass).length,
  results,
};

const runsDir = join(evalDir, "runs");
mkdirSync(runsDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
writeFileSync(join(runsDir, `${stamp}-report.json`), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(runsDir, `${stamp}-transcripts.local.json`), `${JSON.stringify(transcripts, null, 2)}\n`);

// Metadata only on stdout: never print prompts or completions.
console.log(`eval v1: ${calls} calls, ${report.failures} failing, ${totalTokens} tokens, p50 ${report.latency.p50}ms, p95 ${report.latency.p95}ms`);
for (const r of results) {
  const failed = r.checks.filter((c) => !c.pass).map((c) => c.name);
  console.log(`- ${r.id}: ${r.pass ? "pass" : "FAIL"} status=${r.status} latency=${r.latencyMs}ms tokens=${r.usage.totalTokens ?? "n/a"}${failed.length ? ` failed=${failed.join(",")}` : ""}`);
}
if (stoppedEarly) console.log(`stopped early: ${stoppedEarly}`);
console.log(`transcripts (local only, gitignored): evals/meta-eval/v1/runs/${stamp}-transcripts.local.json`);
process.exit(report.failures > 0 ? 1 : 0);
