"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/connect/session";

export type ContributionPost = {
  id: string;
  body: string;
  status: string;
  createdAt: string;
  replyCount: number;
  thanks: number;
};

export type ContributionEntry = {
  communityId: string;
  communityName: string;
  alias: string;
  role: string;
  posts: ContributionPost[];
  replies: number;
  thanksReceived: number;
  level: string;
};

export type PromotionRequest = {
  id: string;
  community_id: string;
  requested_role: string;
  note: string;
  status: string;
  reviewer_rationale: string;
  created_at: string;
};

export type SupporterStatus = "loading" | "ready" | "signed-out" | "unavailable" | "demo";

export type SupporterData = {
  status: SupporterStatus;
  contributions: ContributionEntry[];
  promotions: Record<string, PromotionRequest[]>;
};

export const EMPTY_SUPPORTER_DATA: SupporterData = { status: "loading", contributions: [], promotions: {} };

async function getJson(path: string): Promise<{ status: number; body: Record<string, unknown> | null }> {
  try {
    const res = await fetch(path, { cache: "no-store", credentials: "include" });
    return { status: res.status, body: (await res.json().catch(() => null)) as Record<string, unknown> | null };
  } catch {
    return { status: 0, body: null };
  }
}

export async function fetchSupporterData(): Promise<SupporterData> {
  const mine = await getJson("/api/account/contributions");
  if (mine.status === 401) return { status: "signed-out", contributions: [], promotions: {} };
  if (mine.status !== 200 || !Array.isArray(mine.body?.contributions)) {
    return { status: "unavailable", contributions: [], promotions: {} };
  }
  const contributions = mine.body.contributions as ContributionEntry[];
  const entries = await Promise.all(
    contributions.map(async (entry) => {
      const data = await getJson(`/api/communities/${entry.communityId}/promotions`);
      const requests = data.status === 200 && Array.isArray(data.body?.requests) ? (data.body.requests as PromotionRequest[]) : [];
      return [entry.communityId, requests] as const;
    }),
  );
  return { status: "ready", contributions, promotions: Object.fromEntries(entries) };
}

export function useSupporterData(enabled = true): SupporterData & { reload: () => void } {
  const [data, setData] = useState<SupporterData>(EMPTY_SUPPORTER_DATA);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      const next = await fetchSupporterData();
      if (!cancelled) setData(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, reloadKey]);

  return { ...data, reload };
}

export function roleLabel(role: string): string {
  return role === "verified-supporter" ? "Verified supporter" : "Volunteer";
}

function ApplicationStatus({ entry, requests }: { entry: ContributionEntry; requests: PromotionRequest[] }) {
  const open = requests.find((row) => row.status === "open");
  const latest = requests[0];
  if (open) {
    return (
      <p className="cx-note">
        Your {roleLabel(open.requested_role).toLowerCase()} request in {entry.communityName} is waiting for a moderator
        review. Requested {new Date(open.created_at).toLocaleDateString()}.
      </p>
    );
  }
  if (latest) {
    return (
      <p className="cx-note">
        Your {roleLabel(latest.requested_role).toLowerCase()} request in {entry.communityName} was {latest.status}
        {latest.reviewer_rationale ? `: ${latest.reviewer_rationale}` : "."}
      </p>
    );
  }
  return (
    <p className="cx-note">
      No volunteer or verified-supporter application in {entry.communityName} yet — not started.
    </p>
  );
}

function ApplyControls({
  entry,
  requests,
  onChanged,
}: {
  entry: ContributionEntry;
  requests: PromotionRequest[];
  onChanged: () => void;
}) {
  const [role, setRole] = useState<"volunteer" | "verified-supporter" | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const open = requests.find((row) => row.status === "open");
  if (open) return null;

  async function submit() {
    if (!role) return;
    setBusy(true);
    setNotice("");
    try {
      const res = await fetch(`/api/communities/${entry.communityId}/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestedRole: role, note }),
      });
      if (res.ok) {
        setNotice("Request sent. A moderator will review it with a written rationale.");
        setRole(null);
        setNote("");
        onChanged();
      } else if (res.status === 409) {
        setNotice("You already have an open request here. A moderator will review it.");
        onChanged();
      } else if (res.status === 503 || res.status === 404) {
        setNotice("Supporter applications are not available yet. Nothing was sent.");
      } else {
        setNotice("The request could not be sent. Try again.");
      }
    } catch {
      setNotice("The request could not be sent. Try again.");
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="cx-card-actions">
        <button type="button" className="cx-btn cx-btn-soft" onClick={() => setRole("volunteer")}>
          Request volunteer review
        </button>
        <button type="button" className="cx-btn cx-btn-soft" onClick={() => setRole("verified-supporter")}>
          Request verified supporter review
        </button>
      </div>
      {notice ? <p className="cx-note">{notice}</p> : null}
      {role ? (
        <div className="cx-request-preview">
          <p style={{ marginTop: 0 }}>
            {role === "volunteer"
              ? "Volunteers take welcome duty and unanswered-question duty, complete a training checklist, and serve 3-month terms. Peer support only."
              : "Verified supporters are identity-checked off-platform. Scope is peer support only — never clinical, legal, or financial advice."}
          </p>
          <label className="cx-label" htmlFor={`promo-note-${entry.communityId}`}>
            Why do you want this role? (shown to reviewers)
          </label>
          <textarea
            id={`promo-note-${entry.communityId}`}
            className="cx-textarea"
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="cx-card-actions">
            <button type="button" className="cx-btn cx-btn-dark" disabled={busy} onClick={() => void submit()}>
              {busy ? "Sending…" : "Send request"}
            </button>
            <button type="button" className="cx-btn cx-btn-soft" onClick={() => setRole(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SupporterApplications({ data, onChanged }: { data: SupporterData; onChanged: () => void }) {
  if (data.status === "loading") return <p className="cx-note" role="status">Loading your supporter status…</p>;
  if (data.status === "demo") {
    return <p className="cx-note">You are exploring the demo, so there is no real application record. Sign in with email to see your actual status.</p>;
  }
  if (data.status === "signed-out") {
    return <p className="cx-note">Sign in as a member first. Supporter applications are linked to your real circle memberships, so nothing can be shown before sign-in.</p>;
  }
  if (data.status === "unavailable") {
    return <p className="cx-note" role="alert">Your supporter status could not be loaded just now. It is not being shown as “not started” — please try again shortly.</p>;
  }
  if (data.contributions.length === 0) {
    return <p className="cx-note">You have not joined any circles yet, so there is nowhere to apply yet. Join a circle first, take part gently, then request a review here.</p>;
  }
  return (
    <div>
      {data.contributions.map((entry) => {
        const requests = data.promotions[entry.communityId] ?? [];
        return (
          <div key={entry.communityId} className="cx-milestone">
            <div>
              <strong>{entry.communityName}</strong>
              <small>
                Joined as {entry.alias} · {entry.level} · {entry.posts.length} posts · {entry.replies} replies ·{" "}
                {entry.thanksReceived} thanks received
              </small>
              <ApplicationStatus entry={entry} requests={requests} />
            </div>
            <ApplyControls entry={entry} requests={requests} onChanged={onChanged} />
          </div>
        );
      })}
    </div>
  );
}

export function CoachDashboardPreview({ data: supplied, onChanged }: { data?: SupporterData; onChanged?: () => void }) {
  const own = useSupporterData(!supplied);
  const data = supplied ?? own;
  const reload = onChanged ?? own.reload;
  return (
    <section aria-label="Your supporter applications">
      <div className="cx-card-meta">
        <span className="cx-tag cx-tag-dark">Supporter applications</span>
        <span className="cx-tag">Your real record</span>
      </div>
      <h2 className="cx-section-title">Your supporter applications</h2>
      <p className="cx-note">
        This shows your actual volunteer and verified-supporter requests, read from your circle memberships. There is
        no separate coach dashboard, no bookings, and no payments in Harmonise.
      </p>
      <SupporterApplications data={data} onChanged={reload} />
    </section>
  );
}

function ProfessionalPathway() {
  const [open, setOpen] = useState(false);
  return (
    <section className="cx-pro cx-card-white" aria-label="Licensed or clinical care">
      <p className="cx-kicker">Beyond peer support</p>
      <h2>Need licensed or clinical care?</h2>
      <p className="cx-lede">
        Professional support is separate from peer Support Coaching. Some struggles need a licensed clinician, and
        that is a different doorway — with independently verified credentials.
      </p>
      <button type="button" className="cx-btn cx-btn-dark" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? "Hide professional pathway preview" : "Preview professional pathway"}
      </button>
      {open ? (
        <div className="cx-request-preview">
          <p style={{ margin: 0 }}>
            Preview only. A real directory would list licensed providers whose credentials require independent
            verification. No booking or provider integration exists in this prototype.
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default function Coaches({ data: supplied, onChanged }: { data?: SupporterData; onChanged?: () => void }) {
  const { state } = useSession();
  const own = useSupporterData(!supplied && !state.demo);
  const data: SupporterData = state.demo ? { status: "demo", contributions: [], promotions: {} } : (supplied ?? own);
  const reload = onChanged ?? own.reload;

  return (
    <div>
      <div className="cx-disclaimer">
        Support Coaches here are members whose volunteer or verified-supporter request a moderator approved after
        human review — peer support from lived experience, never therapy, diagnosis, or treatment. Promotion is never
        automatic and there is no score threshold. Harmonise does not publish a coach roster, and there are no real
        payments, bookings, or 1:1 messaging — so no coaches are listed here.
      </div>
      <section className="cx-card-white" aria-label="Your path to supporting others">
        <p className="cx-kicker">Your path to supporting others</p>
        <h2 className="cx-section-title">Your real application status</h2>
        <p className="cx-note">
          Eligibility starts with joining a circle and taking part. A moderator reviews each request and must give a
          written rationale; you can read their decision and rationale below as soon as it exists.
        </p>
        <SupporterApplications data={data} onChanged={reload} />
      </section>
      <ProfessionalPathway />
    </div>
  );
}
