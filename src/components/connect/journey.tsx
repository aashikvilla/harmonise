"use client";

import { useSupporterData, type SupporterData } from "@/components/connect/coaches";

export default function Contributions({ data: supplied }: { data?: SupporterData }) {
  const own = useSupporterData(!supplied);
  const data = supplied ?? own;
  const posts = data.contributions.reduce((count, entry) => count + entry.posts.length, 0);
  const replies = data.contributions.reduce((count, entry) => count + entry.replies, 0);
  const thanks = data.contributions.reduce((count, entry) => count + entry.thanksReceived, 0);

  return (
    <div className="cx-two-col">
      <section className="cx-card-white" aria-label="Your community contributions">
        <p className="cx-kicker">Your real activity</p>
        <h2 className="cx-section-title">Contributions</h2>
        {data.status === "loading" ? <p className="cx-note" role="status">Loading your contributions…</p> : null}
        {data.status === "signed-out" ? <p className="cx-note">Sign in to load your community activity.</p> : null}
        {data.status === "unavailable" ? <p className="cx-note" role="alert">Your contributions could not be loaded. Try again shortly.</p> : null}
        {data.status === "ready" ? (
          <>
            <div className="cx-points"><span>From your joined circles</span><b>{posts} posts</b></div>
            <p className="cx-note">{data.contributions.length} circles · {replies} replies · {thanks} thanks received. These counts come from visible community records; Harmonise does not assign helpfulness points.</p>
            {data.contributions.length === 0 ? <p className="cx-note">You have not joined a circle yet. When you choose to participate, your visible activity will appear here.</p> : (
              <ul className="cx-history">
                {data.contributions.flatMap((entry) => entry.posts.map((post) => (
                  <li key={`${entry.communityId}-${post.id}`}>
                    {entry.communityName} · {new Date(post.createdAt).toLocaleDateString()} · “{post.body.slice(0, 120)}{post.body.length > 120 ? "…" : ""}” · {post.replyCount} replies · {post.thanks} thanks{post.status !== "visible" ? ` · ${post.status}` : ""}
                  </li>
                )))}
              </ul>
            )}
          </>
        ) : null}
      </section>
      <section className="cx-card-white" aria-label="Supporter applications">
        <p className="cx-kicker">Peer support roles</p>
        <h2 className="cx-section-title">Supporter applications</h2>
        <p className="cx-note">Volunteer and verified-supporter requests require moderator review. Activity is not a score or automatic qualification.</p>
        {data.status === "loading" ? <p className="cx-note" role="status">Loading application status…</p> : null}
        {data.status === "signed-out" ? <p className="cx-note">Sign in to load your applications.</p> : null}
        {data.status === "unavailable" ? <p className="cx-note" role="alert">Application status could not be loaded. Try again shortly.</p> : null}
        {data.status === "ready" && data.contributions.length === 0 ? <p className="cx-note">Join a circle first to view or request a peer support role.</p> : null}
        {data.status === "ready" ? data.contributions.map((entry) => {
          const request = (data.promotions[entry.communityId] ?? [])[0];
          return <p className="cx-note" key={entry.communityId}>{entry.communityName}: {request ? `${request.requested_role === "verified-supporter" ? "Verified supporter" : "Volunteer"} request ${request.status}${request.reviewer_rationale ? ` — ${request.reviewer_rationale}` : ""}` : "No open application"}</p>;
        }) : null}
      </section>
    </div>
  );
}
