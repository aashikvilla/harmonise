import { NextResponse } from "next/server";
import { logRouteCall, newRequestId, withMetaHeaders } from "@/lib/api-guard";
import { checkRateLimit } from "@/lib/meta-model";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const requestId = newRequestId();
  const started = Date.now();
  const finish = (
    body: unknown,
    status: number,
    outcome: "ok" | "invalid" | "rate-limited" | "crisis-screened" | "unavailable" | "error",
    meta?: { providerLatencyMs?: number; errorKind?: string },
  ) => {
    logRouteCall({ route: "/api/voice/transcribe", status, latencyMs: Date.now() - started, requestId, outcome, ...meta });
    return withMetaHeaders(NextResponse.json(body, { status }), { requestId, ...meta });
  };

  if (await checkRateLimit(request, "voice", 8)) {
    return finish({ error: "rate-limited" }, 429, "rate-limited");
  }
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) return finish({ error: "unavailable" }, 503, "unavailable", { errorKind: "missing-key" });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_AUDIO_BYTES + 32_000) {
    return finish({ error: "audio-too-large" }, 413, "invalid");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return finish({ error: "invalid-audio" }, 400, "invalid");
  }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return finish({ error: "invalid-audio" }, audio instanceof File && audio.size > MAX_AUDIO_BYTES ? 413 : 400, "invalid");
  }
  if (audio.type && audio.type !== "audio/wav" && audio.type !== "audio/wave" && audio.type !== "application/octet-stream") {
    return finish({ error: "wav-required" }, 400, "invalid");
  }

  const upstreamBody = new FormData();
  upstreamBody.append(
    "request",
    new Blob([JSON.stringify({ model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", mode: "PUSH_TO_TALK" })], {
      type: "application/json",
    }),
    "request.json",
  );
  upstreamBody.append("audio", audio, "recording.wav");

  try {
    const providerStarted = Date.now();
    const response = await fetch("https://api.meta.ai/v1/asr/transcribe", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: upstreamBody,
      signal: AbortSignal.timeout(45_000),
    });
    const providerLatencyMs = Date.now() - providerStarted;
    if (!response.ok) {
      return finish(
        { error: "transcription-unavailable" },
        response.status === 429 ? 503 : 502,
        "unavailable",
        { providerLatencyMs, errorKind: response.status === 429 ? "rate-limited" : "provider-error" },
      );
    }
    const data = (await response.json()) as { transcript?: unknown };
    if (typeof data.transcript !== "string") {
      return finish({ error: "transcription-unavailable" }, 502, "unavailable", { providerLatencyMs, errorKind: "bad-response" });
    }
    return finish({ transcript: data.transcript.slice(0, 4000) }, 200, "ok", { providerLatencyMs });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return finish({ error: "transcription-unavailable" }, 503, "unavailable", { errorKind: timedOut ? "timeout" : "network-error" });
  }
}
