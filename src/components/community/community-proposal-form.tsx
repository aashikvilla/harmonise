"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AuthCard from "@/components/account/auth-card";

type Proposal = {
  community?: { id: string; name: string; launch_status: string };
  agent?: { displayName: string; status: string };
};

export default function CommunityProposalForm() {
  const [state, setState] = useState<"loading" | "unavailable" | "signed-out" | "ready" | "submitting" | "submitted" | "error">("loading");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState("");

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
          <p className="text-sm text-[var(--muted)]">A short description helps a human review whether this is a safe, useful space. We won’t copy anything from your private chat.</p>
          <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-name">Community name</label>
              <input id="proposal-name" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" minLength={3} maxLength={70} required value={name} onChange={(event) => setName(event.target.value)} placeholder="A welcoming name" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-purpose">What would people come together around?</label>
              <textarea id="proposal-purpose" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" minLength={20} maxLength={500} required rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Share the purpose and the kind of support members can offer." />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="proposal-topics">Topics <span className="font-normal text-[var(--muted)]">(optional, comma separated)</span></label>
              <input id="proposal-topics" className="w-full rounded-xl border border-[var(--line)] bg-white px-4 py-3" maxLength={180} value={topics} onChange={(event) => setTopics(event.target.value)} placeholder="Starting over, finding support" />
            </div>
            {error && <p className="rounded-xl bg-[var(--peach)] p-3 text-sm" role="alert">{error}</p>}
            <button className="button button-primary" disabled={state === "submitting"} type="submit">{state === "submitting" ? "Sending for review…" : "Suggest this community"}</button>
          </form>
        </section>
        <p className="text-sm text-[var(--muted)]">Every proposal stays private until a human approves its boundaries and confirms that people can look after it.</p>
      </>
    )}
  </div>;
}
