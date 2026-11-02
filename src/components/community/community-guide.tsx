"use client";

import { useState, type FormEvent } from "react";

type GuideResponse = { decision?: "answer" | "out_of_scope" | "urgent"; answer?: string; error?: string };

type Props = { communityId: string; communityName: string };

export function CommunityGuide({ communityId, communityName }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [decision, setDecision] = useState<GuideResponse["decision"]>();
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || state === "loading") return;

    setState("loading");
    setErrorMessage("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/guide`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const body = (await response.json().catch(() => null)) as GuideResponse | null;
      if (response.ok && body?.answer && body.decision) {
        setAnswer(body.answer);
        setDecision(body.decision);
        setState("ready");
        return;
      }

      setState("error");
      setErrorMessage(
        response.status === 401
          ? "Sign in again to use this guide."
          : response.status === 403
            ? "Join this community to use its guide."
            : response.status === 429
              ? "You’ve reached the guide’s request limit for now. Try again later."
              : body?.error === "guide-paused"
                ? "This community’s AI guide is paused right now."
                : "The guide couldn’t answer just now. Your question is still here so you can retry.",
      );
    } catch {
      setState("error");
      setErrorMessage("The guide couldn’t connect. Your question is still here so you can retry.");
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--lilac)] p-5 shadow-[var(--shadow-soft)] sm:p-6" aria-labelledby="community-guide-title">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="community-guide-title" className="text-lg font-semibold">Ask this community’s AI guide</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">Private reply</span>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Ask about {communityName}’s purpose, included or adjacent topics, or community norms. The guide uses this community’s approved scope package and public details; it does not read member posts or your private chats.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        When you ask, your question, approved scope package, and public community details are sent to Meta AI for a response. Avoid names or details that identify you. The guide is not a human moderator or professional service, and no one is alerted by your question.
      </p>
      <form onSubmit={(event) => void ask(event)} className="mt-4 grid gap-3">
        <label htmlFor={`guide-question-${communityId}`} className="text-sm font-semibold">What would you like to know?</label>
        <textarea
          id={`guide-question-${communityId}`}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1200}
          rows={3}
          disabled={state === "loading"}
          className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-dark)] disabled:opacity-70"
          placeholder="For example: what kinds of conversations fit here, and what is outside the scope?"
          aria-describedby={`guide-help-${communityId}`}
        />
        <div id={`guide-help-${communityId}`} className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted)]">
          <span>{question.length}/1200 characters</span>
          <button
            type="submit"
            disabled={!question.trim() || state === "loading"}
            className="min-h-11 rounded-full bg-[var(--teal)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--teal-dark)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--teal-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "loading" ? "Asking…" : state === "error" ? "Try again" : "Ask privately"}
          </button>
        </div>
      </form>
      {state === "loading" && <p className="mt-4 text-sm text-[var(--muted)]" role="status">Checking this community’s scope…</p>}
      {state === "error" && (
        <p className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-sm" role="alert">{errorMessage}</p>
      )}
      {state === "ready" && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4" aria-live="polite">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{answer}</p>
          {decision === "answer" && <p className="mt-3 text-xs text-[var(--muted)]">Based only on this community’s approved scope and public details.</p>}
          {decision === "urgent" && (
            <p className="mt-3 text-xs text-[var(--muted)]">
              This guide did not send your question to Meta. Find a verified local helpline at{" "}
              <a href="https://findahelpline.com/" target="_blank" rel="noreferrer" className="underline underline-offset-2">
                findahelpline.com
              </a>.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
