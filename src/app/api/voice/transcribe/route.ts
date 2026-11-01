import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/meta-model";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (isRateLimited(request, "voice", 8)) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_AUDIO_BYTES + 32_000) {
    return NextResponse.json({ error: "audio-too-large" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid-audio" }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "invalid-audio" }, { status: audio instanceof File && audio.size > MAX_AUDIO_BYTES ? 413 : 400 });
  }
  if (audio.type && audio.type !== "audio/wav" && audio.type !== "audio/wave" && audio.type !== "application/octet-stream") {
    return NextResponse.json({ error: "wav-required" }, { status: 400 });
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
    const response = await fetch("https://api.meta.ai/v1/asr/transcribe", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      body: upstreamBody,
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) {
      return NextResponse.json({ error: "transcription-unavailable" }, { status: response.status === 429 ? 503 : 502 });
    }
    const data = (await response.json()) as { transcript?: unknown };
    if (typeof data.transcript !== "string") return NextResponse.json({ error: "transcription-unavailable" }, { status: 502 });
    return NextResponse.json({ transcript: data.transcript.slice(0, 4000) });
  } catch {
    return NextResponse.json({ error: "transcription-unavailable" }, { status: 503 });
  }
}
