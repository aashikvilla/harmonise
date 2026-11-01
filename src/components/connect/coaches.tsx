"use client";

import { useState } from "react";
import { COACHES, type Coach } from "@/lib/connect/catalog";
import { useSession } from "@/lib/connect/session";

export function CoachDashboardPreview() {
  return (
    <section aria-label="Coach dashboard preview">
      <div className="cx-card-meta">
        <span className="cx-tag cx-tag-dark">Coach portal</span>
        <span className="cx-tag">Illustrative prototype only</span>
      </div>
      <h2 className="cx-section-title">Coach dashboard (preview)</h2>
      <div className="cx-two-col" style={{ marginTop: 0 }}>
        <div>
          <p className="cx-kicker">Application status</p>
          <p className="cx-note">Boundary training complete · Conduct review in progress · Identity verification pending.</p>
          <p className="cx-kicker" style={{ marginTop: "14px" }}>Member support requests</p>
          <ul className="cx-history">
            <li>Intro chat request from “Quiet Fern” — sample</li>
            <li>Follow-up request from “M. Okafor” — sample</li>
          </ul>
        </div>
        <div>
          <p className="cx-kicker">Helpful contribution signals</p>
          <ul className="cx-history">
            <li>48 posts marked helpful this month (sample)</li>
            <li>12 members returned for a second check-in (sample)</li>
          </ul>
        </div>
      </div>
      <h3 className="cx-section-title">Example revenue split</h3>
      <table className="cx-split">
        <thead>
          <tr><th scope="col">Party</th><th scope="col">Share of $100 member payment</th></tr>
        </thead>
        <tbody>
          <tr><td>Coach</td><td>$80</td></tr>
          <tr><td>Harmonise</td><td>$20</td></tr>
        </tbody>
      </table>
      <p className="cx-note">Illustrative prototype only. No actual payments, bookings, or messaging exist in this demo.</p>
    </section>
  );
}

function CoachCard({ coach }: { coach: Coach }) {
  const { state } = useSession();
  const [storyOpen, setStoryOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const aliasMode = state.nameMode === "alias";

  return (
    <article className="cx-coach cx-card-white" aria-label={`${coach.name}, Support Coach`}>
      <div className="cx-coach-top">
        <span className="cx-avatar" aria-hidden="true">{coach.initials}</span>
        <div>
          <strong>{coach.name}</strong>
          <span className="cx-coach-role">Support Coach</span>
        </div>
      </div>
      <p className="cx-coach-scope">{coach.scope}</p>
      {storyOpen ? <p className="cx-coach-story">{coach.story}</p> : null}
      <div className="cx-coach-meta">
        <span className="cx-tag cx-tag-green">{coach.points} helpfulness points</span>
        <span className="cx-tag">{coach.format}</span>
        <span className="cx-tag">{coach.price}</span>
      </div>
      <div className="cx-card-actions">
        <button type="button" className="cx-btn cx-btn-soft" onClick={() => setStoryOpen((value) => !value)} aria-expanded={storyOpen}>
          {storyOpen ? "Hide story" : "View story"}
        </button>
        <button
          type="button"
          className="cx-btn cx-btn-primary"
          disabled={aliasMode}
          title={aliasMode ? "Alias mode disables direct 1:1 requests." : undefined}
          onClick={() => {
            setRequestOpen(true);
            setSent(false);
          }}
        >
          Request introduction
        </button>
      </div>
      {aliasMode ? (
        <p className="cx-note">Alias mode disables direct 1:1 requests. Switch to real-name mode at entry to preview one.</p>
      ) : null}
      {requestOpen && !aliasMode ? (
        <div className="cx-request-preview">
          {sent ? (
            <p style={{ margin: 0 }}>Preview only — no real request was sent, booked, or paid.</p>
          ) : (
            <div>
              <p style={{ marginTop: 0 }}>
                Introduction preview: {state.displayName} → {coach.name} · {coach.format} · {coach.price}.
              </p>
              <button type="button" className="cx-btn cx-btn-dark" onClick={() => setSent(true)}>
                Send request (preview only)
              </button>
            </div>
          )}
        </div>
      ) : null}
    </article>
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

export default function Coaches() {
  return (
    <div>
      <div className="cx-disclaimer">
        Support Coaches offer peer support from lived experience — never therapy, diagnosis, or treatment. Promotion
        is never automatic: eligibility requires human review, boundary training, conduct review, and identity
        verification. Sample coaches below; no real payments, bookings, or messaging.
      </div>
      <div className="cx-coach-grid">
        {COACHES.map((coach) => (
          <CoachCard key={coach.id} coach={coach} />
        ))}
      </div>
      <ProfessionalPathway />
    </div>
  );
}
