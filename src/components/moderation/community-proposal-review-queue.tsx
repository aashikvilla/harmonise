"use client";

import { useCallback, useEffect, useState } from "react";

type Proposal = { id: string; name: string; purpose: string; topics: string[]; createdAt: string };

export default function CommunityProposalReviewQueue() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "hidden">("loading");
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [declining, setDeclining] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/communities/review", { credentials: "include", cache: "no-store" });
      if (response.status === 401 || response.status === 403) {
        setState("hidden");
        return;
      }
      const body = (await response.json().catch(() => null)) as { proposals?: Proposal[] } | null;
      if (!response.ok || !Array.isArray(body?.proposals)) {
        setState("unavailable");
        return;
      }
      setProposals(body.proposals);
      setState("ready");
    } catch {
      setState("unavailable");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function approve(proposal: Proposal) {
    if (!confirmed[proposal.id]) return;
    setBusyId(proposal.id);
    setNotice("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(proposal.id)}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverageConfirmed: true }),
      });
      if (response.ok) {
        setProposals((items) => items.filter((item) => item.id !== proposal.id));
        setConfirmed((items) => ({ ...items, [proposal.id]: false }));
        setNotice(`${proposal.name} is approved for launch. The reviewing moderator is assigned to the community.`);
      } else if (response.status === 409 || response.status === 404) {
        setNotice("This proposal is no longer waiting for review. Refresh the queue.");
      } else {
        setNotice("The proposal could not be approved. Try again or check reviewer access.");
      }
    } catch {
      setNotice("The review service is unavailable. Your decision was not confirmed.");
    } finally {
      setBusyId("");
    }
  }

  async function decline(proposal: Proposal) {
    if (!message.trim()) {
      setNotice("Write a kind note first — the proposer reads it.");
      return;
    }
    setBusyId(proposal.id);
    setNotice("");
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(proposal.id)}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: "declined", message: message.trim() }),
      });
      if (response.ok) {
        setProposals((items) => items.filter((item) => item.id !== proposal.id));
        setDeclining("");
        setMessage("");
        setNotice(`${proposal.name} was declined with your note. Suggest an existing circle where it fits.`);
      } else {
        setNotice("The proposal could not be declined. Try again or check reviewer access.");
      }
    } catch {
      setNotice("The review service is unavailable. Your decision was not confirmed.");
    } finally {
      setBusyId("");
    }
  }

  if (state === "hidden") return null;

  return <section aria-labelledby="community-proposals-heading" className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="page-kicker">LAUNCH REVIEW</p>
        <h2 id="community-proposals-heading" className="serif-head text-xl">Community proposals</h2>
      </div>
      {state === "ready" && <span className="rounded-full bg-[var(--peach)] px-3 py-1 text-sm">{proposals.length} waiting</span>}
    </div>
    <p className="mt-2 text-sm text-[var(--muted)]">Only approve after confirming that a named person will cover moderation and escalation. The AI helper does not count as human coverage.</p>
    {notice && <p role="status" className="mt-3 rounded-lg bg-[var(--sage)] p-3 text-sm">{notice}</p>}
    {state === "loading" && <p role="status" className="mt-4 text-sm text-[var(--muted)]">Loading proposals…</p>}
    {state === "unavailable" && <div className="mt-4 text-sm">
      <p role="alert">Proposals couldn&apos;t be loaded.</p>
      <button type="button" onClick={() => { setState("loading"); void load(); }} className="mt-2 min-h-11 underline">Try again</button>
    </div>}
    {state === "ready" && proposals.length === 0 && <p className="mt-4 text-sm text-[var(--muted)]">No community proposals are waiting.</p>}
    {state === "ready" && proposals.length > 0 && <ul className="mt-4 grid gap-3">
      {proposals.map((proposal) => <li key={proposal.id} className="rounded-xl border border-[var(--line)] bg-white p-4 sm:p-5">
        <p className="text-xs text-[var(--muted)]">Submitted {new Date(proposal.createdAt).toLocaleDateString()}</p>
        <h3 className="mt-1 text-lg font-semibold">{proposal.name}</h3>
        <p className="mt-2 text-sm">{proposal.purpose}</p>
        {proposal.topics.length > 0 && <p className="mt-2 text-sm text-[var(--muted)]">Topics: {proposal.topics.join(", ")}</p>}
        <label className="mt-4 flex min-h-11 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={confirmed[proposal.id] ?? false} onChange={(event) => setConfirmed((items) => ({ ...items, [proposal.id]: event.target.checked }))} />
          <span>I have confirmed a named human moderator and coverage for this community.</span>
        </label>
        <button type="button" disabled={!confirmed[proposal.id] || Boolean(busyId)} onClick={() => void approve(proposal)} className="button button-primary mt-2">
          {busyId === proposal.id ? "Approving…" : "Approve community launch"}
        </button>
        {declining === proposal.id ? (
          <div className="mt-3 rounded-lg bg-[var(--lilac)] p-3">
            <label className="block text-sm font-semibold" htmlFor={`decline-note-${proposal.id}`}>
              Kind note to the proposer (required — name a circle to join instead where one fits)
            </label>
            <textarea
              id={`decline-note-${proposal.id}`}
              rows={3}
              maxLength={1000}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" disabled={Boolean(busyId)} onClick={() => void decline(proposal)} className="button button-primary">
                {busyId === proposal.id ? "Declining…" : "Decline with note"}
              </button>
              <button type="button" onClick={() => { setDeclining(""); setMessage(""); }} className="min-h-11 text-sm underline">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" disabled={Boolean(busyId)} onClick={() => setDeclining(proposal.id)} className="mt-2 min-h-11 text-sm underline">
            Decline with a kind note…
          </button>
        )}
      </li>)}
    </ul>}
  </section>;
}
