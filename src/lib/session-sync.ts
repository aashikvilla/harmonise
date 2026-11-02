"use client";

/**
 * Browser sync between the conversation UI and durable private sessions.
 * Every function no-ops when the database is not configured or the user is
 * signed out, so anonymous local-only use is unchanged.
 */

export type SyncTurn = { role: "you" | "harmonise"; text: string };

export type SyncUnderstanding = {
  suggestedThemes: string[];
  confirmedThemes: string[];
  supportNeed: string;
  needSummary: string;
  correctionRequested: boolean;
};

let databaseEnabled: boolean | null = null;
let signedIn: boolean | null = null;
let sessionId: string | null = null;
const savedCounts = new Map<string, number>();
const savedCorrections = new Map<string, number>();

export function setSyncSession(id: string | null) {
  sessionId = id;
}

export function getSyncSession() {
  return sessionId;
}

export function markSignedOut() {
  signedIn = false;
  sessionId = null;
}

async function json<T>(input: RequestInfo, init?: RequestInit): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(input, { credentials: "include", ...init });
    const body = (await response.json().catch(() => null)) as T | null;
    return { status: response.status, body };
  } catch {
    return { status: 0, body: null };
  }
}

export async function syncAvailable() {
  if (databaseEnabled === null) {
    const config = await json<{ databaseEnabled?: unknown }>("/api/auth/config");
    databaseEnabled = config.body?.databaseEnabled === true;
  }
  if (!databaseEnabled) return false;
  if (signedIn === null) {
    const me = await json("/api/auth/me");
    if (me.status === 401) {
      const refreshed = await json("/api/auth/refresh", { method: "POST" });
      signedIn = refreshed.status === 200 ? (await json("/api/auth/me")).status === 200 : false;
    } else {
      signedIn = me.status === 200;
    }
  }
  return signedIn === true;
}

export async function saveConversation(turns: SyncTurn[], understanding: SyncUnderstanding) {
  try {
    if (!(await syncAvailable()) || turns.length === 0) return;
    if (!sessionId) {
      const title = turns.find((turn) => turn.role === "you")?.text.slice(0, 80) || "Untitled conversation";
      const created = await json<{ session?: { id?: unknown } }>("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (created.status === 401) {
        markSignedOut();
        return;
      }
      if (created.status !== 200 || typeof created.body?.session?.id !== "string") return;
      sessionId = created.body.session.id;
    }
    const saved = savedCounts.get(sessionId) ?? 0;
    const pending = turns.slice(saved);
    for (const turn of pending) {
      const stored = await json(`/api/sessions/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: turn.role === "you" ? "user" : "assistant", text: turn.text }),
      });
      if (stored.status === 401) {
        markSignedOut();
        return;
      }
      if (stored.status !== 200) return;
      savedCounts.set(sessionId, (savedCounts.get(sessionId) ?? 0) + 1);
    }
    const corrections = (savedCorrections.get(sessionId) ?? 0) + (understanding.correctionRequested ? 1 : 0);
    savedCorrections.set(sessionId, corrections);
    await json(`/api/sessions/${sessionId}/understanding`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggested_themes: understanding.suggestedThemes,
        confirmed_themes: understanding.confirmedThemes,
        support_need: understanding.supportNeed,
        need_summary: understanding.needSummary,
        correction_count: corrections,
      }),
    });
  } catch {
    /* Sync failures never interrupt the conversation. */
  }
}
