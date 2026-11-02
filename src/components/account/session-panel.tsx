"use client";

import { useCallback, useEffect, useState } from "react";
import { markSignedOut, setSyncSession } from "@/lib/session-sync";

export type ResumeTurn = { role: "you" | "harmonise"; text: string };

export type ResumePayload = {
  sessionId: string;
  title: string;
  turns: ResumeTurn[];
  understanding: {
    suggested: string[];
    confirmed: string[];
    need: string;
    summary: string;
  } | null;
};

type SessionSummary = { id: string; title: string; last_active_at: string };

async function api<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, { credentials: "include", ...init });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

export default function SessionPanel({
  activeSessionId,
  onResume,
  onNewSession,
  onSessionDeleted,
}: {
  activeSessionId: string | null;
  onResume: (payload: ResumePayload) => void;
  onNewSession: () => void;
  onSessionDeleted: (id: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const [dbEnabled, setDbEnabled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadSessions = useCallback(async () => {
    const list = await api<{ sessions?: SessionSummary[] }>("/api/sessions");
    if (list.status === 200 && Array.isArray(list.body?.sessions)) setSessions(list.body.sessions);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await api<{ databaseEnabled?: unknown }>("/api/auth/config");
      if (cancelled) return;
      const enabled = config.body?.databaseEnabled === true;
      setDbEnabled(enabled);
      if (enabled) {
        const me = await api("/api/auth/me");
        if (cancelled) return;
        if (me.status === 200) {
          setSignedIn(true);
          await loadSessions();
        } else if (me.status === 401) {
          const refreshed = await api("/api/auth/refresh", { method: "POST" });
          if (cancelled) return;
          if (refreshed.status === 200 && (await api("/api/auth/me")).status === 200) {
            setSignedIn(true);
            await loadSessions();
          }
        }
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSessions]);

  if (!ready || !dbEnabled) return null;

  async function sendCode() {
    setBusy(true);
    setError("");
    const result = await api("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (result.status === 200) {
      setCodeSent(true);
    } else if (result.status === 429) {
      setError("Too many code requests. Wait a minute and try again.");
    } else {
      setError("The sign-in code could not be sent. Try again.");
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    const result = await api("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (result.status === 200) {
      setSignedIn(true);
      setCode("");
      await loadSessions();
    } else {
      setError("That code did not match. Check the latest email and try again.");
    }
  }

  async function signOut() {
    await api("/api/auth/signout", { method: "POST" });
    markSignedOut();
    setSignedIn(false);
    setSessions([]);
    setCodeSent(false);
    onNewSession();
  }

  async function resume(id: string) {
    setBusy(true);
    setError("");
    const full = await api<{
      session?: { id: string; title: string };
      messages?: { role: string; text: string }[];
      understanding?: { suggested_themes: string[]; confirmed_themes: string[]; support_need: string; need_summary: string } | null;
    }>(`/api/sessions/${id}`);
    setBusy(false);
    if (full.status !== 200 || !full.body?.session) {
      setError(full.status === 404 ? "That conversation is no longer available." : "The conversation could not be loaded.");
      return;
    }
    setSyncSession(id);
    onResume({
      sessionId: id,
      title: full.body.session.title,
      turns: (full.body.messages ?? [])
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({ role: message.role === "user" ? ("you" as const) : ("harmonise" as const), text: message.text })),
      understanding: full.body.understanding
        ? {
            suggested: full.body.understanding.suggested_themes ?? [],
            confirmed: full.body.understanding.confirmed_themes ?? [],
            need: full.body.understanding.support_need ?? "not-sure",
            summary: full.body.understanding.need_summary ?? "",
          }
        : null,
    });
  }

  async function removeSession(id: string) {
    setBusy(true);
    const result = await api(`/api/sessions/${id}`, { method: "DELETE" });
    setBusy(false);
    if (result.status === 200) {
      setSessions((current) => current.filter((session) => session.id !== id));
      onSessionDeleted(id);
    } else {
      setError("That conversation could not be deleted. Try again.");
    }
  }

  async function exportData() {
    const result = await api<unknown>("/api/account/export");
    if (result.status !== 200 || !result.body) {
      setError("Export is unavailable right now. Try again.");
      return;
    }
    const blob = new Blob([JSON.stringify(result.body, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harmonise-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!signedIn) {
    return (
      <section className="panel session-panel" aria-label="Save and resume conversations">
        <span className="context-eyebrow">OPTIONAL ACCOUNT · PRIVATE ONLY</span>
        <h2>Save and resume across devices</h2>
        <p className="small-note">
          With an account, your private conversations are stored for you alone and expire after 90 days without use.
          Nothing is shared with any community. You can export or delete everything at any time.
        </p>
        <label className="field-label" htmlFor="session-email">Email for a sign-in code</label>
        <input id="session-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        {codeSent && (
          <>
            <label className="field-label" htmlFor="session-email-code">6-digit code from your email</label>
            <input id="session-email-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </>
        )}
        {error && <p className="notice">{error}</p>}
        <div className="inline-actions">
          {!codeSent ? (
            <button type="button" className="button button-primary" disabled={busy || !email.trim()} onClick={() => void sendCode()}>
              {busy ? "Sending…" : "Email me a code"}
            </button>
          ) : (
            <button type="button" className="button button-primary" disabled={busy || !code.trim()} onClick={() => void verifyCode()}>
              {busy ? "Checking…" : "Sign in"}
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel session-panel" aria-label="Saved conversations">
      <span className="context-eyebrow">PRIVATE SESSIONS · ONLY YOU</span>
      <h2>Your saved conversations</h2>
      {sessions.length === 0 ? (
        <p className="small-note">No saved conversations yet. New messages are saved here automatically while you are signed in.</p>
      ) : (
        <ul className="session-list">
          {sessions.map((session) => (
            <li key={session.id}>
              <div>
                <strong>{session.title}</strong>
                <span className="small-note">{new Date(session.last_active_at).toLocaleString()}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="button button-secondary" disabled={busy || activeSessionId === session.id} onClick={() => void resume(session.id)}>
                  {activeSessionId === session.id ? "Open" : "Resume"}
                </button>
                <button type="button" className="text-button" disabled={busy} onClick={() => void removeSession(session.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="notice">{error}</p>}
      <div className="inline-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={() => {
            setSyncSession(null);
            onNewSession();
          }}
        >
          Start a new saved conversation
        </button>
        <button type="button" className="text-button" onClick={() => void exportData()}>Export my data</button>
        <button type="button" className="text-button" onClick={() => void signOut()}>Sign out</button>
      </div>
    </section>
  );
}
