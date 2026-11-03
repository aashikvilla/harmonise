"use client";

import { useCallback, useEffect, useState } from "react";

type Promotion = {
  id: string;
  requested_role: string;
  note: string;
  status: string;
  created_at: string;
};

type Assignment = { community_id: string; community_name: string };

async function getJson<T>(path: string): Promise<{ status: number; body: T | null }> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    return { status: res.status, body: (await res.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

/** Moderator view of open volunteer / verified-supporter requests. */
export default function PromotionQueue() {
  const [groups, setGroups] = useState<Array<{ community: Assignment; requests: Promotion[] }> | null>(null);
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const mine = await getJson<{ assignments?: Assignment[] }>("/api/moderation/assignments");
    if (mine.status !== 200 || !Array.isArray(mine.body?.assignments)) {
      setGroups([]);
      return;
    }
    const entries = await Promise.all(
      mine.body.assignments.map(async (community) => {
        const data = await getJson<{ requests?: Promotion[] }>(
          `/api/communities/${community.community_id}/promotions`,
        );
        return { community, requests: data.body?.requests ?? [] };
      }),
    );
    setGroups(entries.filter((entry) => entry.requests.length > 0));
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function decide(communityId: string, requestId: string, decision: "approved" | "declined") {
    const rationale = (rationales[requestId] ?? "").trim();
    if (!rationale) {
      setNotice("Write a rationale first — every promotion decision needs one.");
      return;
    }
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`/api/communities/${communityId}/promotions/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, rationale }),
      });
      if (res.ok) {
        setNotice(`Request ${decision}.`);
        await load();
      } else {
        setNotice("The decision could not be recorded. Try again.");
      }
    } catch {
      setNotice("The decision could not be recorded. Try again.");
    }
    setBusy(false);
  }

  if (groups === null) return null;
  if (groups.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-black/40" aria-label="Promotion requests">
      <h2 className="serif-head text-xl">Volunteer &amp; verified-supporter requests</h2>
      {notice && <p className="mt-1 text-sm">{notice}</p>}
      <ul className="mt-3 flex flex-col gap-4">
        {groups.map((entry) =>
          entry.requests.map((row) => (
            <li key={row.id} className="border-t border-[var(--line)] pt-3 first:border-0 first:pt-0">
              <p className="text-sm">
                <strong>{entry.community.community_name}</strong> · {row.requested_role} · requested{" "}
                {new Date(row.created_at).toLocaleString()}
              </p>
              {row.note && <p className="mt-1 text-sm">{row.note}</p>}
              <label className="mt-2 block text-sm font-semibold" htmlFor={`rationale-${row.id}`}>
                Decision rationale (shown to the member)
              </label>
              <textarea
                id={`rationale-${row.id}`}
                rows={2}
                maxLength={1000}
                value={rationales[row.id] ?? ""}
                onChange={(event) => setRationales((current) => ({ ...current, [row.id]: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-white p-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decide(entry.community.community_id, row.id, "approved")}
                  className="rounded-full bg-[var(--ink)] px-4 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decide(entry.community.community_id, row.id, "declined")}
                  className="rounded-full border border-[var(--line)] px-4 py-1.5 text-sm"
                >
                  Decline
                </button>
              </div>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
