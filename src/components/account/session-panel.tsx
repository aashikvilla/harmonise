"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/account/auth-card";
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [receipt, setReceipt] = useState("");
  const [deletedAt, setDeletedAt] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const list = await api<{ sessions?: SessionSummary[] }>("/api/sessions");
    if (list.status === 200 && Array.isArray(list.body?.sessions)) setSessions(list.body.sessions);
  }, []);

  const checkSession = useCallback(async () => {
    const me = await api("/api/auth/me");
    if (me.status === 200) {
      setSignedIn(true);
      await loadSessions();
      return;
    }
    if (me.status === 401) {
      const refreshed = await api("/api/auth/refresh", { method: "POST" });
      if (refreshed.status === 200 && (await api("/api/auth/me")).status === 200) {
        setSignedIn(true);
        await loadSessions();
      }
    }
  }, [loadSessions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await api<{ databaseEnabled?: unknown }>("/api/auth/config");
      if (cancelled) return;
      const enabled = config.body?.databaseEnabled === true;
      setDbEnabled(enabled);
      if (enabled) await checkSession();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [checkSession]);

  if (!ready || !dbEnabled) return null;

  async function deleteAccount() {
    if (deleteConfirm !== "delete my data") {
      setError("Type “delete my data” to confirm account deletion.");
      return;
    }
    setBusy(true);
    const result = await api("/api/account/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "delete my data" }),
    });
    setBusy(false);
    if (result.status === 200) {
      markSignedOut();
      setSignedIn(false);
      setSessions([]);
      setDeletedAt(new Date().toLocaleString());
      setShowDelete(false);
      onNewSession();
    } else {
      setError("Account deletion did not complete. Try again.");
    }
  }

  async function signOut() {
    await api("/api/auth/signout", { method: "POST" });
    markSignedOut();
    setSignedIn(false);
    setSessions([]);
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

  async function saveRename() {
    if (!renaming || !renaming.title.trim()) return;
    setBusy(true);
    setError("");
    const result = await api(`/api/sessions/${renaming.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renaming.title.trim() }),
    });
    setBusy(false);
    if (result.status === 200) {
      setSessions((current) => current.map((session) => (session.id === renaming.id ? { ...session, title: renaming.title.trim() } : session)));
      setRenaming(null);
    } else {
      setError("That conversation could not be renamed. Try again.");
    }
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
    const result = await api<{ sessions?: unknown[] }>("/api/account/export");
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
    const count = Array.isArray(result.body.sessions) ? result.body.sessions.length : 0;
    setReceipt(`Exported ${count} conversation${count === 1 ? "" : "s"} on ${new Date().toLocaleString()}.`);
  }

  if (deletedAt && !signedIn) {
    return (
      <section className="panel session-panel" aria-label="Account deleted">
        <span className="context-eyebrow">DELETION RECEIPT</span>
        <h2>Your data was deleted</h2>
        <p className="small-note">
          Your account, private sessions, memberships, posts, and consents were deleted on {deletedAt}.
        </p>
      </section>
    );
  }

  if (!signedIn) {
    return <AuthCard heading="Save and resume across devices" onSignedIn={() => void checkSession()} />;
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
                {renaming?.id === session.id ? (
                  <input
                    aria-label="Conversation title"
                    value={renaming.title}
                    disabled={busy}
                    onChange={(event) => setRenaming({ id: session.id, title: event.target.value })}
                  />
                ) : (
                  <strong>{session.title}</strong>
                )}
                <span className="small-note">{new Date(session.last_active_at).toLocaleString()}</span>
              </div>
              <div className="inline-actions">
                <button type="button" className="button button-secondary" disabled={busy || activeSessionId === session.id} onClick={() => void resume(session.id)}>
                  {activeSessionId === session.id ? "Open" : "Resume"}
                </button>
                {renaming?.id === session.id ? (
                  <button type="button" className="button button-secondary" disabled={busy || !renaming.title.trim()} onClick={() => void saveRename()}>
                    Save
                  </button>
                ) : (
                  <button type="button" className="text-button" disabled={busy} onClick={() => setRenaming({ id: session.id, title: session.title })}>
                    Rename
                  </button>
                )}
                <button type="button" className="text-button" disabled={busy} onClick={() => void removeSession(session.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="notice">{error}</p>}
      {receipt && <p className="small-note">{receipt}</p>}
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
        <button type="button" className="text-button" onClick={() => setShowDelete((value) => !value)}>Delete my account…</button>
      </div>
      {showDelete && (
        <div className="notice">
          <p>
            <strong>Delete your account and all Harmonise data?</strong> This removes your profile, private sessions,
            memberships, posts, and consents. Anything already sent to Meta cannot be erased by Harmonise.
          </p>
          <label className="field-label" htmlFor="delete-confirm">Type “delete my data” to confirm</label>
          <input id="delete-confirm" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} />
          <div className="inline-actions">
            <button type="button" className="button button-primary" disabled={busy} onClick={() => void deleteAccount()}>
              Delete everything
            </button>
          </div>
        </div>
      )}
      <p className="small-note">
        <Link href="/communities">Browse real communities</Link> with this same account.
      </p>
    </section>
  );
}
