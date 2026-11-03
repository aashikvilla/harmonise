"use client";

import { SUGGESTED_MILESTONES } from "@/lib/connect/catalog";
import { useSession } from "@/lib/connect/session";
import { roleLabel, useSupporterData, type SupporterData } from "@/components/connect/coaches";

export default function Journey({ data: supplied }: { data?: SupporterData }) {
  const { state, dispatch } = useSession();
  const own = useSupporterData(!supplied && !state.demo);
  const data: SupporterData = state.demo ? { status: "demo", contributions: [], promotions: {} } : (supplied ?? own);
  const confirmed = SUGGESTED_MILESTONES.filter((item) => state.confirmedMilestones.includes(item.id));
  const suggested = SUGGESTED_MILESTONES.filter((item) => !state.confirmedMilestones.includes(item.id));
  const progress = Math.round((confirmed.length / SUGGESTED_MILESTONES.length) * 100);

  const totalPosts = data.contributions.reduce((sum, entry) => sum + entry.posts.length, 0);
  const totalReplies = data.contributions.reduce((sum, entry) => sum + entry.replies, 0);
  const totalThanks = data.contributions.reduce((sum, entry) => sum + entry.thanksReceived, 0);
  const history = data.contributions.flatMap((entry) =>
    entry.posts.map((post) => ({ ...post, communityName: entry.communityName })),
  );

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
        <p className="cx-note">
          Milestone confirmations below are this-session reflections only. They are not saved to your account and do
          not change your saved record.
        </p>
      </section>

      <div className="cx-two-col">
        <section className="cx-card-white" aria-label="Milestones you confirmed">
          <p className="cx-kicker">Reflected this session</p>
          {confirmed.length === 0 ? (
            <p className="cx-note">No milestones reflected on yet this session. Confirm one from the suggested list when it feels true.</p>
          ) : (
            confirmed.map((item) => (
              <div key={item.id} className="cx-milestone">
                <div><strong>{item.title}</strong><small>{item.hint}</small></div>
                <span className="cx-done" aria-label={`${item.title} confirmed this session`}>✓ Done</span>
              </div>
            ))
          )}
        </section>
        <section className="cx-card-white" aria-label="Suggested milestones">
          <p className="cx-kicker">Suggested</p>
          {suggested.length === 0 ? (
            <p className="cx-note">Every suggested milestone is reflected on this session. Well done — at your own pace.</p>
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
        <section className="cx-card-white" aria-label="Your contributions">
          <p className="cx-kicker">Your contributions</p>
          {data.status === "loading" ? (
            <p className="cx-note" role="status">Loading your contributions…</p>
          ) : data.status === "demo" ? (
            <p className="cx-note">You are exploring the demo, so there is no real contribution record. Sign in with email to see your actual posts, replies, and thanks received.</p>
          ) : data.status === "signed-out" ? (
            <p className="cx-note">Sign in to see your contributions. Nothing is shown as zero before sign-in.</p>
          ) : data.status === "unavailable" ? (
            <p className="cx-note" role="alert">Your contributions could not be loaded just now. They are not being shown as empty — please try again shortly.</p>
          ) : (
            <>
              <div className="cx-points" aria-label={`Your contributions: ${totalPosts} posts in ${data.contributions.length} circles`}>
                <span>Visible record from your circles</span>
                <b>{totalPosts} posts</b>
              </div>
              <p className="cx-note">
                {data.contributions.length} {data.contributions.length === 1 ? "circle" : "circles"} joined · {totalReplies}{" "}
                replies · {totalThanks} thanks received. These are counts of your real posts and replies — there are no
                helpfulness points.
              </p>
              <h3 className="cx-section-title">Contribution history</h3>
              {history.length === 0 ? (
                <p className="cx-note">No posts yet in your joined circles. Your real posts will appear here after you share in a circle.</p>
              ) : (
                <ul className="cx-history">
                  {history.map((item) => (
                    <li key={item.id}>
                      Posted in {item.communityName} · {new Date(item.createdAt).toLocaleDateString()} · “
                      {item.body.slice(0, 80)}{item.body.length > 80 ? "…" : ""}” · {item.replyCount} replies · {item.thanks}{" "}
                      thanks{item.status !== "visible" ? ` · ${item.status}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
        <section className="cx-card-white" aria-label="Support Coach eligibility">
          <p className="cx-kicker">Support Coach eligibility</p>
          <p className="cx-note">
            Coaching here means peer support from lived experience. Promotion is never automatic — eligibility
            requires human review, boundary training, conduct review, and identity verification.
          </p>
          {data.status === "loading" ? (
            <p className="cx-note" role="status">Loading your supporter status…</p>
          ) : data.status === "demo" ? (
            <p className="cx-note">Demo exploration has no real supporter record. Sign in with email to see your actual application status.</p>
          ) : data.status === "signed-out" ? (
            <p className="cx-note">Sign in to see your supporter status. It is not shown as “not started” before sign-in.</p>
          ) : data.status === "unavailable" ? (
            <p className="cx-note" role="alert">Your supporter status could not be loaded just now. Please try again shortly.</p>
          ) : data.contributions.length === 0 ? (
            <p className="cx-note">Not started — you have not joined any circles yet, so there is no application yet. Join a circle from the adviser when you are ready.</p>
          ) : (
            <ul className="cx-history">
              {data.contributions.map((entry) => {
                const requests = data.promotions[entry.communityId] ?? [];
                const open = requests.find((row) => row.status === "open");
                const latest = requests[0];
                return (
                  <li key={entry.communityId}>
                    {entry.communityName}:{" "}
                    {open
                      ? `${roleLabel(open.requested_role)} request waiting for moderator review`
                      : latest
                        ? `${roleLabel(latest.requested_role)} request ${latest.status}${latest.reviewer_rationale ? ` — ${latest.reviewer_rationale}` : ""}`
                        : "no application yet — not started"}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="cx-disclaimer">Keep participating gently. There is no score threshold that unlocks coaching.</div>
        </section>
      </div>
    </div>
  );
}
