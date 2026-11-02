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

  function applyDraft() {
    if (!assistDraft?.draft) return;
    setDescription(assistDraft.draft.description);
    setTopics(assistDraft.draft.includedTopics.join(", "));
    setScopeReviewConfirmed(false);
  }

  function invalidateDraft() {
    setAssistDraft(null);
    setAssistState("idle");
    setAssistError("");
    setScopeReviewConfirmed(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          ...(scopeReviewConfirmed && assistDraft?.draft ? {
            scopeDraft: {
              includedTopics: assistDraft.draft.includedTopics,
              adjacentTopics: assistDraft.draft.adjacentTopics,
              outOfScopeTopics: assistDraft.draft.outOfScope,
              norms: assistDraft.draft.norms,
              welcomeMessage: assistDraft.draft.welcomeMessage,
              starterPrompts: assistDraft.draft.starterPrompts,
            },
          } : {}),
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

  if (state === "loading") return <p role="status" className="text-[var(--muted)]">Checking your sign-in…</p>;

  if (state === "unavailable") {
    return <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" role="status">
      <h2 className="text-xl font-semibold">Community creation isn’t connected yet</h2>
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
              <input id="proposal-topics" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" maxLength={180} value={topics} onChange={(event) => { setTopics(event.target.value); invalidateDraft(); }} placeholder="Starting over, finding support" />
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
                  <h2 id="community-draft-title" className="mt-1 text-xl font-semibold">Community scope suggestions</h2>
                </div>
                <button type="button" className="button button-secondary" onClick={applyDraft}>Use description and topics</button>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <p><strong>Suggested purpose:</strong> {assistDraft.draft.description}</p>
                <div><strong>Included topics</strong><p className="mt-1">{assistDraft.draft.includedTopics.join(" · ")}</p></div>
                {assistDraft.draft.adjacentTopics.length > 0 && <div><strong>Could be adjacent</strong><p className="mt-1">{assistDraft.draft.adjacentTopics.join(" · ")}</p></div>}
                {assistDraft.draft.outOfScope.length > 0 && <div><strong>May be outside this community</strong><p className="mt-1">{assistDraft.draft.outOfScope.join(" · ")}</p></div>}
                <div><strong>Possible community norms</strong><ul className="mt-1 list-disc space-y-1 pl-5">{assistDraft.draft.norms.map((norm) => <li key={norm}>{norm}</li>)}</ul></div>
                <div><strong>Welcome message</strong><p className="mt-1">{assistDraft.draft.welcomeMessage}</p></div>
                <div><strong>Starter prompts</strong><ul className="mt-1 list-disc space-y-1 pl-5">{assistDraft.draft.starterPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul></div>
                <div className="rounded-xl bg-[var(--peach)] p-3">
                  <strong>{assistDraft.draft.communityFit.kind === "fits-existing" ? "This may fit an existing community" : assistDraft.draft.communityFit.kind === "distinct-community" ? "This may be a distinct community" : "A person should compare the scopes"}</strong>
                  <p className="mt-1">{assistDraft.draft.communityFit.explanation}</p>
                  {assistDraft.matchingCommunities?.map((community) => <p className="mt-2" key={community.id}><Link className="underline" href={`/communities/${community.id}`}>{community.name}</Link><span className="text-[var(--muted)]"> — {community.description}</span></p>)}
                </div>
              </div>
              <p className="mt-4 border-t border-[var(--line)] pt-3 text-xs leading-relaxed text-[var(--muted)]">These are suggestions, not approval or final policy. If you include them, the scope package is submitted for human review with your proposal. The community stays private until a person reviews its boundaries and confirms coverage.</p>
              <label className="mt-4 flex min-h-11 items-start gap-3 border-t border-[var(--line)] pt-3 text-sm leading-relaxed">
                <input className="mt-1 h-4 w-4 shrink-0 accent-[var(--coral)]" type="checkbox" checked={scopeReviewConfirmed} onChange={(event) => setScopeReviewConfirmed(event.target.checked)} />
                <span>I reviewed these scope suggestions and want to include them with my proposal for human review.</span>
              </label>
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
