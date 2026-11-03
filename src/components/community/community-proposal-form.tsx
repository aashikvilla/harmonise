"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthCard from "@/components/account/auth-card";

type Proposal = {
  community?: { id: string; name: string; launch_status: string };
  agent?: { displayName: string; status: string };
};

type SetupDraft = {
  description: string;
  includedTopics: string[];
  adjacentTopics: string[];
  outOfScope: string[];
  norms: string[];
  welcomeMessage: string;
  starterPrompts: string[];
  communityFit: {
    kind: "fits-existing" | "distinct-community" | "human-review";
    candidateIds: string[];
    explanation: string;
  };
};

type SetupAssistResponse = {
  draft?: SetupDraft;
  matchingCommunities?: Array<{ id: string; name: string; description: string }>;
  error?: string;
};

export default function CommunityProposalForm() {
  const [state, setState] = useState<"loading" | "unavailable" | "signed-out" | "ready" | "submitting" | "submitted" | "error">("loading");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");
  const [assistState, setAssistState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [assistError, setAssistError] = useState("");
  const [assistDraft, setAssistDraft] = useState<SetupAssistResponse | null>(null);
  const [scopeReviewConfirmed, setScopeReviewConfirmed] = useState(false);
  const [scopeEditError, setScopeEditError] = useState("");

  async function checkSession() {
    const config = await fetch("/api/auth/config", { credentials: "include" }).then((response) => response.json()).catch(() => null) as { databaseEnabled?: unknown } | null;
    if (config?.databaseEnabled !== true) {
      setState("unavailable");
      return;
    }
    const response = await fetch("/api/auth/me", { credentials: "include" }).catch(() => null);
    setState(response?.status === 200 ? "ready" : "signed-out");
  }

  useEffect(() => {
    void (async () => {
      await checkSession();
    })();
  }, []);

  async function draftWithMeta() {
    setAssistState("loading");
    setAssistError("");
    setScopeEditError("");
    setScopeReviewConfirmed(false);
    try {
      const response = await fetch("/api/communities/propose/assist", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          topics: topics.split(",").map((topic) => topic.trim()).filter(Boolean),
        }),
        signal: AbortSignal.timeout(45_000),
      });
      const body = await response.json().catch(() => null) as SetupAssistResponse | null;
      if (response.status === 401) {
        setState("signed-out");
        setAssistState("idle");
        return;
      }
      if (!response.ok || !body?.draft) {
        setAssistError(response.status === 429
          ? "You’ve reached the short-term drafting limit. Your proposal is unchanged."
          : "The AI draft isn’t available right now. Your proposal is unchanged; you can continue without it.");
        setAssistState("error");
        return;
      }
      setAssistDraft(body);
      setAssistState("ready");
    } catch {
      setAssistError("We couldn’t reach the drafting service. Your proposal is unchanged; you can try again or continue without it.");
      setAssistState("error");
    }
  }

  function updateScopeDraft(update: (draft: SetupDraft) => SetupDraft) {
    setAssistDraft((current) => current?.draft ? { ...current, draft: update(current.draft) } : current);
    setScopeReviewConfirmed(false);
    setScopeEditError("");
  }

  function updateScopeDescription(value: string) {
    setDescription(value);
    updateScopeDraft((draft) => ({ ...draft, description: value }));
  }

  function updateScopeIncludedTopics(value: string) {
    setTopics(value);
    updateScopeDraft((draft) => ({ ...draft, includedTopics: value.split(",").map((topic) => topic.trim()) }));
  }

  function reviewedScopeDraft() {
    if (!assistDraft?.draft) return null;
    const draft = assistDraft.draft;
    const includedTopics = draft.includedTopics.map((item) => item.trim()).filter(Boolean);
    const adjacentTopics = draft.adjacentTopics.map((item) => item.trim()).filter(Boolean);
    const outOfScopeTopics = draft.outOfScope.map((item) => item.trim()).filter(Boolean);
    const norms = draft.norms.map((item) => item.trim()).filter(Boolean);
    const starterPrompts = draft.starterPrompts.map((item) => item.trim()).filter(Boolean);
    const validItems = (items: string[], min: number, max: number, maxLength: number) =>
      items.length >= min && items.length <= max && items.every((item) => item.length <= maxLength);
    if (!validItems(includedTopics, 1, 8, 36)
      || !validItems(adjacentTopics, 0, 6, 60)
      || !validItems(outOfScopeTopics, 0, 6, 100)
      || !validItems(norms, 3, 6, 160)
      || draft.welcomeMessage.trim().length < 1
      || draft.welcomeMessage.trim().length > 400
      || !validItems(starterPrompts, 2, 4, 160)) return null;
    return {
      includedTopics,
      adjacentTopics,
      outOfScopeTopics,
      norms,
      welcomeMessage: draft.welcomeMessage.trim(),
      starterPrompts,
    };
  }

  function confirmScopeReview(checked: boolean) {
    if (!checked) {
      setScopeReviewConfirmed(false);
      setScopeEditError("");
      return;
    }
    if (!reviewedScopeDraft()) {
      setScopeReviewConfirmed(false);
      setScopeEditError("Check that the scope has 1–8 included topics, 3–6 norms, 2–4 starter prompts, and no item exceeds its length limit.");
      return;
    }
    setScopeEditError("");
    setScopeReviewConfirmed(true);
  }

  function invalidateDraft() {
    setAssistDraft(null);
    setAssistState("idle");
    setAssistError("");
    setScopeReviewConfirmed(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scopeDraft = scopeReviewConfirmed ? reviewedScopeDraft() : null;
    if (scopeReviewConfirmed && !scopeDraft) {
      setScopeReviewConfirmed(false);
      setScopeEditError("Check that the scope has 1–8 included topics, 3–6 norms, 2–4 starter prompts, and no item exceeds its length limit.");
      return;
    }
    setState("submitting");
    setError("");
    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          topics: topics.split(",").map((topic) => topic.trim()).filter(Boolean),
          ...(scopeDraft ? { scopeDraft } : {}),
        }),
      });
      const body = await response.json().catch(() => null) as Proposal & { error?: string } | null;
      if (response.status === 401) {
        setState("signed-out");
      } else if (response.ok && body?.community) {
        setProposal(body);
        setState("submitted");
      } else {
        setError(response.status === 429 ? "Too many proposals in a short time. Please try again later." : "We couldn’t send this proposal. Please check the details and try again.");
        setState("ready");
      }
    } catch {
      setError("We couldn’t reach the community service. Check your connection and try again.");
      setState("ready");
    }
  }

  if (state === "loading") return <p role="status" className="loading-skeleton text-[var(--muted)]">Checking your sign-in…</p>;

  if (state === "unavailable") {
    return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" role="status">
      <h2 className="section-head">Community creation isn’t connected yet</h2>
      <p className="mt-2 text-[var(--muted)]">The live community service is unavailable right now. Your proposal has not been saved.</p>
    </section>;
  }

  if (state === "submitted" && proposal?.community) {
    return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" aria-live="polite">
      <span className="inline-flex rounded-full bg-[var(--peach)] px-3 py-1 text-sm font-semibold">Waiting for human review</span>
      <h2 className="mt-4 text-2xl font-semibold">{proposal.community.name}</h2>
      <p className="mt-2 text-[var(--muted)]">Your community is a private proposal for now. A person must review its purpose and coverage before anyone else can find or join it.</p>
      {proposal.agent && <p className="mt-4 rounded-xl bg-[var(--lilac)] p-4 text-sm"><strong>{proposal.agent.displayName}</strong> is provisioned for this community. It can flag content for a human reviewer; it cannot hide posts, remove people, or contact members.</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link className="button button-primary" href={`/communities/${proposal.community.id}`}>View your proposal</Link>
        <Link className="button button-secondary" href="/communities">Back to communities</Link>
      </div>
    </section>;
  }

  return <div className="space-y-5">
    {state === "signed-out" ? (
      <AuthCard heading="Sign in to suggest a community" onSignedIn={() => void checkSession()} />
    ) : (
      <>
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[var(--muted)]">A short description helps a human review whether this community has a clear scope and can be supported. We won’t copy anything from your private chat.</p>
          <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-name">Community name</label>
              <input id="proposal-name" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" minLength={3} maxLength={70} required value={name} onChange={(event) => { setName(event.target.value); invalidateDraft(); }} placeholder="A welcoming name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-purpose">What would people come together around?</label>
              <textarea id="proposal-purpose" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" minLength={20} maxLength={500} required rows={4} value={description} onChange={(event) => { setDescription(event.target.value); invalidateDraft(); }} placeholder="Share the purpose and the kind of support members can offer." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-topics">Topics <span className="font-normal text-[var(--muted)]">(optional, comma separated)</span></label>
              <input id="proposal-topics" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" maxLength={320} value={topics} onChange={(event) => { setTopics(event.target.value); invalidateDraft(); }} placeholder="Starting over, finding support" />
            </div>
            <div className="rounded-xl border border-[var(--line)] bg-[var(--lilac)] p-4">
              <p className="text-sm leading-relaxed">If you choose “Draft with Meta,” the community name, purpose, topics, and approved community descriptions/topics are sent to Meta to prepare suggestions. Private chat and member posts are not included.</p>
              <button className="button button-secondary mt-3" disabled={state !== "ready" || assistState === "loading" || name.trim().length < 3 || description.trim().length < 20} onClick={() => void draftWithMeta()} type="button">
                {assistState === "loading" ? "Preparing a draft…" : assistDraft ? "Draft again with Meta" : "Draft with Meta"}
              </button>
              {assistState === "loading" && <p className="mt-2 text-sm" role="status">Preparing editable scope suggestions. Nothing is being saved.</p>}
              {assistState === "error" && <p className="mt-2 text-sm" role="alert">{assistError}</p>}
            </div>
            {assistState === "ready" && assistDraft?.draft && <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-labelledby="community-draft-title">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">AI-generated · editable draft</p>
                  <h2 id="community-draft-title" className="section-head mt-1">Community scope suggestions</h2>
                </div>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-description">Purpose and description</label>
                  <textarea id="scope-description" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={3} maxLength={500} value={assistDraft.draft.description} onChange={(event) => updateScopeDescription(event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-included-topics">Included topics <span className="font-normal text-[var(--muted)]">(comma separated)</span></label>
                  <textarea id="scope-included-topics" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={2} value={assistDraft.draft.includedTopics.join(", ")} onChange={(event) => updateScopeIncludedTopics(event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-adjacent-topics">Adjacent topics <span className="font-normal text-[var(--muted)]">(one per line)</span></label>
                  <textarea id="scope-adjacent-topics" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={3} value={assistDraft.draft.adjacentTopics.join("\n")} onChange={(event) => updateScopeDraft((draft) => ({ ...draft, adjacentTopics: event.target.value.split("\n") }))} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-out-of-scope">Outside this community <span className="font-normal text-[var(--muted)]">(one per line)</span></label>
                  <textarea id="scope-out-of-scope" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={3} value={assistDraft.draft.outOfScope.join("\n")} onChange={(event) => updateScopeDraft((draft) => ({ ...draft, outOfScope: event.target.value.split("\n") }))} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-norms">Possible community norms <span className="font-normal text-[var(--muted)]">(one per line)</span></label>
                  <textarea id="scope-norms" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={4} value={assistDraft.draft.norms.join("\n")} onChange={(event) => updateScopeDraft((draft) => ({ ...draft, norms: event.target.value.split("\n") }))} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-welcome">Welcome message</label>
                  <textarea id="scope-welcome" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={3} maxLength={400} value={assistDraft.draft.welcomeMessage} onChange={(event) => updateScopeDraft((draft) => ({ ...draft, welcomeMessage: event.target.value }))} />
                </div>
                <div>
                  <label className="mb-1 block font-semibold" htmlFor="scope-starter-prompts">Starter prompts <span className="font-normal text-[var(--muted)]">(one per line)</span></label>
                  <textarea id="scope-starter-prompts" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" rows={4} value={assistDraft.draft.starterPrompts.join("\n")} onChange={(event) => updateScopeDraft((draft) => ({ ...draft, starterPrompts: event.target.value.split("\n") }))} />
                </div>
                <div className="rounded-xl bg-[var(--peach)] p-3">
                  <strong>{assistDraft.draft.communityFit.kind === "fits-existing" ? "This may fit an existing community" : assistDraft.draft.communityFit.kind === "distinct-community" ? "This may be a distinct community" : "A person should compare the scopes"}</strong>
                  <p className="mt-1">{assistDraft.draft.communityFit.explanation}</p>
                  {assistDraft.matchingCommunities?.map((community) => <p className="mt-2" key={community.id}><Link className="underline" href={`/communities/${community.id}`}>{community.name}</Link><span className="text-[var(--muted)]"> — {community.description}</span></p>)}
                </div>
              </div>
              <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs leading-relaxed text-[var(--muted)]">These are suggestions, not approval or final policy. If you include them, the scope package is submitted for human review with your proposal. The community stays private until a person reviews its boundaries and confirms coverage.</p>
              <label className="mt-4 flex min-h-11 items-start gap-3 border-t border-[var(--line)] pt-3 text-sm leading-relaxed">
                <input className="mt-1 h-4 w-4 shrink-0 accent-[var(--coral)]" type="checkbox" checked={scopeReviewConfirmed} onChange={(event) => confirmScopeReview(event.target.checked)} />
                <span>I reviewed these scope suggestions and want to include the current edited version with my proposal for human review.</span>
              </label>
              {scopeEditError && <p className="mt-2 text-sm" role="alert">{scopeEditError}</p>}
            </section>}
            {error && <p className="rounded-xl bg-[var(--peach)] p-3 text-sm" role="alert">{error}</p>}
            <button className="button button-primary" disabled={state === "submitting"} type="submit">{state === "submitting" ? "Sending for review…" : "Suggest this community"}</button>
          </form>
        </section>
        <p className="text-sm text-[var(--muted)]">Every proposal stays private until a human approves its boundaries and confirms that people can look after it.</p>
      </>
    )}
  </div>;
}
