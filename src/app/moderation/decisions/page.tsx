"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { quoteCsvCell } from "@/lib/csv";

type Decision = {
  id: string;
  reportReason: string;
  decision: string;
  rationale: string;
  reviewerAlias: string;
  createdAt: string;
  appealStatus: string | null;
};

function AuditBody() {
  const community = useSearchParams().get("community") ?? "";
  const [decisions, setDecisions] = useState<Decision[] | null>(null);
  const router = useRouter();
  const [options, setOptions] = useState<{ community_id: string; community_name: string }[] | null>(null);
  const [choice, setChoice] = useState("");
  useEffect(() => {
    if (!community) return;
    void (async () => {
      try {
        const res = await fetch(`/api/moderation/decisions?community=${community}`, { cache: "no-store" });
        const body = (await res.json()) as { decisions?: Decision[] };
        setDecisions(Array.isArray(body.decisions) ? body.decisions : []);
      } catch {
        setDecisions([]);
      }
    })();
  }, [community]);
  useEffect(() => {
    if (community || options !== null) return;
    void (async () => {
      try {
        const res = await fetch("/api/moderation/assignments", { cache: "no-store" });
        const body = (await res.json()) as { assignments?: { community_id: string; community_name: string }[] };
        const list = Array.isArray(body.assignments) ? body.assignments : [];
        setOptions(list);
        if (list.length > 0) setChoice(list[0].community_id);
      } catch {
        setOptions([]);
      }
    })();
  }, [community, options]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-10">
      <Link href="/moderation" className="text-sm underline">
        Back to moderation
      </Link>
      <h1 className="serif-head text-3xl">Moderation audit trail</h1>
      <p className="text-sm text-[var(--muted)]">
        Every moderation outcome, newest first. Each row keeps the decision separate from the original report so
        appeals stay independent.
      </p>
      {!community ? (
        <div className="flex flex-col gap-3">
          {options === null ? (
            <p className="loading-skeleton text-sm" role="status">Loading the communities you moderate…</p>
          ) : options.length === 0 ? (
            <p className="text-sm">You do not moderate any community yet, so there is no audit trail to show.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm" htmlFor="audit-community">Community</label>
              <select id="audit-community" className="min-h-[44px] rounded-lg border border-[var(--line)] bg-white px-3 text-sm" value={choice} onChange={(event) => setChoice(event.target.value)}>
                {options.map((option) => (
                  <option key={option.community_id} value={option.community_id}>{option.community_name}</option>
                ))}
              </select>
              <button type="button" className="button button-secondary" disabled={!choice} onClick={() => router.push(`/moderation/decisions?community=${choice}`)}>
                View audit trail
              </button>
            </div>
          )}
        </div>
      ) : decisions === null ? (
        <p className="loading-skeleton text-sm" role="status">Loading decisions…</p>
      ) : decisions.length === 0 ? (
        <p className="state-card text-sm">No moderation decisions recorded yet.</p>
      ) : (
        <>
          <div>
            <button
              type="button"
              onClick={() => {
                const rows = [
                  ["decision", "appeal status", "decided at", "decided by", "report reason", "rationale"],
                  ...decisions.map((row) => [
                    row.decision,
                    row.appealStatus ?? "",
                    row.createdAt,
                    row.reviewerAlias,
                    row.reportReason,
                    row.rationale,
                  ]),
                ];
                const csv = rows
                  .map((cells) => cells.map(quoteCsvCell).join(","))
                  .join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = `moderation-audit-${community.replace(/[^a-z0-9_-]/gi, "-")}.csv`;
                link.click();
                window.setTimeout(() => URL.revokeObjectURL(url), 1000);
              }}
              className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
            >
              Export CSV for pilot review
            </button>
          </div>
          <ol className="flex flex-col gap-3">
            {decisions.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm shadow-[var(--shadow-soft)]"
            >
              <p className="font-semibold">
                {row.decision}
                {row.appealStatus ? ` · appeal ${row.appealStatus}` : ""}
              </p>
              <p className="mt-1 text-[var(--muted)]">
                {new Date(row.createdAt).toLocaleString()} · decided by {row.reviewerAlias} · report:{" "}
                {row.reportReason}
              </p>
              {row.rationale ? <p className="mt-2">{row.rationale}</p> : null}
            </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}

export default function DecisionsAuditPage() {
  return (
    <Suspense fallback={<main className="loading-skeleton mx-auto w-full max-w-3xl px-5 py-10 text-sm" role="status">Loading…</main>}>
      <AuditBody />
    </Suspense>
  );
}
