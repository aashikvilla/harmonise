"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityProgressSummary } from "@/lib/community-progress";

const LEVEL_LABELS: Record<CommunityProgressSummary["level"], string> = {
  "new-member": "Getting started",
  contributor: "Contributor",
  "community-regular": "Community regular",
};

export function CommunityProgressCard({ communityId }: { communityId: string }) {
  const [progress, setProgress] = useState<CommunityProgressSummary | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  const load = useCallback(async (): Promise<CommunityProgressSummary | null> => {
    try {
      const response = await fetch(`/api/communities/${encodeURIComponent(communityId)}/progress`, {
        credentials: "include",
        cache: "no-store",
      });
      const body = (await response.json().catch(() => null)) as CommunityProgressSummary | null;
      if (!response.ok || !body || typeof body.contributions !== "number" || typeof body.activeDays !== "number") {
        return null;
      }
      return body;
    } catch {
      return null;
    }
  }, [communityId]);

  useEffect(() => {
    void load().then((body) => {
      setProgress(body);
      setState(body ? "ready" : "error");
    });
  }, [load]);

  async function retry() {
    setState("loading");
    const body = await load();
    setProgress(body);
    setState(body ? "ready" : "error");
  }

  if (state === "loading") {
    return <section aria-busy="true" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <p role="status" className="loading-skeleton text-sm text-[var(--muted)]">Loading your community activity…</p>
    </section>;
  }

  if (state === "error" || !progress) {
    return <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <h3 className="section-head">Community activity</h3>
      <p role="alert" className="mt-1 text-sm text-[var(--muted)]">Your activity level couldn&apos;t be loaded.</p>
      <button type="button" onClick={() => void retry()} className="mt-3 min-h-11 rounded-full bg-[var(--sage)] px-4 py-2 text-sm font-semibold focus-visible:outline">
        Try again
      </button>
    </section>;
  }

  const nextThreshold = progress.level === "new-member"
    ? progress.thresholds.contributor
    : progress.level === "contributor"
      ? progress.thresholds.communityRegular
      : null;
  const countRemaining = nextThreshold ? Math.max(0, nextThreshold.contributions - progress.contributions) : 0;
  const daysRemaining = nextThreshold ? Math.max(0, nextThreshold.activeDays - progress.activeDays) : 0;

  return <section aria-labelledby="community-progress-title" className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="page-kicker">YOUR COMMUNITY ACTIVITY</p>
        <h3 id="community-progress-title" className="section-head">{LEVEL_LABELS[progress.level]}</h3>
      </div>
      <span className="rounded-full bg-[var(--lilac)] px-3 py-1.5 text-sm font-semibold">{progress.contributions} contributions</span>
    </div>
    <p className="mt-3 text-sm text-[var(--muted)]">
      {progress.activeDays} active {progress.activeDays === 1 ? "day" : "days"} in this community · visible posts and replies
    </p>
    <button type="button" onClick={() => void retry()} className="mt-2 min-h-11 rounded-full px-3 text-sm font-semibold text-[var(--teal-dark)] underline underline-offset-2 focus-visible:outline">
      Refresh activity
    </button>
    {nextThreshold ? (
      <p className="mt-3 rounded-lg bg-[var(--paper)] p-3 text-sm">
        {countRemaining === 0 && daysRemaining === 0
          ? "You’ve reached the next activity level. Refresh to see it."
          : `Next level: ${countRemaining} more ${countRemaining === 1 ? "contribution" : "contributions"} and ${daysRemaining} more ${daysRemaining === 1 ? "active day" : "active days"}.`}
      </p>
    ) : (
      <p className="mt-3 rounded-lg bg-[var(--sage)] p-3 text-sm">You’ve reached the highest activity level currently shown.</p>
    )}
    {progress.verification.enabled && progress.verification.role && (
      <p className="mt-3 rounded-lg border border-[var(--line)] bg-white p-3 text-sm">
        <span className="font-semibold">Human-verified role:</span> {progress.verification.role}
      </p>
    )}
    <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">
      Only visible posts and replies with at least 20 trimmed characters count. Identical text, ignoring case and repeated whitespace, counts once across both. Active days use UTC calendar days. This is activity recognition only: it does not indicate trust, expertise, or skill, and it never grants a verified role. Levels are private to you and this community; there is no global ranking.
    </p>
  </section>;
}
