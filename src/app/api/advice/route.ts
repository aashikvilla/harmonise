import { NextResponse } from "next/server";
import { detectCrisis, leaksCommunityReference } from "@/lib/connect/catalog";
import { listCommunities } from "@/lib/db/community";
import {
  MAX_HISTORY_TURNS,
  MAX_MESSAGE_LENGTH,
  cleanHistory,
  type AdviceResult,
} from "@/lib/connect/advice";
import { bodyTooLarge, logRouteCall, newRequestId, parseJsonBody, withMetaHeaders } from "@/lib/api-guard";
import { checkRateLimit, modelErrorKind, modelFailureStatus, requestValidatedWithFallback } from "@/lib/meta-model";
import { checkUserQuota, isKillSwitchOn, userIdForQuota } from "@/lib/ops-limits";
import { recordKillSwitchDrop, recordQuotaDrop } from "@/lib/ops-metrics";

export const runtime = "nodejs";

const MAX_REFLECTION = 600;
const MAX_STEP = 350;
const MAX_PERSPECTIVE = 450;
const MAX_REASON = 300;
const MAX_MATCHES = 2;

type Matchable = { id: string; line: string };

async function loadMatchable(): Promise<Matchable[]> {
  try {
    const rows = await listCommunities(undefined);
    return rows.slice(0, 8).map((c) => ({
      id: c.id,
      line: `${c.id}: ${c.name} — ${(c.topics ?? []).join(", ") || c.description}`.slice(0, 300),
    }));
  } catch {
    return [];
  }
}

function validAdvice(value: unknown, allowed: Set<string>): AdviceResult | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.reflection !== "string" || record.reflection.trim().length === 0) return null;
  if (typeof record.perspective !== "string" || record.perspective.trim().length === 0) return null;
  if (!Array.isArray(record.steps) || record.steps.length < 2 || record.steps.length > 4) return null;
  if (!Array.isArray(record.matches)) return null;
  const reflection = record.reflection.trim().slice(0, MAX_REFLECTION);
  const perspective = record.perspective.trim().slice(0, MAX_PERSPECTIVE);
  const steps: string[] = [];
  for (const step of record.steps) {
    if (typeof step !== "string" || step.trim().length === 0) return null;
    steps.push(step.trim().slice(0, MAX_STEP));
  }
  const seen = new Set<string>();
  const matches: AdviceResult["matches"] = [];
  for (const item of record.matches) {
    if (matches.length >= MAX_MATCHES) break;
    if (typeof item !== "object" || item === null) return null;
    const entry = item as Record<string, unknown>;
    if (typeof entry.id !== "string" || typeof entry.reason !== "string") return null;
    if (!allowed.has(entry.id)) continue;
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    matches.push({ id: entry.id, reason: entry.reason.trim().slice(0, MAX_REASON) });
  }
  for (const text of [reflection, perspective, ...steps]) {
    if (leaksCommunityReference(text)) return null;
  }
  return { reflection, steps, perspective, matches };
}

const SYSTEM_PROMPT = [
  "You are Harmonise Adviser, a calm peer-support guide. Listen, reflect, and offer practical next steps.",
  "You are not a therapist, doctor, lawyer, or emergency service. Never diagnose, give legal verdicts, or predict outcomes.",
  "In reflection, steps, and perspective, do not mention communities, matching, groups, circles, or other people the user could meet.",
  "Never promise outcomes or claim certainty. Prefer questions and small user-chosen actions.",
  "Choose 0 to 2 matches only when the user's words clearly fit; prefer no match over a weak match.",
  "Suggest only circles from the available list appended at the end; never invent a circle id. If no circles are listed, return no matches.",
  "Keep reflection and perspective to 1-2 sentences, and each step to one sentence.",
].join(" ");

function responseFormat(ids: string[]) {
  return {
    type: "json_schema",
    json_schema: {
      name: "harmonise_advice",
      strict: true,
      schema: {
        type: "object",
        properties: {
          reflection: { type: "string" },
          steps: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
          perspective: { type: "string" },
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
              id: { type: "string", enum: ids.length > 0 ? ids : ["__none__"] },
                reason: { type: "string" },
              },
              required: ["id", "reason"],
              additionalProperties: false,
            },
            maxItems: MAX_MATCHES,
          },
        },
        required: ["reflection", "steps", "perspective", "matches"],
        additionalProperties: false,
      },
    },
  };
}

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  const finish = (
    body: unknown,
    status: number,
    outcome: "ok" | "invalid" | "rate-limited" | "crisis-screened" | "unavailable" | "error",
    meta?: { providerLatencyMs?: number; usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }; errorKind?: string; model?: string },
  ) => {
    logRouteCall({ route: "/api/advice", status, latencyMs: Date.now() - started, requestId, outcome, ...meta });
    return withMetaHeaders(NextResponse.json(body, { status }), { requestId, ...meta });
  };

  if (isKillSwitchOn()) {
    recordKillSwitchDrop();
    return finish({ error: "unavailable" }, 503, "unavailable", { errorKind: "kill-switch" });
  }
  const quotaUser = await userIdForQuota(request);
  if (quotaUser && checkUserQuota(quotaUser, "advice")) {
    recordQuotaDrop();
    return finish({ error: "rate-limited" }, 429, "rate-limited");
  }
  if (await checkRateLimit(request, "advice", 10)) {
    return finish({ error: "rate-limited" }, 429, "rate-limited");
  }
  if (bodyTooLarge(request, 16_000)) {
    return finish({ error: "invalid" }, 413, "invalid");
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) return finish({ error: "invalid" }, 400, "invalid");
  const record = (typeof parsed.value === "object" && parsed.value !== null ? parsed.value : {}) as Record<string, unknown>;
  if (typeof record.message !== "string") return finish({ error: "invalid" }, 400, "invalid");
  const message = record.message.trim();
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return finish({ error: "invalid" }, 400, "invalid");
  }

  if (detectCrisis(message)) return finish({ crisis: true }, 200, "crisis-screened");

  const history = cleanHistory(record.history).slice(-MAX_HISTORY_TURNS);
  try {
    const matchable = await loadMatchable();
    const allowed = new Set(matchable.map((m) => m.id));
    const matchBlock = matchable.length > 0
      ? ` Available circles (id: name — themes): ${matchable.map((m) => m.line).join(" | ")}`
      : " No circles are available right now.";
    const { value: advice, result } = await requestValidatedWithFallback(
      "advice",
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT + matchBlock },
          ...history.map((turn) => ({ role: turn.role === "user" ? "user" as const : "assistant" as const, content: turn.text })),
          { role: "user", content: message },
        ],
        maxTokens: 700,
        temperature: 0.7,
        responseFormat: responseFormat([...allowed]),
      },
      (text) => validAdvice(JSON.parse(text) as unknown, allowed),
    );
    return finish(advice, 200, "ok", { providerLatencyMs: result.latencyMs, usage: result.usage, model: result.model });
  } catch (error) {
    return finish({ error: "unavailable" }, modelFailureStatus(error), "unavailable", { errorKind: modelErrorKind(error) });
  }
}
