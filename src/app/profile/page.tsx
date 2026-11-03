"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductHeader from "@/components/product-header";

type Contribution = {
  communityId: string;
  communityName: string;
  alias: string;
  role: string;
  posts: Array<{ id: string; body: string; status: string; createdAt: string; replyCount: number; thanks: number }>;
  replies: number;
  thanksReceived: number;
  level: string;
};

type Notification = {
  id: string;
  kind: "reply" | "decision" | "appeal";
  communityName: string;
  text: string;
  createdAt: string;
  link: string;
};

type Promotion = {
  id: string;
  community_id: string;
  requested_role: string;
  note: string;
  status: string;
  reviewer_rationale: string;
  created_at: string;
};

const RUNGS: Array<{ name: string; rule: string }> = [
  { name: "New member", rule: "Joined — read quietly as long as you like." },
  { name: "Contributor", rule: "3 distinct contributions across 2 different days." },
  { name: "Community regular", rule: "10 distinct contributions across 5 different days." },
  { name: "Trusted", rule: "Human-reviewed: steady helpful presence, endorsed by a moderator." },
  { name: "Volunteer", rule: "Human-reviewed: welcome duty + unanswered-question duty, training checklist, 3-month terms." },
  { name: "Verified supporter", rule: "Human-reviewed + identity-verified off-platform. Peer support only — never clinical or legal." },
];

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(path, { credentials: "include", cache: "no-store" });
    return (await response.json().catch(() => null)) as T | null;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const [contributions, setContributions] = useState<Contribution[] | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profileStatus, setProfileStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [profileUserId, setProfileUserId] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [promotions, setPromotions] = useState<Record<string, Promotion[]>>({});
  const [requesting, setRequesting] = useState<{ communityId: string; role: string } | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [seenAt, setSeenAt] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const meResponse = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (meResponse.status === 401) {
          if (!cancelled) setProfileStatus("signed-out");
          return;
        }
        if (!meResponse.ok) throw new Error("Sign-in status unavailable");
        const me = (await meResponse.json()) as { id?: unknown };
        if (typeof me.id !== "string") throw new Error("Invalid account response");
        const seenKey = `harmonise-notif-seen:${me.id}`;
        const seen = window.localStorage.getItem(seenKey) ?? "";
        const [mineResponse, notificationsResponse] = await Promise.all([
          fetch("/api/account/contributions", { cache: "no-store", credentials: "include" }),
          fetch("/api/account/notifications", { cache: "no-store", credentials: "include" }),
        ]);
        if (!mineResponse.ok || !notificationsResponse.ok) throw new Error("Profile data unavailable");
        const [mine, notifs] = await Promise.all([
          mineResponse.json() as Promise<{ contributions?: Contribution[] }>,
          notificationsResponse.json() as Promise<{ notifications?: Notification[] }>,
        ]);
        if (cancelled) return;
        setProfileUserId(me.id);
        setSeenAt(seen);
        setContributions(Array.isArray(mine.contributions) ? mine.contributions : []);
        setNotifications(Array.isArray(notifs.notifications) ? notifs.notifications : []);
        setProfileStatus("ready");
      } catch {
        if (!cancelled) setProfileStatus("error");
      }
    })();
    return () => { cancelled = true; };
  }, [retryKey]);

  useEffect(() => {
    if (profileStatus !== "ready" || !profileUserId) return;
    window.localStorage.setItem(`harmonise-notif-seen:${profileUserId}`, new Date().toISOString());
  }, [profileStatus, profileUserId]);

  useEffect(() => {
    if (!contributions) return;
    void (async () => {
      const entries = await Promise.all(
        contributions.map(async (entry) => {
          const data = await getJson<{ requests?: Promotion[] }>(
            `/api/communities/${entry.communityId}/promotions`,
          );
          return [entry.communityId, data?.requests ?? []] as const;
        }),
      );
      setPromotions(Object.fromEntries(entries));
    })();
  }, [contributions]);

  const unread = notifications.filter((item) => !seenAt || item.createdAt > seenAt).length;

  async function submitPromotion() {
    if (!requesting) return;
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`/api/communities/${requesting.communityId}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedRole: requesting.role, note }),
      });
      const data = (await res.json().catch(() => null)) as { request?: Promotion; error?: string } | null;
      if (res.ok && data?.request) {
        setPromotions((current) => ({
          ...current,
          [requesting.communityId]: [data.request as Promotion, ...(current[requesting.communityId] ?? [])],
        }));
        setNotice("Request sent. A moderator will review it with a written rationale.");
        setRequesting(null);
        setNote("");
      } else if (res.status === 409) {
        setNotice("You already have an open request here. A moderator will review it.");
      } else {
        setNotice("The request could not be sent. Try again.");
      }
    } catch {
      setNotice("The request could not be sent. Try again.");
    }
    setBusy(false);
  }

  return (
    <div className="product-page">
      <ProductHeader current="profile" />
      <main className="product-page-content flex max-w-3xl flex-col gap-6">
      <p className="product-page-kicker">Your place to pick up again</p>
      <h1 className="serif-head">Your profile</h1>
      <p className="text-sm text-[var(--muted)]">
        Private to you. Other members only ever see your per-community alias and standing badge.
      </p>
      {notice && <p className="rounded-2xl bg-[var(--lilac)] p-4 text-sm">{notice}</p>}

      {profileStatus === "signed-out" && <p className="state-card text-sm">Sign in to see your circles and private notifications. <Link href="/connect" className="underline">Continue to sign in.</Link></p>}
      {profileStatus === "error" && <p role="alert" className="state-card text-sm">Your profile could not be loaded. Your circles and notifications are not being shown as empty. <button type="button" className="underline" onClick={() => { setProfileStatus("loading"); setRetryKey((key) => key + 1); }}>Try again</button></p>}

      <section className="product-page-card rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-label="Notifications">
        <h2 className="section-head">
          Notifications{unread > 0 ? ` (${unread} new)` : ""}
        </h2>
        {profileStatus === "loading" ? <p className="loading-skeleton mt-2 text-sm" role="status">Loading your notifications…</p> : profileStatus !== "ready" ? <p className="mt-1 text-sm">Sign in to view private notifications.</p> : notifications.length === 0 ? (
          <p className="mt-1 text-sm">Nothing in the last 7 days.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2 text-sm">
            {notifications.map((item) => (
              <li key={item.id}>
                <Link href={item.link} className="underline">
                  {item.communityName}
                </Link>{" "}
                · {item.text}{" "}
                <span className="text-[var(--muted)]">{new Date(item.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="product-page-card rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-label="My circles">
        <h2 className="section-head">My circles</h2>
        {profileStatus === "loading" ? (
          <p className="loading-skeleton mt-2 text-sm" role="status">Loading your circles…</p>
        ) : profileStatus !== "ready" ? (
          <p className="mt-1 text-sm">Sign in to view your private circles.</p>
        ) : !contributions || contributions.length === 0 ? (
          <p className="mt-1 text-sm">
            You have not joined any circles yet. <Link href="/communities" className="underline">Browse circles</Link>.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-4">
            {contributions.map((entry) => {
              const open = (promotions[entry.communityId] ?? []).find((row) => row.status === "open");
              const latest = (promotions[entry.communityId] ?? [])[0];
              return (
                <li key={entry.communityId} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
                  <p className="text-sm">
                    <Link href={`/communities/${entry.communityId}`} className="font-semibold underline">
                      {entry.communityName}
                    </Link>{" "}
                    · as {entry.alias} · {entry.level}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {entry.posts.length} posts · {entry.replies} replies · {entry.thanksReceived} thanks received
                  </p>
                  {latest && latest.status !== "open" && (
                    <p className="mt-1 text-sm">
                      {latest.requested_role} request {latest.status}
                      {latest.reviewer_rationale ? `: ${latest.reviewer_rationale}` : ""}
                    </p>
                  )}
                  {open ? (
                    <p className="mt-1 text-sm">Your {open.requested_role} request is waiting for review.</p>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-4 py-1.5 text-sm"
                        onClick={() => setRequesting({ communityId: entry.communityId, role: "volunteer" })}
                      >
                        Request volunteer review
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-[var(--line)] px-4 py-1.5 text-sm"
                        onClick={() => setRequesting({ communityId: entry.communityId, role: "verified-supporter" })}
                      >
                        Request verified supporter review
                      </button>
                    </div>
                  )}
                  {requesting?.communityId === entry.communityId && (
                    <div className="mt-2 rounded-xl bg-[var(--lilac)] p-3">
                      {requesting.role === "volunteer" ? (
                        <p className="text-sm">
                          Volunteers take welcome duty and unanswered-question duty, complete a training checklist,
                          serve 3-month terms, and take at most 5 cases a week so nobody burns out.
                        </p>
                      ) : (
                        <p className="text-sm">
                          Verified supporters are identity-checked off-platform. Scope is peer support only — never
                          clinical, legal, or financial advice. Badges can be revoked by moderators.
                        </p>
                      )}
                      <label className="mt-2 block text-sm font-semibold" htmlFor={`promo-note-${entry.communityId}`}>
                        Why do you want this role? (shown to reviewers)
                      </label>
                      <textarea
                        id={`promo-note-${entry.communityId}`}
                        rows={2}
                        maxLength={1000}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void submitPromotion()}
                          className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
                        >
                          {busy ? "Sending…" : "Send request"}
                        </button>
                        <button type="button" className="text-sm underline" onClick={() => setRequesting(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="product-page-card rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]" aria-label="Standing ladder">
        <h2 className="section-head">How standing works</h2>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {RUNGS.map((rung) => (
            <li key={rung.name}>
              <strong>{rung.name}:</strong> {rung.rule}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Activity rungs are computed automatically; Trusted and above are always human-reviewed with a written
          rationale, and you can appeal a declined request by writing to the moderators.
        </p>
      </section>
      </main>
    </div>
  );
}
