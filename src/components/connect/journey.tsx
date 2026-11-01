"use client";

import { SUGGESTED_MILESTONES } from "@/lib/connect/catalog";
import { useSession } from "@/lib/connect/session";

export default function Journey() {
  const { state, dispatch } = useSession();
  const confirmed = SUGGESTED_MILESTONES.filter((item) => state.confirmedMilestones.includes(item.id));
  const suggested = SUGGESTED_MILESTONES.filter((item) => !state.confirmedMilestones.includes(item.id));
  const progress = Math.round((confirmed.length / SUGGESTED_MILESTONES.length) * 100);

  return (
    <div>
      <section className="cx-card-white" aria-label="Point A to Point Z progress">
        <p className="cx-kicker">Private journey</p>
        <div className="cx-progress" role="img" aria-label={`Journey progress: ${confirmed.length} of ${SUGGESTED_MILESTONES.length} milestones confirmed`}>
          <div className="cx-progress-point">
            <span>Point A</span>
            <strong>Where I began</strong>
          </div>
          <span className="cx-progress-arrow" aria-hidden="true">→</span>
          <div className="cx-progress-point" style={{ textAlign: "right" }}>
            <span>Point Z</span>
            <strong>Steady ground, on my terms</strong>
          </div>
          <div className="cx-progress-bar"><i style={{ width: `${progress}%` }} /></div>
        </div>
        <p className="cx-note">
          AI cannot score wellbeing or define progress automatically. Only you confirm what counts — the bar above
          simply reflects your own confirmations.
        </p>
      </section>

      <div className="cx-two-col">
        <section className="cx-card-white" aria-label="Milestones you confirmed">
          <p className="cx-kicker">Confirmed by you</p>
          {confirmed.length === 0 ? (
            <p className="cx-note">No milestones confirmed yet. Confirm one from the suggested list when it feels true.</p>
          ) : (
            confirmed.map((item) => (
              <div key={item.id} className="cx-milestone">
                <div><strong>{item.title}</strong><small>{item.hint}</small></div>
                <span className="cx-done" aria-label={`${item.title} confirmed`}>✓ Done</span>
              </div>
            ))
          )}
        </section>
        <section className="cx-card-white" aria-label="Suggested milestones">
          <p className="cx-kicker">Suggested</p>
          {suggested.length === 0 ? (
            <p className="cx-note">Every suggested milestone is confirmed. Well done — at your own pace.</p>
          ) : (
            suggested.map((item) => (
              <div key={item.id} className="cx-milestone">
                <div><strong>{item.title}</strong><small>{item.hint}</small></div>
                <button
                  type="button"
                  className="cx-mini-btn"
                  onClick={() => dispatch({ type: "confirm-milestone", id: item.id })}
                  aria-label={`Confirm milestone: ${item.title}`}
                >
                  Confirm
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      <div className="cx-two-col">
        <section className="cx-card-white" aria-label="Helpfulness and contributions">
          <p className="cx-kicker">Helpfulness points</p>
          <div className="cx-points" aria-label={`Helpfulness points: ${state.points}`}>
            <span>Total earned in this demo</span>
            <b>{state.points}</b>
          </div>
          <h3 className="cx-section-title">Contribution history</h3>
          {state.contributions.length === 0 ? (
            <p className="cx-note">No contributions yet. Posting in a circle earns 5 points; marking posts helpful earns 1.</p>
          ) : (
            <ul className="cx-history">
              {state.contributions.map((item) => (
                <li key={item.id}>Posted in {item.circleId} · {item.time} · “{item.text.slice(0, 80)}{item.text.length > 80 ? "…" : ""}”</li>
              ))}
            </ul>
          )}
        </section>
        <section className="cx-card-white" aria-label="Support Coach eligibility">
          <p className="cx-kicker">Support Coach eligibility</p>
          <p className="cx-note">
            Coaching here means peer support from lived experience. Promotion is never automatic — eligibility
            requires human review, boundary training, conduct review, and identity verification.
          </p>
          <ul className="cx-history">
            <li>Human review of contributions — pending</li>
            <li>Boundary training — not started</li>
            <li>Conduct review — pending</li>
            <li>Identity verification — not started</li>
          </ul>
          <div className="cx-disclaimer">Keep participating gently. There is no score threshold that unlocks coaching.</div>
        </section>
      </div>
    </div>
  );
}
