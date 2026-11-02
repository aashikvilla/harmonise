"use client";

import { useCallback, useEffect, useState } from "react";

type Helper = { displayName: string; status: "active" | "inactive"; disclosure: string };

export function CommunityHelperCard({ communityId }: { communityId: string }) {
  const [helper, setHelper] = useState<Helper | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/agent`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as { agent?: Helper } | null;
      if (!response.ok || !body?.agent?.displayName) return null;
      return body.agent;
    } catch {
      return null;
    }
  }, [communityId]);

  useEffect(() => {
    void load().then((result) => {
      setHelper(result);
      setState(result ? "ready" : "error");
    });
  }, [load]);

  async function retry() {
    setState("loading");
    const result = await load();
    setHelper(result);
    setState(result ? "ready" : "error");
  }

  if (state === "loading") return <section aria-busy="true" className="rounded-xl border border-[var(--line)] bg-[var(--lilac)] p-4">
    <p role="status" className="text-sm text-[var(--muted)]">Checking this community’s helper…</p>
  </section>;

  if (state === "error" || !helper) return <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
    <p className="text-sm">This community’s AI helper status is unavailable.</p>
    <button type="button" onClick={() => void retry()} className="mt-2 min-h-11 rounded-full px-3 text-sm font-semibold text-[var(--teal-dark)] underline underline-offset-2">Try again</button>
  </section>;

  return <section className="rounded-xl border border-[var(--line)] bg-[var(--lilac)] p-4 sm:p-5" aria-label="Community AI helper">
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="font-semibold">{helper.displayName}</h3>
      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">AI helper</span>
      <span className="text-sm text-[var(--muted)]">{helper.status === "active" ? "Configured" : "Paused"}</span>
    </div>
    <p className="mt-2 text-sm">{helper.disclosure}</p>
    <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
      It can flag queued content for a person to review. It cannot hide posts, remove members, or contact anyone. Human replies depend on people being available; a response time is not guaranteed.
    </p>
  </section>;
}
