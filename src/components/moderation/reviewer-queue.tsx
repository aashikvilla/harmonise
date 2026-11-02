"use client";

import { useCallback, useEffect, useState } from "react";
import AuthCard from "@/components/account/auth-card";
import { ScopeStewardshipPanel } from "@/components/moderation/scope-stewardship-panel";

type Assignment = { community_id: string; community_name: string };

type QueueItem = {
  report: { id: string; reason: string; status: string; created_at: string };
  target: { kind: string; id: string; body: string; status: string; author_alias: string } | null;
  reporter_alias: string;
  suggestion: { concern: string; severity: string; rationale: string; uncertainty: string; policy_version: string; helper?: { display_name: string; kind: "ai" } } | null;
  decisions: { id: string; decision: string; rationale: string; policy_version: string; created_at: string }[];
  appeals: { id: string; reason: string; status: string; created_at: string }[];
};

type Metrics = {
  reports: Record<string, number>;
  decisionsByKind: Record<string, number>;
  suggestionsBySeverity: Record<string, number>;
  appeals: Record<string, number>;
  overturnRate: number | null;
};

async function getJson<T>(path: string): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, { credentials: "include" });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

async function sendJson<T>(path: string, method: string, data?: unknown): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

type LiveFlag = {
  eventId: string;
  excerpt: string;
  suggestion: { concern: string; severity: string; rationale: string; uncertainty: string; helper?: { display_name: string; kind: "ai" } };
  createdAt: string;
};

const DECISION_LABELS: Record<string, string> = {
  "no-action": "No action",
  "request-revision": "Request revision",
  remove: "Remove content",
  escalate: "Escalate to safety lead",
};

export default function ReviewerQueue() {
  const [status, setStatus] = useState<"loading" | "signed-out" | "ready" | "unavailable">("loading");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [communityId, setCommunityId] = useState("");
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [flags, setFlags] = useState<LiveFlag[]>([]);
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAssignments = useCallback(async () => {
    const config = await getJson<{ databaseEnabled?: unknown }>("/api/auth/config");
    if (config.body?.databaseEnabled !== true) {
      setStatus("unavailable");
      return;
    }
    const me = await getJson("/api/auth/me");
    if (me.status !== 200) {
      setStatus("signed-out");
      return;
    }
    const list = await getJson<{ assignments?: Assignment[] }>("/api/moderation/assignments");
    if (list.status === 200 && Array.isArray(list.body?.assignments)) {
      setAssignments(list.body.assignments);
      if (list.body.assignments.length > 0 && !communityId) setCommunityId(list.body.assignments[0].community_id);
    }
    setStatus("ready");
  }, [communityId]);

  const loadQueue = useCallback(async () => {
    if (!communityId) return;
    setQueue(null);
    const [feed, stats, flagFeed] = await Promise.all([
      getJson<{ queue?: QueueItem[] }>(`/api/moderation/queue?community=${communityId}`),
      getJson<{ metrics?: Metrics }>(`/api/moderation/metrics?community=${communityId}`),
      getJson<{ flags?: LiveFlag[] }>(`/api/moderation/flags?community=${communityId}`),
    ]);
    if (feed.status === 200 && Array.isArray(feed.body?.queue)) setQueue(feed.body.queue);
    else setQueue([]);
    if (stats.status === 200 && stats.body?.metrics) setMetrics(stats.body.metrics);
    setFlags(flagFeed.status === 200 && Array.isArray(flagFeed.body?.flags) ? flagFeed.body.flags : []);
  }, [communityId]);

  useEffect(() => {
    void (async () => {
      await loadAssignments();
    })();
  }, [loadAssignments]);

  useEffect(() => {
    void (async () => {
      await loadQueue();
    })();
  }, [loadQueue]);

  async function decide(reportId: string, decision: string) {
    const rationale = rationales[reportId] ?? "";
    if (decision !== "no-action" && !rationale.trim()) {
      setNotice("Add a short rationale before requesting revision, removing, or escalating.");
      return;
    }
    setBusy(true);
    const result = await sendJson("/api/moderation/decide", "POST", { reportId, decision, rationale });
    setBusy(false);
    if (result.status === 200) {
      setNotice("Decision recorded. The author sees the outcome, not reviewer notes.");
      setRationales((current) => ({ ...current, [reportId]: "" }));
      await loadQueue();
    } else if (result.status === 409) {
      setNotice("This report was already decided. The queue has been refreshed.");
      await loadQueue();
    } else {
      setNotice("The decision could not be recorded. Try again.");
    }
  }

  async function decideAppeal(appealId: string, outcome: "upheld" | "overturned") {
    setBusy(true);
    const result = await sendJson(`/api/moderation/appeals/${appealId}/decide`, "POST", { outcome });
    setBusy(false);
    if (result.status === 200) {
      setNotice(`Appeal ${outcome}. The record keeps your outcome separate from the original decision.`);
      await loadQueue();
    } else {
      setNotice("The appeal outcome could not be recorded. Try again.");
    }
  }

  if (status === "loading") return <p role="status" className="text-[var(--muted)]">Loading reviewer access…</p>;
  if (status === "unavailable") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold">Moderation isn&apos;t connected yet</h2>
        <p className="mt-2 text-[var(--muted)]">The review queue appears once the database is connected and you hold a moderator role.</p>
      </div>
    );
  }
  if (status === "signed-out") return <AuthCard heading="Sign in as a reviewer" onSignedIn={() => void loadAssignments()} />;

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold">No reviewer access</h2>
        <p className="mt-2 text-[var(--muted)]">
          This account is not a moderator in any community. Reviews are done by named humans only.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-xl bg-[var(--peach)] p-4 text-sm">
        <strong>Reviewer duty:</strong> decide every case yourself — AI suggestions never act. Reviews happen during
        staffed hours. If someone may be in immediate danger, contact local emergency services; Harmonise cannot
        monitor or dispatch help. Resources:{" "}
        <a className="underline" href="https://findahelpline.com/" target="_blank" rel="noreferrer">
          findahelpline.com
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="review-community" className="text-sm font-semibold">Community</label>
        <select
          id="review-community"
          value={communityId}
          onChange={(event) => setCommunityId(event.target.value)}
          className="rounded-lg border border-[var(--line)] bg-white p-2.5"
        >
          {assignments.map((assignment) => (
            <option key={assignment.community_id} value={assignment.community_id}>
              {assignment.community_name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void loadQueue()} className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm">
          Refresh queue
        </button>
      </div>

      {metrics && (
        <div className="flex flex-wrap gap-2 text-xs" aria-label="Moderation metrics">
          <span className="rounded-full bg-[var(--lilac)] px-3 py-1">Open reports: {metrics.reports.open ?? 0}</span>
          <span className="rounded-full bg-[var(--lilac)] px-3 py-1">Appealed: {metrics.reports.appealed ?? 0}</span>
          <span className="rounded-full bg-[var(--lilac)] px-3 py-1">
            Overturn rate: {metrics.overturnRate === null ? "—" : `${Math.round(metrics.overturnRate * 100)}%`}
          </span>
        </div>
      )}

      {notice && (
        <p role="status" className="rounded-lg bg-[var(--sage)] p-3 text-sm">
          {notice}
        </p>
      )}

      {communityId && <ScopeStewardshipPanel communityId={communityId} />}

      {flags.length > 0 && (
        <div className="grid gap-3">
          <h3 className="text-lg font-semibold">New-post flags (advisory — no report filed)</h3>
          {flags.map((flag) => (
            <div key={flag.eventId} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
              <p>
                <strong>{flag.suggestion.severity}</strong> · {flag.suggestion.concern} · uncertainty{" "}
                {flag.suggestion.uncertainty} · {flag.suggestion.helper?.display_name ?? "AI triage"} · {new Date(flag.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[var(--muted)]">{flag.excerpt}</p>
              <p className="mt-1">{flag.suggestion.rationale}</p>
            </div>
          ))}
        </div>
      )}

      {queue === null ? (
        <p role="status" className="text-[var(--muted)]">Loading queue…</p>
      ) : queue.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-[var(--muted)]">
          The queue is clear. No open or appealed reports in this community.
        </p>
      ) : (
        queue.map((item) => (
          <article key={item.report.id} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
              <span className="rounded-full bg-[var(--peach)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                {item.report.status}
              </span>
              <span>Reported {new Date(item.report.created_at).toLocaleString()}</span>
              <span>·</span>
              <span>Reporter: {item.reporter_alias} (reviewers only)</span>
            </div>
            <div>
              <h3 className="font-semibold">Report reason</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">{item.report.reason}</p>
            </div>
            {item.target ? (
              <div className="rounded-lg bg-[var(--paper)] p-3">
                <p className="text-xs text-[var(--muted)]">
                  {item.target.kind} by {item.target.author_alias} · status: {item.target.status}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{item.target.body}</p>
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">The reported content was deleted by its author.</p>
            )}
            <div className="rounded-lg border border-[var(--line)] p-3 text-sm">
              <h4 className="font-semibold">AI triage suggestion (advisory only)</h4>
              {item.suggestion ? (
                <p className="mt-1">
                  {item.suggestion.concern} · {item.suggestion.severity} · uncertainty {item.suggestion.uncertainty} ·
                  policy {item.suggestion.policy_version} · {item.suggestion.helper?.display_name ?? "AI triage"} — {item.suggestion.rationale}
                </p>
              ) : (
                <p className="mt-1 text-[var(--muted)]">No AI suggestion yet — decide from the content and policy.</p>
              )}
            </div>
            {item.decisions.length > 0 && (
              <div className="text-sm">
                <h4 className="font-semibold">Decision history</h4>
                <ul className="mt-1 grid gap-1">
                  {item.decisions.map((decision) => (
                    <li key={decision.id} className="text-[var(--muted)]">
                      {DECISION_LABELS[decision.decision] ?? decision.decision} · policy {decision.policy_version} ·{" "}
                      {new Date(decision.created_at).toLocaleString()}
                      {decision.rationale ? ` — ${decision.rationale}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.appeals.map((appeal) => (
              <div key={appeal.id} className="rounded-lg bg-[var(--lilac)] p-3 text-sm">
                <p>
                  <strong>Appeal ({appeal.status}):</strong> {appeal.reason}
                </p>
                {appeal.status === "open" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decideAppeal(appeal.id, "upheld")}
                      className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-white disabled:opacity-50"
                    >
                      Uphold decision
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void decideAppeal(appeal.id, "overturned")}
                      className="rounded-full bg-[var(--teal)] px-4 py-1.5 text-white disabled:opacity-50"
                    >
                      Overturn and restore
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor={`rationale-${item.report.id}`}>
                Your rationale (required unless no action)
              </label>
              <textarea
                id={`rationale-${item.report.id}`}
                rows={2}
                maxLength={1000}
                value={rationales[item.report.id] ?? ""}
                onChange={(event) => setRationales((current) => ({ ...current, [item.report.id]: event.target.value }))}
                className="w-full rounded-lg border border-[var(--line)] bg-white p-3 text-sm"
                placeholder="Short, factual reason for your decision."
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(DECISION_LABELS).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={busy}
                    onClick={() => void decide(item.report.id, value)}
                    className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
