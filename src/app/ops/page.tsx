"use client";

import { useState } from "react";

type OpsBody = {
  totals?: { requests?: number; errors?: number; inputTokens?: number; outputTokens?: number };
  routes?: Array<{ route: string; count: number; errors: number; rateLimited: number; avgLatencyMs: number; maxLatencyMs: number }>;
  queue?: { queued: number; processing: number; triaged: number; dead: number; openReports: number } | null;
  funnel?: { accounts: number; memberships: number; posts: number } | null;
  oldestQueuedAt?: string | null;
  quotaDrops?: number;
  killSwitchDrops?: number;
};

function backlogAgeLabel(iso: string | null | undefined) {
  if (!iso) return "queue empty";
  const hours = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m old`;
  return `${Math.round(hours)}h old`;
}

export default function OpsPage() {
  const [secret, setSecret] = useState(() =>
    typeof window === "undefined" ? "" : (window.sessionStorage.getItem("harmonise-ops-secret") ?? ""),
  );
  const [body, setBody] = useState<OpsBody | null>(null);
  const [backlogHours, setBacklogHours] = useState(0);
  const [backlogLabel, setBacklogLabel] = useState("queue empty");
  const [error, setError] = useState("");

  async function load(value: string) {
    setError("");
    try {
      const res = await fetch("/api/ops/metrics", { headers: { "x-ops-secret": value }, cache: "no-store" });
      if (res.status === 403) {
        setError("That secret was not accepted.");
        setBody(null);
        return;
      }
      const data = (await res.json()) as OpsBody;
      setBody(data);
      setBacklogHours(
        data.oldestQueuedAt != null
          ? (Date.now() - new Date(data.oldestQueuedAt).getTime()) / 3600000
          : 0,
      );
      setBacklogLabel(backlogAgeLabel(data.oldestQueuedAt));
      window.sessionStorage.setItem("harmonise-ops-secret", value);
    } catch {
      setError("Metrics are unavailable right now.");
    }
  }

  const backlogAlert = backlogHours > 1;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10">
      <h1 className="serif-head text-3xl">Pilot ops dashboard</h1>
      <p className="text-sm text-[var(--muted)]">
        Queue depth, worker lag, model errors, token spend, and the signup → join → post funnel. Metadata only —
        no private text or identities.
      </p>
      <form
        className="flex flex-col gap-2 rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40"
        onSubmit={(event) => {
          event.preventDefault();
          void load(secret);
        }}
      >
        <label className="text-sm font-semibold" htmlFor="ops-secret">
          Ops secret
        </label>
        <input
          id="ops-secret"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          className="w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm"
        />
        <div>
          <button type="submit" className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white">
            Load metrics
          </button>
        </div>
        {error && <p className="text-sm text-[var(--coral,#af554f)]">{error}</p>}
      </form>

      {body && (
        <>
          {backlogAlert && (
            <p role="alert" className="rounded-2xl bg-[var(--peach)] p-4 text-sm">
              Worker backlog alert: oldest queued event is {backlogLabel}. Drain the queue
              before the pilot review.
            </p>
          )}
          <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40" aria-label="Funnel">
            <h2 className="font-semibold">Signup → join → post</h2>
            {body.funnel ? (
              <p className="mt-1 text-sm">
                {body.funnel.accounts} accounts · {body.funnel.memberships} active memberships · {body.funnel.posts}{" "}
                posts
              </p>
            ) : (
              <p className="mt-1 text-sm">Funnel counts unavailable.</p>
            )}
          </section>
          <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40" aria-label="Moderation queue">
            <h2 className="font-semibold">Moderation queue</h2>
            {body.queue ? (
              <p className="mt-1 text-sm">
                {body.queue.queued} queued · {body.queue.processing} processing · {body.queue.triaged} triaged ·{" "}
                {body.queue.dead} dead · {body.queue.openReports} open reports · oldest: {backlogLabel}
              </p>
            ) : (
              <p className="mt-1 text-sm">Queue depth unavailable.</p>
            )}
          </section>
          <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40" aria-label="Model usage">
            <h2 className="font-semibold">Model usage</h2>
            <p className="mt-1 text-sm">
              {body.totals?.requests ?? 0} requests · {body.totals?.errors ?? 0} errors ·{" "}
              {body.totals?.inputTokens ?? 0} in / {body.totals?.outputTokens ?? 0} out tokens ·{" "}
              {body.quotaDrops ?? 0} quota drops · {body.killSwitchDrops ?? 0} kill-switch drops
            </p>
          </section>
          <section className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40" aria-label="Routes">
            <h2 className="font-semibold">Slowest routes</h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {(body.routes ?? [])
                .slice()
                .sort((a, b) => b.avgLatencyMs - a.avgLatencyMs)
                .slice(0, 8)
                .map((row) => (
                  <li key={row.route}>
                    {row.route}: {row.count} calls, avg {row.avgLatencyMs}ms, max {row.maxLatencyMs}ms,{" "}
                    {row.errors} errors, {row.rateLimited} rate-limited
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
