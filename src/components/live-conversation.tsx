"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import ProductHeader from "@/components/product-header";
import AuthCard from "@/components/account/auth-card";
import SessionPanel, { type ResumePayload, type ResumeTurn } from "@/components/account/session-panel";
import type { SupportNeed, ThemeId } from "@/lib/connect/advice";

type Understanding = { suggested: ThemeId[]; confirmed: ThemeId[]; need: SupportNeed; summary: string };
type Turn = ResumeTurn & { id: string };
type ChatReply = { reply: string; suggestedThemes: ThemeId[]; supportNeed: SupportNeed; needSummary: string; model: string };
type AuthState = "checking" | "signed-in" | "signed-out" | "unavailable";

const THEME_LABELS: Record<ThemeId, string> = {
  "family-expectations": "Family expectations",
  "relationship-uncertainty": "Relationship uncertainty",
  "work-pressure": "Work pressure",
  relocation: "Relocation",
  belonging: "Belonging",
  "personal-autonomy": "Personal autonomy",
  communication: "Communication",
  hobbies: "Hobbies and shared activity",
};

function modelLabel(model: string): string {
  if (model.startsWith("muse-wonder")) return "Meta Muse Wonder";
  if (model.startsWith("muse-spark")) return "Meta Muse Spark";
  return `Meta ${model}`;
}

function wavFromBuffer(buffer: AudioBuffer, targetRate = 24_000): Blob {
  const channelCount = buffer.numberOfChannels;
  const frames = Math.ceil(buffer.length * targetRate / buffer.sampleRate);
  const pcm = new Int16Array(frames);
  const channels = Array.from({ length: channelCount }, (_, channel) => buffer.getChannelData(channel));
  for (let frame = 0; frame < frames; frame += 1) {
    const position = frame * buffer.sampleRate / targetRate;
    const left = Math.floor(position);
    const fraction = position - left;
    let mixed = 0;
    for (const channel of channels) {
      const a = channel[Math.min(left, channel.length - 1)] ?? 0;
      const b = channel[Math.min(left + 1, channel.length - 1)] ?? a;
      mixed += a + (b - a) * fraction;
    }
    const sample = Math.max(-1, Math.min(1, mixed / channelCount));
    pcm[frame] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, value: string) => { for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i)); };
  write(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true); write(8, "WAVE"); write(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true); view.setUint32(28, targetRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, pcm.byteLength, true);
  return new Blob([header, pcm], { type: "audio/wav" });
}

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; value: T | null }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { status: response.status, value: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, value: null };
  }
}

export default function LiveConversation() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [understanding, setUnderstanding] = useState<Understanding | null>(null);
  const [confirmed, setConfirmed] = useState<ThemeId[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const microphone = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const voiceTimer = useRef<number | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        setAuth(response.status === 200 ? "signed-in" : response.status === 401 ? "signed-out" : "unavailable");
      })
      .catch(() => { if (!cancelled) setAuth("unavailable"); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [turns]);

  useEffect(() => () => {
    if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
    microphone.current?.getTracks().forEach((track) => track.stop());
  }, []);

  async function persistTurn(id: string, role: "user" | "assistant", text: string) {
    const result = await postJson<{ message?: unknown }>(`/api/sessions/${id}/messages`, { role, text });
    return result.status === 200;
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setDraft("");
    setError("");
    setBusy(true);

    let activeId = sessionId;
    if (!activeId) {
      const created = await postJson<{ session?: { id?: unknown } }>("/api/sessions", { title: message.slice(0, 80) });
      const id = created.value?.session?.id;
      if (created.status !== 200 || typeof id !== "string") {
        setError("A saved conversation could not be opened. Nothing was sent to the adviser.");
        setBusy(false);
        return;
      }
      activeId = id;
      setSessionId(id);
    }

    const userTurn: Turn = { id: crypto.randomUUID(), role: "you", text: message };
    setTurns((current) => [...current, userTurn]);
    if (!(await persistTurn(activeId, "user", message))) {
      setError("Your message could not be saved, so it was not sent to the adviser.");
      setBusy(false);
      return;
    }

    const history = [...turns, userTurn].slice(-8).map((turn) => ({ role: turn.role === "you" ? "user" : "adviser", text: turn.text }));
    const result = await postJson<ChatReply & { crisis?: boolean; error?: string }>("/api/chat", { message, history });
    if (result.status === 200 && result.value?.crisis) {
      const crisisText = "This sounds urgent. Please use local emergency services or a verified crisis service now. Harmonise cannot provide emergency response.";
      setTurns((current) => [...current, { id: crypto.randomUUID(), role: "harmonise", text: crisisText }]);
      setActiveModel("Safety screen · no model call");
      await persistTurn(activeId, "assistant", crisisText);
      setError("Urgent support guidance is shown as a safety response; no AI advice was generated for this message.");
    } else if (result.status !== 200 || !result.value || typeof result.value.reply !== "string") {
      setError("The live Meta adviser could not respond. Your message is saved; retry by sending another message when service is available.");
    } else {
      const reply = result.value;
      const assistantTurn: Turn = { id: crypto.randomUUID(), role: "harmonise", text: reply.reply };
      setTurns((current) => [...current, assistantTurn]);
      setActiveModel(reply.model || "Meta AI");
      setUnderstanding({ suggested: reply.suggestedThemes, confirmed: [], need: reply.supportNeed, summary: reply.needSummary });
      setConfirmed([]);
      if (!(await persistTurn(activeId, "assistant", reply.reply))) {
        setError("The adviser replied, but the reply could not be saved to this conversation.");
      }
      await fetch(`/api/sessions/${activeId}/understanding`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggested_themes: reply.suggestedThemes, confirmed_themes: [], support_need: reply.supportNeed, need_summary: reply.needSummary, correction_count: 0 }),
      }).catch(() => null);
    }
    window.dispatchEvent(new Event("harmonise:sessions-changed"));
    setBusy(false);
  }

  function resume(payload: ResumePayload) {
    setSessionId(payload.sessionId);
    setTurns(payload.turns.map((turn, index) => ({ ...turn, id: `${payload.sessionId}-${index}` })));
    const record = payload.understanding;
    const valid = (value: string): value is ThemeId => value in THEME_LABELS;
    const suggested = record?.suggested.filter(valid) ?? [];
    const selected = record?.confirmed.filter(valid) ?? [];
    setUnderstanding(record ? { suggested, confirmed: selected, need: record.need as SupportNeed, summary: record.summary } : null);
    setConfirmed(selected);
    setActiveModel("");
  }

  function startNew() {
    setSessionId(null);
    setTurns([]);
    setUnderstanding(null);
    setConfirmed([]);
    setActiveModel("");
    setError("");
    if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
    microphone.current?.getTracks().forEach((track) => track.stop());
    recorder.current = null;
    microphone.current = null;
  }

  async function saveThemes() {
    if (!sessionId || !understanding) return;
    setBusy(true);
    const response = await fetch(`/api/sessions/${sessionId}/understanding`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggested_themes: understanding.suggested, confirmed_themes: confirmed, support_need: understanding.need, need_summary: understanding.summary, correction_count: 0 }),
    }).catch(() => null);
    setBusy(false);
    if (response?.ok) setUnderstanding({ ...understanding, confirmed });
    else setError("Your confirmed themes could not be saved. Try again.");
  }

  async function transcribeRecording(blob: Blob) {
    setTranscribing(true);
    setVoiceError("");
    try {
      const audioContext = new AudioContext();
      let decoded: AudioBuffer;
      try { decoded = await audioContext.decodeAudioData(await blob.arrayBuffer()); }
      finally { await audioContext.close(); }
      const audio = new FormData();
      audio.append("audio", wavFromBuffer(decoded), "voice-note.wav");
      const response = await fetch("/api/voice/transcribe", { method: "POST", credentials: "include", body: audio });
      const result = await response.json().catch(() => null) as { transcript?: unknown } | null;
      if (!response.ok || typeof result?.transcript !== "string") {
        setVoiceError("Voice transcription is unavailable. Your recording was not added to the message.");
      } else {
        setDraft((current) => `${current}${current.trim() ? " " : ""}${result.transcript}`.slice(0, 2000));
      }
    } catch {
      setVoiceError("The recording could not be transcribed. Your recording was not added to the message.");
    } finally {
      microphone.current?.getTracks().forEach((track) => track.stop());
      microphone.current = null;
      recorder.current = null;
      if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
      voiceTimer.current = null;
      setRecording(false);
      setTranscribing(false);
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphone.current = stream;
      audioChunks.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
        voiceTimer.current = null;
        const captured = new Blob(audioChunks.current, { type: mediaRecorder.mimeType });
        if (captured.size === 0) {
          setVoiceError("No audio was captured. Try recording again.");
          microphone.current?.getTracks().forEach((track) => track.stop());
          microphone.current = null;
          recorder.current = null;
          setRecording(false);
          return;
        }
        void transcribeRecording(captured);
      };
      mediaRecorder.start();
      setRecording(true);
      voiceTimer.current = window.setTimeout(() => { if (mediaRecorder.state === "recording") mediaRecorder.stop(); }, 60_000);
    } catch {
      setVoiceError("Microphone access is unavailable. You can type your message instead.");
    }
  }

  return (
    <div className="product-page">
      <ProductHeader current="space" />
      <main className="product-page-content">
        <p className="product-page-kicker">PRIVATE CONVERSATION · META AI</p>
        <h1 className="serif-head">Talk it through, at your pace.</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">A private conversation with a live AI guide. Read each response, decide what fits, and confirm any themes before using them to explore communities.</p>

        {auth === "checking" ? <p role="status" className="mt-6">Checking your account…</p> : null}
        {auth === "unavailable" ? <p role="alert" className="mt-6">Your account could not be checked. Refresh the page or return to <Link href="/connect">sign in</Link>.</p> : null}
        {auth === "signed-out" ? (
          <div className="mt-7 max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
            <h2 className="section-head">Sign in to start a saved conversation</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Every AI reply comes from the live server route. Your conversation is saved to your account and can be deleted there.</p>
            <div className="mt-5"><AuthCard heading="Sign in with email and password" onSignedIn={() => setAuth("signed-in")} /></div>
            <p className="mt-4 text-sm"><Link href="/connect">Create an account or use the shared demo account</Link></p>
          </div>
        ) : null}

        {auth === "signed-in" ? (
          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">
            <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-label="Private AI conversation">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div><span className="rounded-full bg-[var(--lilac)] px-3 py-1 text-xs font-semibold">{activeModel ? modelLabel(activeModel) : "Meta AI · live response after you send"}</span><p className="mt-2 text-xs text-[var(--muted)]">Your messages are sent to Meta for generation. This is general peer-support guidance, not professional care.</p></div>
                <button type="button" className="button button-secondary" onClick={startNew} disabled={busy || recording || transcribing}>New conversation</button>
              </div>
              <div className="min-h-36 space-y-4" aria-live="polite">
                {turns.length === 0 ? <p className="rounded-xl bg-[var(--paper)] p-4 text-[var(--muted)]">Start with whatever feels most present. There are no example messages or scripted responses.</p> : turns.map((turn) => (
                  <article className={`rounded-xl p-4 ${turn.role === "you" ? "ml-8 bg-[var(--lilac)]" : "mr-8 bg-[var(--paper)]"}`} key={turn.id}>
                    <strong className="text-xs uppercase tracking-wide">{turn.role === "you" ? "You" : "Harmonise · Meta AI"}</strong>
                    <p className="mt-2 whitespace-pre-wrap">{turn.text}</p>
                  </article>
                ))}
                {busy ? <p role="status" className="text-sm text-[var(--muted)]">Waiting for the live adviser…</p> : null}
                <div ref={bottom} />
              </div>
              <form onSubmit={(event) => void send(event)} className="mt-5 grid gap-3">
                <label htmlFor="private-message" className="field-label">Your message</label>
                <textarea id="private-message" rows={4} maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write what is on your mind…" disabled={busy} />
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[var(--muted)]">{draft.trim().length}/2000 · Not shared with a community</span><div className="flex flex-wrap gap-2"><button type="button" aria-label={recording ? "Stop voice recording" : transcribing ? "Transcribing voice message" : "Record a voice message"} aria-pressed={recording} className="button button-secondary" disabled={busy || transcribing} onClick={() => void toggleRecording()}>{recording ? "Stop recording" : transcribing ? "Transcribing…" : "Record a voice message"}</button><button className="button button-primary" disabled={busy || recording || transcribing || !draft.trim()}>{busy ? "Sending…" : "Send to adviser"}</button></div></div>
                <p className="text-xs text-[var(--muted)]">Voice is transcribed by Meta. Review and edit the transcript before sending it to the adviser.</p>
              </form>
              {voiceError ? <p role="alert" className="mt-3 rounded-xl bg-[var(--peach)] p-3 text-sm">{voiceError}</p> : null}
              {error ? <p role="alert" className="mt-4 rounded-xl bg-[var(--peach)] p-3 text-sm">{error}</p> : null}
              {understanding ? (
                <section className="mt-6 border-t border-[var(--line)] pt-5" aria-label="AI understanding for review">
                  <p className="product-page-kicker">AI reflection · your review</p>
                  <p className="mt-2">{understanding.summary}</p>
                  <p className="mt-3 text-sm font-semibold">Themes suggested by the model</p>
                  {understanding.suggested.length === 0 ? <p className="mt-1 text-sm text-[var(--muted)]">No themes were suggested for this conversation.</p> : <div className="mt-2 flex flex-wrap gap-3">{understanding.suggested.map((theme) => <label key={theme} className="flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-sm"><input type="checkbox" checked={confirmed.includes(theme)} onChange={(event) => setConfirmed((current) => event.target.checked ? [...new Set([...current, theme])] : current.filter((value) => value !== theme))} />{THEME_LABELS[theme]}</label>)}</div>}
                  <button type="button" className="button button-secondary mt-3" disabled={busy} onClick={() => void saveThemes()}>Save my theme choices</button>
                  {confirmed.length ? <Link className="ml-3 inline-block text-sm underline" href={`/communities?themes=${confirmed.join(",")}`}>Explore communities for these themes</Link> : null}
                </section>
              ) : null}
            </section>
            <SessionPanel activeSessionId={sessionId} onResume={resume} onNewSession={startNew} onSessionDeleted={(id) => { if (sessionId === id) startNew(); }} />
          </div>
        ) : null}
      </main>
    </div>
  );
}
