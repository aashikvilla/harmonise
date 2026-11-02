"use client";

import { useCallback, useEffect, useState } from "react";
import AuthCard from "@/components/account/auth-card";
import { CONSENT_VERSION } from "@/lib/consent";

type Community = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "member";
  memberCount: number;
  postCount: number;
};

type Membership = { id: string; alias: string; role: "member" | "moderator"; status: string };

type Post = { id: string; body: string; status: string; created_at: string; author_alias: string };

type Reply = { id: string; body: string; created_at: string; author_alias: string };

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

function ConsentComposer({
  id,
  actionLabel,
  alias,
  communityName,
  maxLength,
  onSubmit,
  busy,
}: {
  id: string;
  actionLabel: "Post in this community" | "Reply in this thread";
  alias: string;
  communityName: string;
  maxLength: number;
  onSubmit: (text: string) => Promise<boolean>;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    if (!confirmed) return;
    const ok = await onSubmit(text.trim());
    if (ok) {
      setText("");
      setReviewing(false);
      setConfirmed(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-[var(--line)] p-4">
      <label className="mb-1 block text-sm font-semibold" htmlFor={`${id}-draft`}>
        Your words, only if you choose to share
      </label>
      <textarea
        id={`${id}-draft`}
        rows={3}
        maxLength={maxLength}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setConfirmed(false);
        }}
        className="w-full rounded-lg border border-[var(--line)] bg-white p-3"
        placeholder="Write here. Nothing is shared until you review and confirm."
      />
      {!reviewing ? (
        <button
          type="button"
          disabled={!text.trim() || busy}
          onClick={() => setReviewing(true)}
          className="mt-3 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm text-white disabled:opacity-50"
        >
          Review audience and text
        </button>
      ) : (
        <div className="mt-3 rounded-lg bg-[var(--lilac)] p-4">
          <p className="text-sm">
            <strong>Alias:</strong> {alias} · this community only
          </p>
          <p className="text-sm">
            <strong>Audience:</strong> members of {communityName}
          </p>
          <p className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 text-sm">{text.trim()}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Consent {CONSENT_VERSION} · your private conversations are never included · you can delete this later
          </p>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1 h-5 w-5"
            />
            I reviewed this exact text and audience.
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!confirmed || busy}
              onClick={() => void submit()}
              className="rounded-full bg-[var(--teal)] px-5 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {busy ? "Sharing…" : actionLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                setReviewing(false);
                setConfirmed(false);
              }}
              className="rounded-full px-4 py-2.5 text-sm underline"
            >
              Keep editing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({
  post,
  community,
  membership,
  moderator,
  onChanged,
}: {
  post: Post;
  community: Community;
  membership: Membership | null;
  moderator: boolean;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [armingBlock, setArmingBlock] = useState(false);

  async function loadReplies() {
    const result = await getJson<{ replies?: Reply[] }>(`/api/communities/${community.id}/posts/${post.id}/replies`);
    if (result.status === 200 && Array.isArray(result.body?.replies)) setReplies(result.body.replies);
  }

  async function toggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && replies === null) await loadReplies();
  }

  async function submitReply(text: string) {
    setBusy(true);
    const result = await sendJson(`/api/communities/${community.id}/posts/${post.id}/replies`, "POST", {
      body: text,
      consentVersion: CONSENT_VERSION,
    });
    setBusy(false);
    if (result.status === 200) {
      await loadReplies();
      return true;
    }
    setNote(result.status === 409 ? "The consent wording changed. Please review again." : "Your reply could not be shared. Try again.");
    return false;
  }

  async function submitReport() {
    if (!reason.trim()) return;
    setBusy(true);
    const result = await sendJson(`/api/communities/${community.id}/reports`, "POST", { postId: post.id, reason: reason.trim() });
    setBusy(false);
    if (result.status === 200) {
      setReporting(false);
      setReason("");
      setNote("Thank you. A human moderator will review this report.");
    } else {
      setNote("Your report could not be sent. Try again.");
    }
  }

  async function blockAuthor() {
    if (!armingBlock) {
      setArmingBlock(true);
      return;
    }
    setBusy(true);
    const result = await sendJson(`/api/communities/${community.id}/blocks`, "POST", { alias: post.author_alias });
    setBusy(false);
    setArmingBlock(false);
    if (result.status === 200) {
      onChanged();
    } else {
      setNote("That member could not be blocked. Try again.");
    }
  }

  async function deletePost() {
    setBusy(true);
    const result = await sendJson(`/api/communities/${community.id}/posts/${post.id}`, "DELETE");
    setBusy(false);
    if (result.status === 200) {
      onChanged();
    } else {
      setNote("This post could not be deleted. Try again.");
    }
  }

  const ownPost = membership !== null && post.author_alias === membership.alias;

  return (
    <article className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
        <strong className="text-[var(--ink)]">{post.author_alias}</strong>
        <span>·</span>
        <time>{new Date(post.created_at).toLocaleString()}</time>
        {post.status !== "visible" && moderator && <span className="rounded-full bg-[var(--peach)] px-2 py-0.5 text-xs">Held for review</span>}
      </div>
      <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
      {note && (
        <p role="status" className="mt-2 text-sm text-[var(--sage-ink)]">
          {note}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void toggle()} aria-expanded={expanded} className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm">
          {expanded ? "Hide replies" : "Read and reply"}
        </button>
        {membership && !reporting && (
          <button type="button" onClick={() => setReporting(true)} className="rounded-full px-4 py-2 text-sm underline">
            Report to moderators
          </button>
        )}
        {membership && !ownPost && (
          <button type="button" disabled={busy} onClick={() => void blockAuthor()} className="rounded-full px-4 py-2 text-sm underline">
            {armingBlock ? `Block ${post.author_alias}? Tap again to confirm.` : "Block author"}
          </button>
        )}
        {ownPost && (
          <button type="button" disabled={busy} onClick={() => void deletePost()} className="rounded-full px-4 py-2 text-sm underline">
            Delete my post
          </button>
        )}
      </div>
      {reporting && (
        <div className="mt-3 rounded-lg border border-[var(--line)] p-4">
          <label className="mb-1 block text-sm font-semibold" htmlFor={`report-${post.id}`}>
            What should a human moderator know?
          </label>
          <textarea
            id={`report-${post.id}`}
            rows={2}
            maxLength={1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white p-3"
            placeholder="A sentence about why this needs review."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!reason.trim() || busy}
              onClick={() => void submitReport()}
              className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white disabled:opacity-50"
            >
              Send report
            </button>
            <button type="button" onClick={() => setReporting(false)} className="rounded-full px-4 py-2 text-sm underline">
              Cancel
            </button>
          </div>
        </div>
      )}
      {expanded && (
        <div className="mt-4 border-t border-[var(--line)] pt-3">
          {replies === null ? (
            <p role="status" className="text-sm text-[var(--muted)]">Loading replies…</p>
          ) : replies.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No replies yet.</p>
          ) : (
            <ul className="grid gap-3">
              {replies.map((reply) => (
                <li key={reply.id} className="rounded-lg bg-[var(--paper)] p-3">
                  <p className="text-sm text-[var(--muted)]">
                    <strong className="text-[var(--ink)]">{reply.author_alias}</strong> · {new Date(reply.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{reply.body}</p>
                </li>
              ))}
            </ul>
          )}
          {membership && (
            <ConsentComposer
              id={`reply-${post.id}`}
              actionLabel="Reply in this thread"
              alias={membership.alias}
              communityName={community.name}
              maxLength={2000}
              busy={busy}
              onSubmit={submitReply}
            />
          )}
        </div>
      )}
    </article>
  );
}

export default function RealCommunityDetail({ communityId }: { communityId: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "unavailable" | "error">("loading");
  const [postsState, setPostsState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [community, setCommunity] = useState<Community | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [moderator, setModerator] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [alias, setAlias] = useState("");
  const [blocked, setBlocked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const loadAll = useCallback(async () => {
    const config = await getJson<{ databaseEnabled?: unknown }>("/api/auth/config");
    if (config.body?.databaseEnabled !== true) {
      setStatus("unavailable");
      return;
    }
    const info = await getJson<{ community?: Community }>(`/api/communities/${communityId}`);
    if (info.status === 404) {
      setStatus("missing");
      return;
    }
    if (info.status !== 200 || !info.body?.community) {
      setStatus("error");
      return;
    }
    setCommunity(info.body.community);
    setStatus("ready");
    const me = await getJson("/api/auth/me");
    const authed = me.status === 200;
    setSignedIn(authed);
    if (authed) {
      const mine = await getJson<{ membership?: Membership | null }>(`/api/communities/${communityId}/membership`);
      setMembership(mine.body?.membership ?? null);
      const blockedList = await getJson<{ blocked?: string[] }>(`/api/communities/${communityId}/blocks`);
      setBlocked(Array.isArray(blockedList.body?.blocked) ? blockedList.body.blocked : []);
    }
    const feed = await getJson<{ posts?: Post[]; moderator?: boolean }>(`/api/communities/${communityId}/posts`);
    if (feed.status === 200 && Array.isArray(feed.body?.posts)) {
      setPosts(feed.body.posts);
      setModerator(feed.body.moderator === true);
      setPostsState("ready");
    } else if (feed.status === 401 || feed.status === 403) {
      setPostsState("denied");
    } else {
      setPostsState("error");
    }
  }, [communityId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function join() {
    if (alias.trim().length < 2) {
      setNotice("Choose an alias of at least 2 characters.");
      return;
    }
    setBusy(true);
    const result = await sendJson<{ membership?: Membership }>(`/api/communities/${communityId}/join`, "POST", { alias: alias.trim() });
    setBusy(false);
    if (result.status === 200 && result.body?.membership) {
      setMembership(result.body.membership);
      setNotice("");
      await loadAll();
    } else if (result.status === 403) {
      setNotice("This account cannot join this community.");
    } else {
      setNotice("Joining did not work. Try again.");
    }
  }

  async function unblock(aliasToRemove: string) {
    setBusy(true);
    const result = await sendJson(`/api/communities/${communityId}/blocks?alias=${encodeURIComponent(aliasToRemove)}`, "DELETE");
    setBusy(false);
    if (result.status === 200) {
      await loadAll();
    } else {
      setNotice("Unblocking did not work. Try again.");
    }
  }

  async function leave() {
    setBusy(true);
    const result = await sendJson(`/api/communities/${communityId}/leave`, "POST");
    setBusy(false);
    if (result.status === 200) {
      setMembership(null);
      await loadAll();
    } else {
      setNotice("Leaving did not work. Try again.");
    }
  }

  async function submitPost(text: string) {
    setBusy(true);
    const result = await sendJson(`/api/communities/${communityId}/posts`, "POST", { body: text, consentVersion: CONSENT_VERSION });
    setBusy(false);
    if (result.status === 200) {
      await loadAll();
      return true;
    }
    setNotice(result.status === 409 ? "The consent wording changed. Please review again." : "Your post could not be shared. Try again.");
    return false;
  }

  if (status === "loading") return <p role="status" className="text-[var(--muted)]">Loading community…</p>;
  if (status === "unavailable") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
        <h2 className="text-xl font-semibold">Real communities aren&apos;t connected yet</h2>
        <p className="mt-2 text-[var(--muted)]">This page shows live community content once the database is connected.</p>
      </div>
    );
  }
  if (status === "missing") {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" role="alert">
        <h2 className="text-xl font-semibold">No community here</h2>
        <p className="mt-2 text-[var(--muted)]">This community does not exist or is no longer available.</p>
      </div>
    );
  }
  if (status === "error" || !community) {
    return (
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]" role="alert">
        <h2 className="text-xl font-semibold">This community couldn&apos;t be loaded</h2>
        <button type="button" onClick={() => void loadAll()} className="mt-4 rounded-full bg-[var(--ink)] px-5 py-2.5 text-white">
          Try again
        </button>
      </div>
    );
  }

  const activeMember = membership !== null && membership.status === "active";

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          {community.visibility === "public" ? "Public community" : "Members-only community"} · real members, real posts
        </p>
        <h2 className="mt-1 text-3xl font-semibold">{community.name}</h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{community.description || "No description yet."}</p>
        <p className="mt-2 text-sm font-semibold">
          {community.memberCount} {community.memberCount === 1 ? "member" : "members"} · {community.postCount}{" "}
          {community.postCount === 1 ? "post" : "posts"}
        </p>
      </div>

      {notice && (
        <p role="status" className="rounded-lg bg-[var(--peach)] p-3 text-sm">
          {notice}
        </p>
      )}

      {!signedIn ? (
        <div className="grid gap-4">
          {community.visibility === "member" && (
            <p className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
              Posts in this community are visible to members only. Sign in and join to read them — quiet reading
              without posting is always allowed once you join.
            </p>
          )}
          <AuthCard heading="Sign in to join this community" onSignedIn={() => void loadAll()} />
        </div>
      ) : !activeMember ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          {membership?.status === "blocked" ? (
            <p>This account cannot participate in this community.</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold">Join {community.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pick an alias for this community only. It is never linked to your other communities.
              </p>
              <label className="mb-1 mt-3 block text-sm font-semibold" htmlFor="join-alias">
                Your alias here
              </label>
              <input
                id="join-alias"
                value={alias}
                maxLength={40}
                onChange={(event) => setAlias(event.target.value)}
                className="w-full max-w-sm rounded-lg border border-[var(--line)] bg-white p-3"
                placeholder="e.g. Quiet River"
              />
              <div className="mt-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void join()}
                  className="rounded-full bg-[var(--teal)] px-5 py-2.5 text-sm text-white disabled:opacity-50"
                >
                  {busy ? "Joining…" : "Join this community"}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
          <span>
            You are participating as <strong>{membership.alias}</strong>
            {membership.role === "moderator" ? " (moderator)" : ""}.
          </span>
          <button type="button" disabled={busy} onClick={() => void leave()} className="underline">
            Leave this community
          </button>
        </div>
      )}

      {activeMember && blocked.length > 0 && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
          <h3 className="font-semibold">Blocked in this community</h3>
          <p className="mt-1 text-[var(--muted)]">
            You do not see posts or replies from these aliases. Blocking never notifies them and never replaces reporting.
          </p>
          <ul className="mt-2 grid gap-2">
            {blocked.map((blockedAlias) => (
              <li key={blockedAlias} className="flex items-center justify-between gap-3">
                <strong>{blockedAlias}</strong>
                <button type="button" disabled={busy} onClick={() => void unblock(blockedAlias)} className="underline">
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {postsState === "loading" && (
        <p role="status" className="text-[var(--muted)]">Loading posts…</p>
      )}
      {postsState === "error" && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6" role="alert">
          <p>Posts couldn&apos;t be loaded.</p>
          <button type="button" onClick={() => void loadAll()} className="mt-3 rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white">
            Try again
          </button>
        </div>
      )}
      {postsState === "denied" && signedIn && !activeMember && community.visibility === "member" && (
        <p className="text-[var(--muted)]">Join above to read and share posts.</p>
      )}
      {postsState === "ready" && (
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent posts</h3>
            <button type="button" onClick={() => void loadAll()} className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm">
              Refresh
            </button>
          </div>
          {activeMember && membership && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <h4 className="font-semibold">Share with this community</h4>
              <ConsentComposer
                id="new-post"
                actionLabel="Post in this community"
                alias={membership.alias}
                communityName={community.name}
                maxLength={4000}
                busy={busy}
                onSubmit={submitPost}
              />
            </div>
          )}
          {posts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-[var(--muted)]">
              No posts yet. {activeMember ? "Yours could be the first — nothing here is invented." : "Check back after joining."}
            </p>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} community={community} membership={membership} moderator={moderator} onChanged={() => void loadAll()} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
