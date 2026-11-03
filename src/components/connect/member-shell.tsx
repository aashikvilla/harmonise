"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, type ConnectTab } from "@/lib/connect/session";
import Adviser from "@/components/connect/adviser";
import Circles from "@/components/connect/circles";
import Journey from "@/components/connect/journey";
import Coaches, { CoachDashboardPreview, useSupporterData, type SupporterData } from "@/components/connect/coaches";
import UrgentModal from "@/components/connect/urgent-modal";
import SharedBrand from "@/components/connect/brand";

const TABS: { id: ConnectTab; label: string; heading: string; lede: string }[] = [
  {
    id: "find",
    label: "Find connection",
    heading: "Find connection",
    lede: "Talk privately with the harmonize adviser. Guidance first — communities only if you ask.",
  },
  {
    id: "journey",
    label: "My journey",
    heading: "My journey",
    lede: "Your private Point A → Point Z. You confirm every milestone; the AI never scores you.",
  },
  {
    id: "circles",
    label: "My circles",
    heading: "My circles",
    lede: "Only the communities you explicitly joined. Nothing here is automatic.",
  },
  {
    id: "coaches",
    label: "Support Coaches",
    heading: "Support Coaches",
    lede: "Your real path to peer support roles. Human-reviewed only — never therapy, never automatic.",
  },
];

function initialsFor(name: string): string {
  const letters = name.split(/\s+/).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
  return letters || "H";
}

export default function MemberShell() {
  const { state, dispatch } = useSession();
  const router = useRouter();
  const active = TABS.find((tab) => tab.id === state.tab) ?? TABS[0];
  const [restoreAttempted, setRestoreAttempted] = useState(false);
  const restoring = !state.entered && !restoreAttempted;
  const supporter = useSupporterData(state.entered && !state.demo);
  const supporterData: SupporterData = state.demo ? { status: "demo", contributions: [], promotions: {} } : { status: supporter.status, contributions: supporter.contributions, promotions: supporter.promotions };
  const totalPosts = supporterData.contributions.reduce((sum, entry) => sum + entry.posts.length, 0);
  useEffect(() => {
    if (state.entered) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const body = (await response.json().catch(() => null)) as { id?: unknown; email?: unknown } | null;
        if (cancelled) return;
        if (response.ok && body && typeof body.id === "string") {
          const address = typeof body.email === "string" ? body.email : "";
          const local = address.split("@")[0].replace(/[._-]+/g, " ").trim();
          const displayName = local ? local.charAt(0).toUpperCase() + local.slice(1) : "Member";
          dispatch({ type: "enter", displayName, nameMode: "alias", email: address, demo: false });
        }
      } catch {
        /* Signed-out visitors keep the entrance card. */
      } finally {
        if (!cancelled) setRestoreAttempted(true);
      }
    })();
    return () => { cancelled = true; };
  }, [state.entered, dispatch]);

  async function exitSpace() {
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" }).catch(() => null);
    dispatch({ type: "exit" });
    router.push("/connect");
  }

  if (restoring) {
    return (
      <main className="cx-gate">
        <div className="cx-gate-inner">
          <p className="cx-note" role="status" style={{ maxWidth: "620px", margin: "60px auto" }}>Opening your space…</p>
        </div>
      </main>
    );
  }

  if (!state.entered) {
    return (
      <main className="cx-gate">
        <div className="cx-gate-inner">
          <section className="cx-card-white" style={{ maxWidth: "620px", margin: "60px auto" }} aria-label="Entry required">
            <p className="cx-kicker">Harmonise</p>
            <h1 style={{ fontFamily: "var(--cx-ser)", fontSize: "34px", margin: "6px 0 10px" }}>Start at the entrance</h1>
            <p className="cx-lede">Sign in with email — it takes less than a minute.</p>
            <Link className="cx-btn cx-btn-primary" href="/connect">Go to entrance</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <div className="cx-shell">
      <header className="cx-topbar">
        <div className="cx-topbar-inner">
          <SharedBrand linkToEntrance />
          <span className="cx-topbar-spacer" />
          <div className="cx-topbar-actions">
            <button type="button" className="cx-btn cx-btn-urgent" onClick={() => dispatch({ type: "urgent", open: true })}>
              Urgent support
            </button>
            <button type="button" className="cx-btn cx-btn-soft" onClick={() => void exitSpace()}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <div className="cx-body">
        <aside className="cx-side" aria-label="Profile and navigation">
          <section className="cx-profile cx-card-white" aria-label="Your profile">
            <div className="cx-profile-row">
              <span className="cx-avatar" aria-hidden="true">{initialsFor(state.displayName)}</span>
              <div>
                <strong>{state.displayName}</strong>
                <small>
                  {state.nameMode === "alias" ? "Alias mode" : "Real-name mode"}
                  {state.demo ? " · Demo" : ""}
                </small>
              </div>
            </div>
            <div className="cx-card-meta">
              <span className="cx-tag cx-tag-dark">Prototype</span>
              {state.demo ? <span className="cx-tag"> exploring demo</span> : null}
            </div>
            <div className="cx-points" aria-label={supporterData.status === "ready" ? `Your contributions: ${totalPosts} posts in ${supporterData.contributions.length} circles` : "Your contributions"}>
              <span>Your contributions</span>
              <b>{supporterData.status === "loading" ? "…" : supporterData.status === "ready" ? `${totalPosts} posts · ${supporterData.contributions.length} circles` : supporterData.status === "demo" ? "Demo" : "Unavailable"}</b>
            </div>
          </section>
          <nav className="cx-nav cx-card-white" aria-label="Member tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="cx-nav-btn"
                aria-current={state.tab === tab.id ? "page" : undefined}
                onClick={() => dispatch({ type: "set-tab", tab: tab.id })}
              >
                <span className="cx-nav-dot" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="cx-side-actions cx-card-white">
            <button type="button" className="cx-btn cx-btn-soft cx-btn-block" onClick={() => dispatch({ type: "coach-preview", open: true })}>
              Your supporter applications
            </button>
          </div>
        </aside>
        <main className="cx-main">
          <div className="cx-main-head">
            <p className="cx-kicker">{active.label}</p>
            <h1>{active.heading}</h1>
            <p className="cx-lede">{active.lede}</p>
          </div>
          {state.tab === "find" ? <Adviser /> : null}
          {state.tab === "journey" ? <Journey data={supporterData} /> : null}
          {state.tab === "circles" ? <Circles /> : null}
          {state.tab === "coaches" ? <Coaches data={supporterData} onChanged={supporter.reload} /> : null}
        </main>
      </div>
      {state.urgentOpen ? <UrgentModal onClose={() => dispatch({ type: "urgent", open: false })} /> : null}
      {state.coachPreviewOpen ? (
        <div className="cx-modal-backdrop" role="presentation" onClick={() => dispatch({ type: "coach-preview", open: false })}>
          <div
            className="cx-modal cx-modal-wide cx-card-white"
            role="dialog"
            aria-modal="true"
            aria-label="Your supporter applications"
            onClick={(event) => event.stopPropagation()}
          >
            <CoachDashboardPreview data={supporterData} onChanged={supporter.reload} />
            <div className="cx-modal-actions">
              <button type="button" className="cx-btn cx-btn-primary cx-btn-block" onClick={() => dispatch({ type: "coach-preview", open: false })}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
