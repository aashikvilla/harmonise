"use client";

import { useCallback, useEffect, useState } from "react";

type ScopePackage = {
  includedTopics: string[];
  adjacentTopics: string[];
  outOfScopeTopics: string[];
  norms: string[];
  welcomeMessage: string;
  starterPrompts: string[];
};

type ScopeChange = {
  id: string;
  recommendation_kind: "clarify" | "expand" | "split";
  risk: "low" | "moderate" | "high";
  status: "pending" | "approved" | "rejected" | "superseded";
  prior_scope: { name: string; description: string; topics: string[]; scopePackage: ScopePackage; scopeVersion: number };
  recommendation: {
    proposedDescription: string;
    proposedTopics: string[];
    proposedScopePackage: ScopePackage;
    newCommunityName: string;
    newCommunityDescription: string;
    newCommunityTopics: string[];
    newCommunityScopePackage: ScopePackage;
  };
  rationale: string;
  reviewer_rationale: string | null;
  created_at: string;
  reviewed_at: string | null;
  applied_at: string | null;
  rolled_back_at: string | null;
  rollback_rationale: string | null;
  split_community_id: string | null;
};

async function readJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

export function ScopeStewardshipPanel({ communityId }: { communityId: string }) {
  const [excerpt, setExcerpt] = useState("");
  const [changes, setChanges] = useState<ScopeChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rationales, setRationales] = useState<Record<string, string>>({});

  const loadChanges = useCallback(async () => {
    if (!communityId) return;
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/scope-proposals`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = await readJson<{ changes?: ScopeChange[] }>(response);
      if (!response.ok || !Array.isArray(body?.changes)) {
        setError(response.status === 403 ? "This community's active moderators can review scope suggestions." : "Scope suggestions are unavailable right now.");
        setChanges([]);
      } else {
        setError("");
        setChanges(body.changes);
      }
    } catch {
      setError("Scope suggestions are unavailable right now. Try again.");
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadChanges(), 0);
    return () => window.clearTimeout(timer);
  }, [loadChanges]);

  async function createSuggestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = excerpt.trim();
    if (selected.length < 40 || selected.length > 1200) {
      setError("Select a short excerpt between 40 and 1,200 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/scope-proposals`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ excerpt: selected }),
      });
      const body = await readJson<{ error?: string; change?: ScopeChange }>(response);
      if (!response.ok || !body?.change) {
        setError(body?.error === "rate-limited" ? "You've reached the current review limit. Try again later." : "The scope suggestion could not be prepared. Try again.");
        return;
      }
      setExcerpt("");
      setNotice("Suggestion prepared. It is a draft for human review and has not changed the community.");
      await loadChanges();
    } catch {
      setError("The scope suggestion could not be prepared. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(change: ScopeChange, decision: "approved" | "rejected" | "rollback") {
    const rationale = rationales[change.id]?.trim() ?? "";
    if (rationale.length < 3) {
      setError("Add a short review note before deciding.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/scope-proposals/${encodeURIComponent(change.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rationale }),
      });
      const body = await readJson<{ error?: string; change?: ScopeChange }>(response);
      if (!response.ok) {
        setError(body?.error === "scope-changed" ? "The community scope changed after this suggestion was created. Refresh and review it again." : body?.error === "rollback-unavailable" ? "This change can no longer be rolled back because a later scope version is active." : "That review decision could not be recorded.");
        await loadChanges();
        return;
      }
      setRationales((current) => ({ ...current, [change.id]: "" }));
      setNotice(decision === "rollback"
        ? "The previous community scope was restored. The version history keeps both changes."
        : change.recommendation_kind === "split" && decision === "approved"
        ? `Private pending community proposal created${body?.change?.split_community_id ? ` (${body.change.split_community_id})` : ""}. It awaits separate launch review; nobody was notified or invited.`
        : decision === "approved" ? "Scope update applied and recorded." : "Suggestion rejected and recorded.");
      await loadChanges();
    } catch {
      setError("That review decision could not be recorded. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5" aria-labelledby="scope-stewardship-title">
      <div>
        <h3 id="scope-stewardship-title" className="text-lg font-semibold">Community scope suggestions</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">Review one selected excerpt to consider clarifying this community, adding an adjacent topic, or proposing a separate group. The helper does not scan posts in the background.</p>
      </div>

      <form className="grid gap-3" onSubmit={(event) => void createSuggestion(event)}>
        <label className="grid gap-1 text-sm font-semibold" htmlFor="scope-review-excerpt">
          Selected, non-identifying excerpt
          <textarea
            id="scope-review-excerpt"
            rows={4}
            maxLength={1200}
            minLength={40}
            required
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm font-normal"
            placeholder="Paste only the short excerpt needed to consider a scope change. Remove names and personal details."
          />
        </label>
        <p className="text-xs leading-relaxed text-[var(--muted)]">
          Before you continue: this excerpt and the community&apos;s public name, description, topics, and scope are sent to Meta for a suggestion. Harmonise does not store the excerpt; the review record keeps its length and the scope recommendation. Do not include names or private-chat content.
        </p>
        <div>
          <button type="submit" disabled={busy || loading || excerpt.trim().length < 40} className="min-h-11 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Preparing suggestion…" : "Send excerpt to Meta for review"}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="rounded-lg bg-[var(--peach)] p-3 text-sm">{error}</p>}
      {notice && <p role="status" className="rounded-lg bg-[var(--sage)] p-3 text-sm">{notice}</p>}

      {loading ? (
        <p role="status" aria-busy="true" className="loading-skeleton text-sm text-[var(--muted)]">Loading scope suggestions…</p>
      ) : changes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">No scope suggestions yet.</p>
      ) : (
        <div className="grid gap-3">
          {changes.map((change) => {
            const draft = change.recommendation;
            const appliesToCommunity = change.recommendation_kind !== "split";
            return (
              <article key={change.id} className="grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-[var(--lilac)] px-3 py-1 font-semibold">{change.recommendation_kind === "split" ? "Suggest a separate community" : change.recommendation_kind === "expand" ? "Adjacent scope expansion" : "Clarify current scope"}</span>
                  <span className="rounded-full bg-[var(--peach)] px-3 py-1">{change.risk} risk</span>
                  <span className="rounded-full bg-white px-3 py-1">{change.status}</span>
                  <span className="text-xs text-[var(--muted)]">{new Date(change.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm">{change.rationale}</p>

                <div className="rounded-lg border border-[var(--line)] bg-white p-3 text-sm">
                  <strong>Current scope · version {change.prior_scope.scopeVersion}</strong>
                  <p className="mt-1">{change.prior_scope.description}</p>
                  <p className="mt-1"><span className="font-semibold">Topics:</span> {change.prior_scope.topics.join(" · ") || "None listed"}</p>
                  <p className="mt-1"><span className="font-semibold">Included:</span> {change.prior_scope.scopePackage.includedTopics.join(" · ") || "Not specified"}</p>
                  <p className="mt-1"><span className="font-semibold">Adjacent:</span> {change.prior_scope.scopePackage.adjacentTopics.join(" · ") || "None listed"}</p>
                  <p className="mt-1"><span className="font-semibold">Out of scope:</span> {change.prior_scope.scopePackage.outOfScopeTopics.join(" · ") || "None listed"}</p>
                </div>

                {appliesToCommunity ? (
                  <div className="grid gap-2 text-sm">
                    <div className="rounded-lg bg-[var(--lilac)] p-3"><strong>Proposed scope</strong>
                      <p className="mt-1">{draft.proposedDescription}</p>
                      <p className="mt-1"><span className="font-semibold">Topics:</span> {draft.proposedTopics.length ? draft.proposedTopics.join(" · ") : "No topics"}</p>
                      <p className="mt-1"><span className="font-semibold">Included:</span> {draft.proposedScopePackage.includedTopics.join(" · ") || "Not specified"}</p>
                      <p className="mt-1"><span className="font-semibold">Adjacent:</span> {draft.proposedScopePackage.adjacentTopics.join(" · ") || "None listed"}</p>
                      <p className="mt-1"><span className="font-semibold">Out of scope:</span> {draft.proposedScopePackage.outOfScopeTopics.join(" · ") || "None listed"}</p>
                      {draft.proposedScopePackage.norms.length > 0 && <p className="mt-1"><span className="font-semibold">Norms:</span> {draft.proposedScopePackage.norms.join(" · ")}</p>}
                      {draft.proposedScopePackage.welcomeMessage && <p className="mt-2"><span className="font-semibold">Welcome:</span> {draft.proposedScopePackage.welcomeMessage}</p>}
                      {draft.proposedScopePackage.starterPrompts.length > 0 && <p className="mt-1"><span className="font-semibold">Starter prompts:</span> {draft.proposedScopePackage.starterPrompts.join(" · ")}</p>}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white p-3 text-sm">
                    <strong>Draft separate community: {draft.newCommunityName}</strong>
                    <p className="mt-1">{draft.newCommunityDescription}</p>
                    <p className="mt-1 text-[var(--muted)]">Topics: {draft.newCommunityTopics.join(" · ")}</p>
                    <p className="mt-1"><span className="font-semibold">Included:</span> {draft.newCommunityScopePackage.includedTopics.join(" · ") || "Not specified"}</p>
                    <p className="mt-1"><span className="font-semibold">Adjacent:</span> {draft.newCommunityScopePackage.adjacentTopics.join(" · ") || "None listed"}</p>
                    <p className="mt-1"><span className="font-semibold">Out of scope:</span> {draft.newCommunityScopePackage.outOfScopeTopics.join(" · ") || "None listed"}</p>
                    {draft.newCommunityScopePackage.norms.length > 0 && <p className="mt-1"><span className="font-semibold">Norms:</span> {draft.newCommunityScopePackage.norms.join(" · ")}</p>}
                    {draft.newCommunityScopePackage.welcomeMessage && <p className="mt-2"><span className="font-semibold">Welcome:</span> {draft.newCommunityScopePackage.welcomeMessage}</p>}
                    {draft.newCommunityScopePackage.starterPrompts.length > 0 && <p className="mt-1"><span className="font-semibold">Starter prompts:</span> {draft.newCommunityScopePackage.starterPrompts.join(" · ")}</p>}
                    <p className="mt-2 text-xs text-[var(--muted)]">Accepting creates a private pending community proposal. It is not launched, and nobody is notified or invited. A separate allowlisted launch reviewer must confirm human coverage before launch.</p>
                  </div>
                )}

                {change.reviewer_rationale && <p className="text-sm text-[var(--muted)]">Review note: {change.reviewer_rationale}</p>}
                {change.rollback_rationale && <p className="text-sm text-[var(--muted)]">Rollback note: {change.rollback_rationale}</p>}
                {change.status === "pending" && (
                  <div className="grid gap-2">
                    <label className="grid gap-1 text-sm font-semibold" htmlFor={`scope-review-note-${change.id}`}>
                      Review note (required)
                      <textarea
                        id={`scope-review-note-${change.id}`}
                        rows={2}
                        maxLength={1000}
                        value={rationales[change.id] ?? ""}
                        onChange={(event) => setRationales((current) => ({ ...current, [change.id]: event.target.value }))}
                        className="w-full rounded-lg border border-[var(--line)] bg-white p-3 text-sm font-normal"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy} onClick={() => void decide(change, "approved")} className="min-h-11 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {change.recommendation_kind === "split" ? "Create private proposal" : "Approve and apply scope"}
                      </button>
                      <button type="button" disabled={busy} onClick={() => void decide(change, "rejected")} className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
                        Reject suggestion
                      </button>
                    </div>
                  </div>
                )}
                {change.split_community_id && <p className="text-sm text-[var(--muted)]">Private pending proposal: {change.split_community_id}. Waiting for separate allowlisted launch review and human coverage confirmation; nobody was notified or invited.</p>}
                {change.status === "approved" && change.applied_at && !change.rolled_back_at && (
                  <div className="grid gap-2">
                    <label className="grid gap-1 text-sm font-semibold" htmlFor={`scope-rollback-note-${change.id}`}>
                      Rollback note (required to restore version {change.prior_scope.scopeVersion})
                      <textarea
                        id={`scope-rollback-note-${change.id}`}
                        rows={2}
                        maxLength={1000}
                        value={rationales[change.id] ?? ""}
                        onChange={(event) => setRationales((current) => ({ ...current, [change.id]: event.target.value }))}
                        className="w-full rounded-lg border border-[var(--line)] bg-white p-3 text-sm font-normal"
                      />
                    </label>
                    <div>
                      <button type="button" disabled={busy} onClick={() => void decide(change, "rollback")} className="min-h-11 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
                        Roll back this scope update
                      </button>
                    </div>
                  </div>
                )}
                {change.rolled_back_at && <p className="text-sm text-[var(--muted)]">Rolled back {new Date(change.rolled_back_at).toLocaleString()}.</p>}
              </article>
            );
          })}
        </div>
      )}

      <p className="text-xs text-[var(--muted)]">All scope changes need an active human moderator decision. No timeout approves a new community. High-risk suggestions remain advisory.</p>
    </section>
  );
}
