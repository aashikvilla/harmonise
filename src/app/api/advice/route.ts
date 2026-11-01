import { NextResponse } from "next/server";
import { COMMUNITY_IDS, detectCrisis, leaksCommunityReference } from "@/lib/connect/catalog";
import {
  MAX_HISTORY_TURNS,
  MAX_MESSAGE_LENGTH,
  cleanHistory,
  type AdviceResult,
} from "@/lib/connect/advice";
import { isRateLimited, modelFailureStatus, requestMetaChat } from "@/lib/meta-model";

export const runtime = "nodejs";

const MAX_REFLECTION = 600;
const MAX_STEP = 350;
const MAX_PERSPECTIVE = 450;
const MAX_REASON = 300;
const MAX_MATCHES = 2;

function unavailable(status = 503) {
  return NextResponse.json({ error: "unavailable" }, { status });
}

function validAdvice(value: unknown): AdviceResult | null {
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
    if (!COMMUNITY_IDS.includes(entry.id as (typeof COMMUNITY_IDS)[number])) return null;
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
  "rebuilding: separation, divorce, breakup, co-parenting, identity change, starting over.",
  "legal-clarity: preparing questions before speaking with a qualified legal professional. Do not give legal advice.",
  "steady-ground: uncertainty, grief, loneliness, family pressure, anxiety, disrupted routines.",
  "Keep reflection and perspective to 1-2 sentences, and each step to one sentence.",
].join(" ");

const RESPONSE_FORMAT = {
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
              id: { type: "string", enum: [...COMMUNITY_IDS] },
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

export async function POST(request: Request) {
  if (isRateLimited(request, "advice", 10)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  if (Number(request.headers.get("content-length") ?? "0") > 16_000) {
    return NextResponse.json({ error: "invalid" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const record = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  if (typeof record.message !== "string") return NextResponse.json({ error: "invalid" }, { status: 400 });
  const message = record.message.trim();
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (detectCrisis(message)) return NextResponse.json({ crisis: true });

  const history = cleanHistory(record.history).slice(-MAX_HISTORY_TURNS);
  try {
    const raw = await requestMetaChat({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...history.map((turn) => ({ role: turn.role === "user" ? "user" as const : "assistant" as const, content: turn.text })),
        { role: "user", content: message },
      ],
      maxTokens: 700,
      temperature: 0.7,
      responseFormat: RESPONSE_FORMAT,
    });
    const advice = validAdvice(JSON.parse(raw) as unknown);
    return advice ? NextResponse.json(advice) : unavailable(502);
  } catch (error) {
    return unavailable(modelFailureStatus(error));
  }
}
