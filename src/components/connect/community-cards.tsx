"use client";

import { useState } from "react";

/** Shape returned by GET /api/communities (publicCommunity). */
export type RealCommunity = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "member";
  launch_status?: "pending_review" | "approved" | "rejected" | "archived";
  topics?: string[];
  memberCount: number;
  postCount: number;
  recentPostCount: number;
  joined: boolean;
};

export function CommunityCard({
  community,
  reason,
  joined,
  onJoin,
  onOpen,
}: {
  community: RealCommunity | null;
  reason: string | null;
  joined: boolean;
  onJoin: (id: string, alias: string) => Promise<boolean>;
  onOpen: () => void;
}) {
  const [preview, setPreview] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [alias, setAlias] = useState("");

  if (!community) {
    return (
      <article className="cx-card cx-card-white" aria-label="Community suggestion unavailable">
        <div className="cx-card-meta">
          <span className="cx-tag cx-tag-dark">Suggested for you</span>
        </div>
        <h3>A live circle isn&rsquo;t available for this suggestion yet</h3>
        {reason ? (
          <div className="cx-why">
            <strong>Why it was suggested</strong>
            {reason}
          </div>
        ) : null}
        <p className="cx-note">
          This suggestion does not match a live community right now, so there is nothing to join here yet.
          Nothing about this suggestion is a real member count or a real post.
        </p>
      </article>
    );
  }

  async function join() {
    setJoining(true);
    setJoinError("");
    const ok = await onJoin(community!.id, alias.trim());
    setJoining(false);
    if (!ok) setJoinError("Joining did not work. This circle may not be available yet — please try again.");
  }

  return (
    <article className="cx-card cx-card-white" aria-label={community.name}>
      <div className="cx-card-meta">
        <span className="cx-tag cx-tag-dark">{community.visibility === "public" ? "Public" : "Members only"}</span>
        <span className="cx-tag">
          {community.memberCount} {community.memberCount === 1 ? "member" : "members"} · {community.postCount}{" "}
          {community.postCount === 1 ? "post" : "posts"}
        </span>
        {joined ? <span className="cx-tag cx-tag-green">Joined</span> : null}
      </div>
      <h3>{community.name}</h3>
      <p className="cx-card-desc">{community.description || "No description yet."}</p>
      {reason ? (
        <div className="cx-why">
          <strong>Why it fits</strong>
          {reason}
        </div>
      ) : null}
      {joinError ? (
        <p className="cx-note" role="alert">{joinError}</p>
      ) : null}
      <div className="cx-card-actions">
        <button type="button" className="cx-btn cx-btn-soft" onClick={() => setPreview((value) => !value)} aria-expanded={preview}>
          {preview ? "Hide preview" : "Preview"}
        </button>
        {joined ? (
          <button type="button" className="cx-btn cx-btn-primary" onClick={onOpen}>
            Open in My circles
          </button>
        ) : (
          <div className="cx-join-choice">
            <label className="cx-label" htmlFor={`community-alias-${community.id}`}>Choose the alias members will see</label>
            <input id={`community-alias-${community.id}`} className="cx-input" value={alias} maxLength={40} onChange={(event) => setAlias(event.target.value)} placeholder="Your community alias" />
            <button type="button" className="cx-btn cx-btn-primary" disabled={joining || alias.trim().length < 2} onClick={() => void join()}>
              {joining ? "Joining…" : "Join this circle"}
            </button>
          </div>
        )}
      </div>
      {preview ? (
        <div className="cx-preview-box">
          {community.topics && community.topics.length > 0 ? (
            <p><strong>What members talk about:</strong> {community.topics.join(" · ")}</p>
          ) : null}
          <p>
            {community.recentPostCount > 0
              ? `${community.recentPostCount} new ${community.recentPostCount === 1 ? "post" : "posts"} this week.`
              : "Quiet right now."}{" "}
            Joining is always explicit and consent-based.
          </p>
        </div>
      ) : null}
    </article>
  );
}
