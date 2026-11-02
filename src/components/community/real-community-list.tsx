"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { overlappingThemes, THEME_LABELS } from "@/lib/community-topics";

type Community = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "member";
  memberCount: number;
  postCount: number;
};

async function getJson<T>(path: string): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, { credentials: "include" });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

export default function RealCommunityList() {
  const [state, setState] = useState<"loading" | "unavailable" | "error" | "ready">("loading");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [confirmedThemes] = useState<string[]>(() =>
    typeof window === "undefined"
      ? []
      : (new URLSearchParams(window.location.search).get("themes")?.split(",").map((theme) => theme.trim()).filter(Boolean) ?? []),
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await getJson<{ databaseEnabled?: unknown }>("/api/auth/config");
      if (cancelled) return;
      if (config.body?.databaseEnabled !== true) {
        setState("unavailable");
        return;
      }
      const list = await getJson<{ communities?: Community[] }>("/api/communities");
      if (cancelled) return;
      if (list.status === 200 && Array.isArray(list.body?.communities)) {
        setCommunities(list.body.communities);
        setState("ready");
      } else {
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return <p role="status" className="text-[var(--muted)]">Loading communities…</p>;
  }

  if (state === "unavailable") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold">Real communities aren&apos;t connected yet</h2>
        <p className="mt-2 text-[var(--muted)]">
          This space shows live communities once the database is connected. Nothing here is simulated: no sample
          members, no invented posts.
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" role="alert">
        <h2 className="text-xl font-semibold">Communities couldn&apos;t be loaded</h2>
        <p className="mt-2 text-[var(--muted)]">Check your connection and try again.</p>
        <button
          type="button"
          className="mt-4 rounded-full bg-[var(--ink)] px-5 py-2.5 text-white"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold">No communities yet</h2>
        <p className="mt-2 text-[var(--muted)]">
          No one has opened a community here. When one opens, it will appear with real member and post counts.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {communities.map((community) => (
        <li key={community.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-hover)]">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide">
            <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-[var(--sage-ink)]">
              {community.visibility === "public" ? "Public" : "Members only"}
            </span>
            <span className="text-[var(--muted)]">
              {community.memberCount} {community.memberCount === 1 ? "member" : "members"} · {community.postCount}{" "}
              {community.postCount === 1 ? "post" : "posts"}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-semibold">{community.name}</h2>
          <p className="mt-1 text-[var(--muted)]">{community.description || "No description yet."}</p>
          {confirmedThemes.length > 0 &&
            (() => {
              const overlap = overlappingThemes(community.id, confirmedThemes);
              return overlap.length > 0 ? (
                <p className="mt-2 text-sm">
                  Related to themes you confirmed: {overlap.map((theme) => THEME_LABELS[theme] ?? theme).join(", ")}.
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--muted)]">Not related to your confirmed themes — shown for browsing.</p>
              );
            })()}
          <Link
            href={`/communities/${community.id}`}
            className="mt-4 inline-block rounded-full bg-[var(--ink)] px-5 py-2.5 text-white"
          >
            View community
          </Link>
        </li>
      ))}
    </ul>
  );
}
