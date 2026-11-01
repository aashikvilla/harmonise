"use client";

import { useState, type FormEvent } from "react";
import { COMMUNITIES, SAMPLE_FEEDS, SCHEDULED_CARDS, type CommunityId, type FeedPost } from "@/lib/connect/catalog";
import { useSession } from "@/lib/connect/session";

function CircleFeed({ circleId }: { circleId: CommunityId }) {
  const { state, dispatch } = useSession();
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const mine = state.contributions.filter((item) => item.circleId === circleId);
  const samples: FeedPost[] = SAMPLE_FEEDS[circleId];

  function markHelpful(post: FeedPost) {
    setHelpfulCounts((current) => ({ ...current, [post.id]: (current[post.id] ?? post.helpful) + 1 }));
    dispatch({ type: "points", amount: 1 });
  }

  function report(post: FeedPost) {
    setFlagged((current) => (current.includes(post.id) ? current : [...current, post.id]));
  }

  function post(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0) return;
    dispatch({
      type: "contribute",
      contribution: { id: `${circleId}-${Date.now()}`, circleId, text: text.slice(0, 500), time: "Just now" },
    });
    setDraft("");
  }

  return (
    <div>
      <div className="cx-feed">
        {mine.map((item) => (
          <article key={item.id} className="cx-post" aria-label="Your post">
            <span className="cx-post-meta">{state.displayName} · {item.time} · prototype post</span>
            <p>{item.text}</p>
          </article>
        ))}
        {samples.map((post) => (
          <article key={post.id} className="cx-post" aria-label={`Post by ${post.author}`}>
            <span className="cx-post-meta">{post.author} · {post.time}</span>
            <p>{post.text}</p>
            <div className="cx-post-actions">
              <button type="button" className="cx-mini-btn" onClick={() => markHelpful(post)} aria-label={`Mark post by ${post.author} as helpful`}>
                Helpful ({helpfulCounts[post.id] ?? post.helpful})
              </button>
              {flagged.includes(post.id) ? (
                <span className="cx-note">Flagged for human review. Thank you.</span>
              ) : (
                <button type="button" className="cx-mini-btn" onClick={() => report(post)}>
                  Report
                </button>
              )}
              <button type="button" className="cx-mini-btn" onClick={() => dispatch({ type: "urgent", open: true })}>
                Urgent support
              </button>
            </div>
          </article>
        ))}
      </div>
      <form className="cx-circle-composer" onSubmit={post} aria-label={`Post in ${COMMUNITIES[circleId].name}`}>
        <label className="cx-label" htmlFor={`cx-composer-${circleId}`}>Share with this circle (prototype)</label>
        <textarea
          id={`cx-composer-${circleId}`}
          className="cx-textarea"
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What feels safe to share today?"
        />
        <div>
          <button type="submit" className="cx-btn cx-btn-primary" disabled={draft.trim().length === 0}>
            Post to circle · +5 points
          </button>
        </div>
      </form>
    </div>
  );
}

export default function Circles() {
  const { state, dispatch } = useSession();

  if (state.joined.length === 0) {
    return (
      <section className="cx-empty-circles cx-card-white" aria-label="No circles yet">
        <p className="cx-kicker">My circles</p>
        <h2>You haven&rsquo;t joined any circles yet</h2>
        <p className="cx-lede" style={{ margin: "0 auto 16px" }}>
          Circles only appear here after you explicitly join one. Talk with the adviser first — matching stays
          hidden until you ask to see it.
        </p>
        <button type="button" className="cx-btn cx-btn-primary" onClick={() => dispatch({ type: "set-tab", tab: "find" })}>
          Talk with the adviser
        </button>
      </section>
    );
  }

  return (
    <div className="cx-circle-grid">
      {state.joined.map((id) => {
        const community = COMMUNITIES[id as CommunityId];
        if (!community) return null;
        return (
          <section key={community.id} className="cx-card-white" aria-label={community.name}>
            <div className="cx-circle-head">
              <div>
                <div className="cx-card-meta">
                  <span className="cx-tag cx-tag-dark">Prototype circle</span>
                  <span className="cx-tag cx-tag-green">{community.cadence}</span>
                  <span className="cx-tag">{community.memberCount}</span>
                </div>
                <h2>{community.name}</h2>
                <p className="cx-card-desc">{community.description}</p>
                <span className="cx-agent"><i aria-hidden="true">H</i>{community.agentName}</span>
              </div>
            </div>
            <div className="cx-disclaimer">
              The circle agent helps with conversation prompts, gentle moderation, scheduled feeds, flagging
              concerning content for human review, and keeping conversations useful. AI moderation cannot guarantee
              safety or replace human moderators — flagged posts go to human review.
            </div>
            {SCHEDULED_CARDS[community.id].map((card) => (
              <div key={card.id} className="cx-scheduled">
                <strong>{card.title} · scheduled feed</strong>
                <p>{card.text}</p>
              </div>
            ))}
            <h3 className="cx-section-title">Conversation feed</h3>
            <CircleFeed circleId={community.id} />
            <h3 className="cx-section-title">Community boundaries</h3>
            <ul className="cx-boundaries">
              {community.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
            {community.extraNote ? <p className="cx-note">{community.extraNote}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
