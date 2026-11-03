"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CONSENT_VERSION } from "@/lib/consent";
import { useSession } from "@/lib/connect/session";
import type { RealCommunity } from "@/components/connect/community-cards";

type Membership = { id: string; alias: string; role: "member" | "moderator"; status: string };

type Post = {
  id: string;
  body: string;
  status: string;
  created_at: string;
  author_alias: string;
  kind?: string;
  replyCount: number;
};

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

async function getJson<T>(path: string): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, { credentials: "include" });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

async function sendJson<T>(path: string, method: string, data?: unknown): Promise<{ status: number; body: T | null }> {
  try {
    const response = await fetch(path, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    return { status: response.status, body: (await response.json().catch(() => null)) as T | null };
  } catch {
    return { status: 0, body: null };
  }
}

function CircleFeed({ community }: { community: RealCommunity }) {
  const { dispatch } = useSession();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsState, setPostsState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState("");
  const [reactions, setReactions] = useState<Record<string, { count: number; reacted: boolean }>>({});
  const [reactionsOff, setReactionsOff] = useState(false);

  const loadFeed = useCallback(async () => {
    const mine = await getJson<{ membership?: Membership | null }>(`/api/communities/${community.id}/membership`);
    setMembership(mine.body?.membership ?? null);
    const feed = await getJson<{ posts?: Post[] }>(`/api/communities/${community.id}/posts`);
    if (feed.status === 200 && Array.isArray(feed.body?.posts)) {
      setPosts(feed.body.posts);
      setPostsState("ready");
    } else if (feed.status === 401 || feed.status === 403) {
      setPostsState("denied");
    } else {
      setPostsState("error");
    }
  }, [community.id]);

  useEffect(() => {
    void (async () => {
      await loadFeed();
    })();
  }, [loadFeed]);

  async function toggleHelpful(post: Post) {
    const result = await sendJson<{ count?: number; reacted?: boolean }>(
      `/api/communities/${community.id}/posts/${post.id}/reactions`,
      "POST",
    );
    if (result.status === 404 || result.status === 503) {
      setReactionsOff(true);
      return;
    }
    if (result.status === 200 && typeof result.body?.count === "number") {
      setReactions((current) => ({
        ...current,
        [post.id]: { count: result.body!.count!, reacted: result.body!.reacted === true },
      }));
    } else {
      setNotice("That could not be saved. Try again.");
    }
  }

  async function submitPost(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length === 0 || posting) return;
    setPosting(true);
    setNotice("");
    const result = await sendJson<{ post?: Post; crisis?: boolean; error?: string }>(
      `/api/communities/${community.id}/posts`,
      "POST",
      { body: text, consentVersion: CONSENT_VERSION, kind: "share" },
    );
    setPosting(false);
    if (result.status === 200 && result.body?.crisis === true) {
      setNotice("It sounds like you may be going through a lot right now. Your words were not posted.");
      dispatch({ type: "urgent", open: true });
      return;
    }
    if (result.status === 200 && result.body?.post) {
      setPosts((current) => [result.body!.post!, ...current.filter((post) => post.id !== result.body!.post!.id)]);
      setDraft("");
      return;
    }
    if (result.status === 200) {
      setDraft("");
      await loadFeed();
      return;
    }
    if (result.status === 409) {
      setNotice("The consent wording changed. Please review again before posting.");
    } else if (result.status === 403 && result.body?.error === "archived") {
      setNotice("This community is archived and read-only.");
    } else {
      setNotice("Your post could not be shared. Try again.");
    }
  }

  const activeMember = membership !== null && membership.status === "active";

  return (
    <div>
      {postsState === "loading" ? <p className="cx-note" role="status">Loading posts…</p> : null}
      {postsState === "error" ? (
        <div role="alert">
          <p className="cx-note">Posts couldn&rsquo;t be loaded.</p>
          <button type="button" className="cx-mini-btn" onClick={() => { setPostsState("loading"); void loadFeed(); }}>Try again</button>
        </div>
      ) : null}
      {postsState === "denied" ? (
        <p className="cx-note">Join this circle to read and share posts.</p>
      ) : null}
      {postsState === "ready" ? (
        <div className="cx-feed">
          {posts.length === 0 ? (
            <p className="cx-note">No posts yet. Nothing here is invented — yours could be the first.</p>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="cx-post" aria-label={`Post by ${post.author_alias}`}>
                <span className="cx-post-meta">
                  {post.author_alias} · {timeAgo(post.created_at)}
                  {post.kind === "ask" ? " · Question" : ""}
                  {post.status !== "visible" ? " · Held for review" : ""}
                </span>
                <p>{post.body}</p>
                <div className="cx-post-actions">
                  {activeMember && membership && post.author_alias !== membership.alias && !reactionsOff ? (
                    <button
                      type="button"
                      className="cx-mini-btn"
                      onClick={() => void toggleHelpful(post)}
                      aria-label={`Mark post by ${post.author_alias} as helpful`}
                    >
                      {reactions[post.id] ? `Helped · ${reactions[post.id].count}` : "This helped me"}
                    </button>
                  ) : null}
                  <button type="button" className="cx-mini-btn" onClick={() => dispatch({ type: "urgent", open: true })}>
                    Urgent support
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
      {reactionsOff ? <p className="cx-note">Helpful reactions aren&rsquo;t available yet.</p> : null}
      {notice ? (
        <p className="cx-note" role="status">{notice}</p>
      ) : null}
      {activeMember && membership ? (
        <form className="cx-circle-composer" onSubmit={submitPost} aria-label={`Post in ${community.name}`}>
          <label className="cx-label" htmlFor={`cx-composer-${community.id}`}>Share with this circle</label>
          <textarea
            id={`cx-composer-${community.id}`}
            className="cx-textarea"
            value={draft}
            maxLength={4000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="What feels safe to share today?"
          />
          <p className="cx-note">
            Posting as {membership.alias} in {community.name} · Consent {CONSENT_VERSION} · the server checks
            every post and a human moderator can review flagged content.
          </p>
          <div>
            <button type="submit" className="cx-btn cx-btn-primary" disabled={posting || draft.trim().length === 0}>
              {posting ? "Posting…" : "Post to circle"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default function Circles() {
  const { dispatch } = useSession();
  const [state, setState] = useState<"loading" | "unavailable" | "error" | "ready">("loading");
  const [communities, setCommunities] = useState<RealCommunity[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setState("loading");
      const result = await getJson<{ communities?: RealCommunity[] }>("/api/communities");
      if (cancelled) return;
      if (result.status === 503) {
        setState("unavailable");
      } else if (result.status === 200 && Array.isArray(result.body?.communities)) {
        setCommunities(result.body.communities);
        setState("ready");
      } else {
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  if (state === "loading") {
    return (
      <section className="cx-card-white" aria-label="Loading your circles">
        <p className="cx-note" role="status">Loading your circles…</p>
      </section>
    );
  }

  if (state === "unavailable") {
    return (
      <section className="cx-card-white" aria-label="Circles unavailable">
        <p className="cx-kicker">My circles</p>
        <h2>Real communities aren&rsquo;t connected yet</h2>
        <p className="cx-lede">
          This space shows your live circles once the database is connected. Nothing here is simulated: no sample
          members, no invented posts.
        </p>
      </section>
    );
  }

  if (state === "error") {
    return (
      <section className="cx-card-white" aria-label="Circles could not be loaded">
        <p className="cx-kicker">My circles</p>
        <h2>Your circles couldn&rsquo;t be loaded</h2>
        <p className="cx-lede">Check your connection and try again.</p>
        <button type="button" className="cx-btn cx-btn-primary" onClick={() => setReloadKey((value) => value + 1)}>
          Try again
        </button>
      </section>
    );
  }

  const joined = communities.filter((community) => community.joined);

  if (joined.length === 0) {
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
      {joined.map((community) => (
        <section key={community.id} className="cx-card-white" aria-label={community.name}>
          <div className="cx-circle-head">
            <div>
              <div className="cx-card-meta">
                <span className="cx-tag cx-tag-dark">{community.visibility === "public" ? "Public" : "Members only"}</span>
                <span className="cx-tag cx-tag-green">Joined</span>
                <span className="cx-tag">
                  {community.memberCount} {community.memberCount === 1 ? "member" : "members"} · {community.postCount}{" "}
                  {community.postCount === 1 ? "post" : "posts"}
                </span>
              </div>
              <h2>{community.name}</h2>
              <p className="cx-card-desc">{community.description || "No description yet."}</p>
            </div>
          </div>
          <div className="cx-disclaimer">
            Real posts from real members of this circle. Humans moderate this space — flagged posts go to human
            review, and this community is not monitored continuously.
          </div>
          <h3 className="cx-section-title">Conversation feed</h3>
          <CircleFeed community={community} />
          <p className="cx-note">
            <Link className="cx-btn cx-btn-soft" href={`/communities/${community.id}`}>Open full community</Link>
          </p>
        </section>
      ))}
    </div>
  );
}
