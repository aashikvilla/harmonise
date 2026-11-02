import type {
  ConsentRecordRow,
  MembershipRow,
  PostReplyRow,
  PostRow,
  PrivateSessionRow,
  ReportRow,
  SessionMessageRow,
  SessionUnderstandingRow,
} from "@/lib/db/types";
import { selectSingle, supabaseRest } from "@/lib/db/supabase";

export const SESSION_THEME_IDS = [
  "family-expectations",
  "relationship-uncertainty",
  "work-pressure",
  "relocation",
  "belonging",
  "personal-autonomy",
  "communication",
  "hobbies",
] as const;

export const SESSION_SUPPORT_NEEDS = ["human-perspective", "quiet-reading", "shared-activity", "not-sure"] as const;

export type SessionSummary = Pick<PrivateSessionRow, "id" | "title" | "status" | "last_active_at" | "created_at">;

export type SessionFull = {
  session: PrivateSessionRow;
  messages: SessionMessageRow[];
  understanding: SessionUnderstandingRow | null;
};

export async function ensureProfile(userId: string) {
  await supabaseRest("profiles", {
    method: "POST",
    body: { id: userId },
    prefer: "resolution=ignore-duplicates",
  });
}

export async function listSessions(userId: string): Promise<SessionSummary[]> {
  return supabaseRest<SessionSummary[]>("private_sessions", {
    query: `?user_id=eq.${userId}&status=eq.active&order=last_active_at.desc&select=id,title,status,last_active_at,created_at`,
  });
}

export async function createSession(userId: string, title: string): Promise<PrivateSessionRow> {
  await ensureProfile(userId);
  const rows = await supabaseRest<PrivateSessionRow[]>("private_sessions", {
    method: "POST",
    body: { user_id: userId, title: title.slice(0, 120) || "Untitled conversation" },
    prefer: "return=representation",
  });
  const created = selectSingle(rows);
  if (!created) throw new Error("session not created");
  return created;
}

export async function getOwnSession(userId: string, sessionId: string): Promise<PrivateSessionRow | null> {
  const rows = await supabaseRest<PrivateSessionRow[]>("private_sessions", {
    query: `?id=eq.${sessionId}&user_id=eq.${userId}&select=*`,
  });
  return selectSingle(rows);
}

export async function getSessionFull(userId: string, sessionId: string): Promise<SessionFull | null> {
  const session = await getOwnSession(userId, sessionId);
  if (!session || session.status === "deleted") return null;
  const [messages, understandingRows] = await Promise.all([
    supabaseRest<SessionMessageRow[]>("session_messages", {
      query: `?session_id=eq.${sessionId}&order=created_at.asc&select=*`,
    }),
    supabaseRest<SessionUnderstandingRow[]>("session_understanding", {
      query: `?session_id=eq.${sessionId}&select=*`,
    }),
  ]);
  return { session, messages, understanding: selectSingle(understandingRows) };
}

export async function renameSession(userId: string, sessionId: string, title: string) {
  const rows = await supabaseRest<PrivateSessionRow[]>("private_sessions", {
    method: "PATCH",
    query: `?id=eq.${sessionId}&user_id=eq.${userId}`,
    body: { title: title.slice(0, 120), last_active_at: new Date().toISOString() },
    prefer: "return=representation",
  });
  return selectSingle(rows);
}

export async function appendMessage(userId: string, sessionId: string, role: "user" | "assistant", text: string) {
  const session = await getOwnSession(userId, sessionId);
  if (!session || session.status !== "active") return null;
  const rows = await supabaseRest<SessionMessageRow[]>("session_messages", {
    method: "POST",
    body: { session_id: sessionId, role, text: text.slice(0, 4000) },
    prefer: "return=representation",
  });
  const created = selectSingle(rows);
  if (!created) return null;
  await supabaseRest("private_sessions", {
    method: "PATCH",
    query: `?id=eq.${sessionId}&user_id=eq.${userId}`,
    body: { last_active_at: new Date().toISOString() },
  });
  return created;
}

export type UnderstandingInput = {
  suggested_themes: string[];
  confirmed_themes: string[];
  support_need: string;
  need_summary: string;
  correction_count: number;
};

export function validUnderstandingInput(value: Record<string, unknown>): UnderstandingInput | null {
  const themeOk = (list: unknown): list is string[] =>
    Array.isArray(list) &&
    list.length <= 8 &&
    list.every((theme): theme is string => typeof theme === "string" && (SESSION_THEME_IDS as readonly string[]).includes(theme));
  if (!themeOk(value.suggested_themes) || !themeOk(value.confirmed_themes)) return null;
  if (typeof value.support_need !== "string" || !(SESSION_SUPPORT_NEEDS as readonly string[]).includes(value.support_need)) return null;
  if (typeof value.need_summary !== "string") return null;
  if (typeof value.correction_count !== "number" || !Number.isInteger(value.correction_count) || value.correction_count < 0) return null;
  return {
    suggested_themes: [...new Set(value.suggested_themes)],
    confirmed_themes: [...new Set(value.confirmed_themes)],
    support_need: value.support_need,
    need_summary: value.need_summary.trim().slice(0, 500),
    correction_count: value.correction_count,
  };
}

export async function saveUnderstanding(userId: string, sessionId: string, input: UnderstandingInput) {
  const session = await getOwnSession(userId, sessionId);
  if (!session || session.status !== "active") return null;
  const rows = await supabaseRest<SessionUnderstandingRow[]>("session_understanding", {
    method: "POST",
    body: { session_id: sessionId, ...input, updated_at: new Date().toISOString() },
    prefer: "return=representation,resolution=merge-duplicates",
  });
  return selectSingle(rows);
}

export async function deleteSession(userId: string, sessionId: string) {
  await supabaseRest("private_sessions", {
    method: "DELETE",
    query: `?id=eq.${sessionId}&user_id=eq.${userId}`,
  });
  const remaining = await getOwnSession(userId, sessionId);
  const leftover = remaining
    ? await supabaseRest<SessionMessageRow[]>("session_messages", { query: `?session_id=eq.${sessionId}&select=id&limit=1` })
    : [];
  return remaining === null && leftover.length === 0;
}

export async function exportAccount(userId: string) {
  const sessions = await supabaseRest<PrivateSessionRow[]>("private_sessions", {
    query: `?user_id=eq.${userId}&select=*&order=created_at.asc`,
  });
  const memberships = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?user_id=eq.${userId}&select=*&order=created_at.asc`,
  });
  const memberFilter = memberships.length > 0 ? `in.(${memberships.map((member) => member.id).join(",")})` : `in.(00000000-0000-0000-0000-000000000000)`;
  const [messages, understanding, consents, posts, replies, reports] = await Promise.all([
    Promise.all(
      sessions.map((session) =>
        supabaseRest<SessionMessageRow[]>("session_messages", { query: `?session_id=eq.${session.id}&select=*&order=created_at.asc` }),
      ),
    ).then((lists) => lists.flat()),
    Promise.all(
      sessions.map((session) =>
        supabaseRest<SessionUnderstandingRow[]>("session_understanding", { query: `?session_id=eq.${session.id}&select=*` }),
      ),
    ).then((lists) => lists.flat()),
    supabaseRest<ConsentRecordRow[]>("consent_records", { query: `?user_id=eq.${userId}&select=*&order=created_at.asc` }),
    supabaseRest<PostRow[]>("posts", { query: `?author_membership_id=${memberFilter}&select=*&order=created_at.asc` }),
    supabaseRest<PostReplyRow[]>("post_replies", { query: `?author_membership_id=${memberFilter}&select=*&order=created_at.asc` }),
    supabaseRest<ReportRow[]>("reports", { query: `?reporter_membership_id=${memberFilter}&select=*&order=created_at.asc` }),
  ]);
  return { exportedAt: new Date().toISOString(), sessions, messages, understanding, consents, memberships, posts, replies, reports };
}

export async function deleteAccount(userId: string) {
  await supabaseRest("profiles", { method: "DELETE", query: `?id=eq.${userId}` });
  const sessions = await supabaseRest<PrivateSessionRow[]>("private_sessions", {
    query: `?user_id=eq.${userId}&select=id&limit=1`,
  });
  const consents = await supabaseRest<ConsentRecordRow[]>("consent_records", {
    query: `?user_id=eq.${userId}&select=id&limit=1`,
  });
  return sessions.length === 0 && consents.length === 0;
}
