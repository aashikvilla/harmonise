"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
        <p className="text-sm">Choose a community from the moderation page first.</p>
      ) : decisions === null ? (
        <p className="text-sm">Loading decisions…</p>
      ) : decisions.length === 0 ? (
        <p className="text-sm">No moderation decisions recorded yet.</p>
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
                  .map((cells) => cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
                  .join("\n");
                const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
                const link = document.createElement("a");
                link.href = url;
                link.download = `moderation-audit-${community}.csv`;
                link.click();
                URL.revokeObjectURL(url);
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
              className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 text-sm dark:bg-black/40"
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
    <Suspense fallback={<main className="mx-auto w-full max-w-3xl px-5 py-10 text-sm">Loading…</main>}>
      <AuditBody />
    </Suspense>
  );
}
