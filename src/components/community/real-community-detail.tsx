"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthCard from "@/components/account/auth-card";
import { CommunityHelperCard } from "@/components/community/community-helper-card";
import { CommunityGuide } from "@/components/community/community-guide";
import { CommunityProgressCard } from "@/components/community/community-progress-card";
import { CONSENT_VERSION } from "@/lib/consent";

type Community = {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "member";
  launch_status?: "pending_review" | "approved" | "rejected" | "archived";
  review_note?: string;
  memberCount: number;
  postCount: number;
  recentPostCount: number;
  moderatorCount: number;
};

type Membership = { id: string; alias: string; role: "member" | "moderator"; status: string };

type Post = { id: string; body: string; status: string; created_at: string; author_alias: string; kind?: string; replyCount: number; lastReplyAt: string | null };

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
  draftKey,
  showIntent,
  intent,
  onIntentChange,
}: {
  id: string;
  actionLabel: "Post in this community" | "Reply in this thread";
  alias: string;
  communityName: string;
  maxLength: number;
  onSubmit: (text: string) => Promise<boolean | "crisis">;
  busy: boolean;
  draftKey?: string;
  showIntent?: boolean;
  intent?: "share" | "ask";
  onIntentChange?: (intent: "share" | "ask") => void;
}) {
  const [text, setText] = useState(() => (typeof window === "undefined" || !draftKey ? "" : window.localStorage.getItem(`harmonise-draft-${draftKey}`) ?? ""));
  const [crisis, setCrisis] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function submit() {
    if (!confirmed) return;
    const ok = await onSubmit(text.trim());
    if (ok === "crisis") {
      setCrisis(true);
      return;
    }
    if (ok) {
      setText("");
      setReviewing(false);
      setConfirmed(false);
      if (draftKey) window.localStorage.removeItem(`harmonise-draft-${draftKey}`);
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
          setCrisis(false);
          if (draftKey) window.localStorage.setItem(`harmonise-draft-${draftKey}`, event.target.value);
        }}
        className="w-full rounded-lg border border-[var(--line)] bg-white p-3"
        placeholder="Write here. Nothing is shared until you review and confirm."
      />
      {showIntent && (<>
        <div className="mt-2 flex gap-2" role="group" aria-label="Post intent">
          <button type="button" onClick={() => onIntentChange?.("share")} aria-pressed={intent !== "ask"} className={`rounded-full px-4 py-1.5 text-sm ${intent !== "ask" ? "bg-[var(--ink)] text-white" : "border border-[var(--line)]"}`}>
            Share
          </button>
          <button type="button" onClick={() => onIntentChange?.("ask")} aria-pressed={intent === "ask"} className={`rounded-full px-4 py-1.5 text-sm ${intent === "ask" ? "bg-[var(--ink)] text-white" : "border border-[var(--line)]"}`}>
            Ask a question
          </button>
        </div>
        {intent === "ask" && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Members usually reply within a day; a facilitator checks unanswered questions daily.
          </p>
        )}
      </>)}
      {crisis && (
        <p role="alert" className="mt-3 rounded-lg bg-[var(--peach)] p-3 text-sm">
          It sounds like you may be going through a lot right now. If you could use support beyond this community, findahelpline.com lists free helplines worldwide. Your words were not posted.
        </p>
      )}
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
  agentName,
  decisionId,
  featuredInitially,
}: {
  post: Post;
  community: Community;
  membership: Membership | null;
  moderator: boolean;
  onChanged: () => void;
  agentName: string | null;
  decisionId: string | null;
  featuredInitially: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [armingBlock, setArmingBlock] = useState(false);
  const [reaction, setReaction] = useState<{ count: number; reacted: boolean } | null>(null);
  const [reactionsOn, setReactionsOn] = useState(true);
  const [appealing, setAppealing] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [featured, setFeatured] = useState(featuredInitially);

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
    const result = await sendJson<{ crisis?: boolean }>(`/api/communities/${community.id}/posts/${post.id}/replies`, "POST", {
      body: text,
      consentVersion: CONSENT_VERSION,
    });
    setBusy(false);
    if (result.status === 200) {
      if (result.body?.crisis === true) return "crisis";
      await loadReplies();
      return true;
    }
    if (result.status === 403 && (result.body as { error?: string } | null)?.error === "archived") {
      setNote("This community is archived and read-only.");
      return false;
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

  async function toggleHelpful() {
    setBusy(true);
    const result = await sendJson<{ count?: number; reacted?: boolean }>(`/api/communities/${community.id}/posts/${post.id}/reactions`, "POST");
    setBusy(false);
    if (result.status === 503) { setReactionsOn(false); return; }
    if (result.status === 200 && typeof result.body?.count === "number") {
      setReaction({ count: result.body.count, reacted: result.body.reacted === true });
    } else {
      setNote("That could not be saved. Try again.");
    }
  }

  async function toggleFeatured() {
    setBusy(true);
    const result = featured
      ? await sendJson(`/api/communities/${community.id}/featured?postId=${post.id}`, "DELETE")
      : await sendJson(`/api/communities/${community.id}/featured`, "POST", { postId: post.id });
    setBusy(false);
    if (result.status === 200) {
      setFeatured(!featured);
      setNote(featured ? "Removed from shared journeys." : "Thank you. Your journey can now help others find this circle.");
    } else if (result.status === 503) {
      setNote("Featuring is not available yet.");
    } else {
      setNote("That could not be saved. Try again.");
    }
  }

  async function submitAppeal() {
    if (!decisionId || !appealReason.trim()) return;
    setBusy(true);
    const result = await sendJson(`/api/moderation/appeal`, "POST", { decisionId, reason: appealReason.trim() });
    setBusy(false);
    if (result.status === 200) {
      setAppealing(false);
      setAppealReason("");
      setNote("Appeal sent. A different reviewer will take a second look.");
      onChanged();
    } else {
      setNote("Your appeal could not be sent. Try again.");
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
        {agentName !== null && post.author_alias === agentName && (
          <span className="rounded-full bg-[var(--lilac)] px-2 py-0.5 text-xs" title="An AI guide for this circle, reviewed by moderators">Guide · AI</span>
        )}
        {post.kind === "ask" && (
          <span className="rounded-full bg-[var(--sage)] px-2 py-0.5 text-xs">Question</span>
        )}
        <span>·</span>
        <time>{new Date(post.created_at).toLocaleString()}</time>
        {post.status !== "visible" && moderator && <span className="rounded-full bg-[var(--peach)] px-2 py-0.5 text-xs">Held for review</span>}
      </div>
      {membership !== null && post.author_alias === membership.alias && post.status !== "visible" && (
        <div role="status" className="mt-2 rounded-lg bg-[var(--peach)] p-3 text-sm">
          {post.status === "held"
            ? "Held for human review â€” only you see this for now. Nothing is decided yet."
            : "Removed by a moderator. You can still appeal below."}{" "}
          {!decisionId && "A moderator decision is still pending."}
        </div>
      )}
      <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
      {note && (
        <p role="status" className="mt-2 text-sm text-[var(--sage-ink)]">
          {note}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void toggle()} aria-expanded={expanded} className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm">
          {expanded ? "Hide replies" : `Read and reply (${post.replyCount})`}
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
        {membership && !ownPost && reactionsOn && (
          <button type="button" disabled={busy} onClick={() => void toggleHelpful()} className="rounded-full px-4 py-2 text-sm underline">
            {reaction ? `Helped · ${reaction.count}` : "This helped me"}
          </button>
        )}
        {ownPost && post.status === "visible" && (
          <button type="button" disabled={busy} onClick={() => void toggleFeatured()} className="rounded-full px-4 py-2 text-sm underline">
            {featured ? "Unfeature my journey" : "Feature my journey"}
          </button>
        )}
        {ownPost && post.status !== "visible" && decisionId && !appealing && (
          <button type="button" onClick={() => setAppealing(true)} className="rounded-full px-4 py-2 text-sm underline">
            Appeal this decision
          </button>
        )}
      </div>
      {appealing && (
        <div className="mt-3 rounded-lg border border-[var(--line)] p-4">
          <label className="mb-1 block text-sm font-semibold" htmlFor={`appeal-${post.id}`}>
            What should a second reviewer know?
          </label>
          <textarea
            id={`appeal-${post.id}`}
            rows={2}
            maxLength={1000}
            value={appealReason}
            onChange={(event) => setAppealReason(event.target.value)}
            className="w-full rounded-lg border border-[var(--line)] bg-white p-3"
            placeholder="What changed, or what did the first review miss?"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={!appealReason.trim() || busy} onClick={() => void submitAppeal()} className="rounded-full bg-[var(--ink)] px-5 py-2 text-sm text-white disabled:opacity-50">
              Send appeal
            </button>
            <button type="button" onClick={() => setAppealing(false)} className="rounded-full px-4 py-2 text-sm underline">
              Cancel
            </button>
          </div>
        </div>
      )}
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
  const [intent, setIntent] = useState<"share" | "ask">("share");
  const [agentName, setAgentName] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Map<string, string>>(new Map());
  const [featuredIds, setFeaturedIds] = useState<Set<string>>(new Set());
  const [featuredPosts, setFeaturedPosts] = useState<Array<{ id: string; body: string; author_alias: string }>>([]);
  const [pendingPosts, setPendingPosts] = useState<{ posts: Post[]; count: number } | null>(null);
  const [sinceCount, setSinceCount] = useState(0);
  const postsRef = useRef<Post[]>([]);

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
    if (info.body.community.launch_status === "pending_review") {
      setPosts([]);
      setPostsState("denied");
      return;
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
    void (async () => {
      await loadAll();
    })();
  }, [loadAll]);

  useEffect(() => {
    postsRef.current = posts;
  });

  useEffect(() => {
    if (status !== "ready") return;
    void (async () => {
      const agent = await getJson<{ agent?: { displayName?: string } }>(`/api/communities/${communityId}/agent`);
      if (agent.status === 200 && agent.body?.agent?.displayName) setAgentName(agent.body.agent.displayName);
      const mine = await getJson<{ outcomes?: Array<{ targetPostId: string | null; decision: { id: string } | null }> }>(`/api/moderation/my-decisions?community=${communityId}`);
      if (mine.status === 200 && Array.isArray(mine.body?.outcomes)) {
        const map = new Map<string, string>();
        for (const outcome of mine.body.outcomes) {
          if (outcome.targetPostId && outcome.decision) map.set(outcome.targetPostId, outcome.decision.id);
        }
        setDecisions(map);
      }
      const feat = await getJson<{ posts?: Array<{ id: string; body: string; author_alias: string }> }>(`/api/communities/${communityId}/featured`);
      if (feat.status === 200 && Array.isArray(feat.body?.posts)) {
        setFeaturedPosts(feat.body.posts.slice(0, 2));
        setFeaturedIds(new Set(feat.body.posts.map((post) => post.id)));
      }
    })();
  }, [status, communityId]);

  useEffect(() => {
    if (postsState !== "ready") return;
    const key = `harmonise-visit-${communityId}`;
    const last = window.localStorage.getItem(key);
    window.localStorage.setItem(key, new Date().toISOString());
    if (!last) return;
    void (async () => {
      const result = await getJson<{ posts?: Post[] }>(`/api/communities/${communityId}/posts?since=${encodeURIComponent(last)}`);
      if (result.status === 200 && Array.isArray(result.body?.posts) && result.body.posts.length > 0) {
        setSinceCount(result.body.posts.length);
      }
    })();
  }, [communityId, postsState]);

  useEffect(() => {
    if (postsState !== "ready") return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      const result = await getJson<{ posts?: Post[] }>(`/api/communities/${communityId}/posts`);
      if (result.status !== 200 || !Array.isArray(result.body?.posts)) return;
      const known = new Set(postsRef.current.map((post) => post.id));
      const fresh = result.body.posts.filter((post) => !known.has(post.id));
      if (fresh.length > 0) setPendingPosts({ posts: result.body.posts, count: fresh.length });
    }, 15000);
    return () => window.clearInterval(timer);
  }, [communityId, postsState]);

  async function join() {
    if (alias.trim().length < 2) {
      setNotice("Choose an alias of at least 2 characters.");
      return;
    }
    setBusy(true);
    const result = await sendJson<{ membership?: Membership; error?: string }>(`/api/communities/${communityId}/join`, "POST", { alias: alias.trim() });
    setBusy(false);
    if (result.status === 200 && result.body?.membership) {
      setMembership(result.body.membership);
      setNotice(`You're in as ${result.body.membership.alias}. Read quietly as long as you like.`);
      await loadAll();
    } else if (result.status === 400 && result.body?.error === "invalid-alias") {
      setNotice("That alias doesn't fit - use 2 or more characters, letters and spaces only.");
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

  async function setArchived(archived: boolean) {
    if (archived && !window.confirm("Archive this community? Members can still read, but no one can post. Nothing is deleted.")) return;
    setBusy(true);
    const result = await sendJson(`/api/communities/${communityId}`, "PATCH", { archived });
    setBusy(false);
    if (result.status === 200) {
      setNotice(archived ? "Archived. Members can read but not post." : "Revived. Members can post again.");
      await loadAll();
    } else if (result.status === 503) {
      setNotice("Archiving needs a database update that has not been applied yet.");
    } else {
      setNotice("That did not work. Try again.");
    }
  }

  async function submitPost(text: string) {
    setBusy(true);
    const result = await sendJson<{ crisis?: boolean; error?: string }>(`/api/communities/${communityId}/posts`, "POST", { body: text, consentVersion: CONSENT_VERSION, kind: intent });
    setBusy(false);
    if (result.status === 200) {
      if (result.body?.crisis === true) return "crisis";
      await loadAll();
      return true;
    }
    if (result.status === 403 && result.body?.error === "archived") {
      setNotice("This community is archived and read-only.");
      return false;
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
          {community.launch_status === "pending_review" ? "Private proposal" : community.visibility === "public" ? "Public community" : "Members-only community"} · real members, real posts
        </p>
        <h2 className="mt-1 text-3xl font-semibold">{community.name}</h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{community.description || "No description yet."}</p>
        <p className="mt-2 text-sm font-semibold">
          {community.memberCount} {community.memberCount === 1 ? "member" : "members"} · {community.postCount}{" "}
          {community.postCount === 1 ? "post" : "posts"} · {community.recentPostCount > 0 ? `${community.recentPostCount} new this week` : "quiet right now"}
        </p>
        {community.moderatorCount > 0 && (
          <p className="mt-1 text-sm text-[var(--muted)]">Looked after by human moderators.</p>
        )}
      </div>

      {community.launch_status === "pending_review" && (
        <div role="status" className="rounded-xl border border-[var(--line)] bg-[var(--peach)] p-4">
          <p className="font-semibold">Waiting for human review</p>
          <p className="mt-1 text-sm">This proposal is private. People can’t find, join, or post in it until a reviewer approves the purpose and confirms human coverage.</p>
        </div>
      )}

      {community.launch_status === "rejected" && (
        <div role="status" className="rounded-xl border border-[var(--line)] bg-[var(--peach)] p-4">
          <p className="font-semibold">This proposal was declined — kindly, with a redirect</p>
          {community.review_note ? (
            <p className="mt-1 text-sm">{community.review_note}</p>
          ) : (
            <p className="mt-1 text-sm">A reviewer decided this circle is not the right shape yet. Existing circles may already fit — come browse them with us.</p>
          )}
          <p className="mt-2 text-sm"><Link href="/communities" className="underline">Browse circles</Link></p>
        </div>
      )}

      {community.launch_status === "archived" && (
        <div role="status" className="rounded-xl border border-[var(--line)] bg-[var(--lilac)] p-4">
          <p className="font-semibold">This circle is archived and read-only</p>
          <p className="mt-1 text-sm">Nothing was deleted. Moderators can revive it at any time.</p>
        </div>
      )}

      {notice && (
        <p role="status" className="rounded-lg bg-[var(--peach)] p-3 text-sm">
          {notice}
        </p>
      )}

      {!activeMember && community.launch_status !== "pending_review" && community.launch_status !== "rejected" && community.launch_status !== "archived" && (
        <div className="grid gap-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          <h3 className="text-lg font-semibold">What happens inside</h3>
          <ul className="grid gap-2 text-sm text-[var(--muted)]">
            <li>Read quietly for as long as you like — posting is never required.</li>
            <li>Share in your words, or ask a question when you want replies.</li>
            <li>Humans moderate; nothing is decided by software alone.</li>
          </ul>
          <ol className="grid gap-1 text-sm font-semibold">
            {!signedIn && <li>1. Create a private account (under a minute).</li>}
            <li>{signedIn ? "1." : "2."} Pick an alias used only in this circle.</li>
          </ol>
        </div>
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
      ) : !activeMember && community.launch_status !== "rejected" && community.launch_status !== "archived" ? (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]">
          {membership?.status === "blocked" ? (
            <p>This account cannot participate in this community.</p>
          ) : (
            <>
              <h3 className="text-lg font-semibold">Join {community.name}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Pick an alias for this community only. It is never linked to your other communities.
                Aliases can&apos;t identify you — avoid your real name or handles you use elsewhere.
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
      ) : membership ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
          <span>
            You are participating as <strong>{membership.alias}</strong>
            {membership.role === "moderator" ? " (moderator)" : ""}.
          </span>
          <button type="button" disabled={busy} onClick={() => void leave()} className="underline">
            Leave this community
          </button>
          {moderator && community.launch_status !== "archived" && (
            <button type="button" disabled={busy} onClick={() => void setArchived(true)} className="underline">
              Archive community
            </button>
          )}
          {moderator && community.launch_status === "archived" && (
            <button type="button" disabled={busy} onClick={() => void setArchived(false)} className="underline">
              Revive community
            </button>
          )}
        </div>
      ) : null}

      {activeMember && community.launch_status !== "rejected" && community.launch_status !== "archived" && (
        <div className="grid gap-4">
          <CommunityHelperCard communityId={communityId} />
          {community.launch_status !== "pending_review" && (
            <CommunityGuide communityId={communityId} communityName={community.name} />
          )}
          {community.launch_status !== "pending_review" && <CommunityProgressCard communityId={communityId} />}
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
      {sinceCount > 0 && (
        <p role="status" className="rounded-lg bg-[var(--sage)] p-3 text-sm">
          {sinceCount} new {sinceCount === 1 ? "post" : "posts"} since your last visit.
        </p>
      )}
      {postsState === "ready" && (
        <div className="grid gap-4">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
            <p className="font-semibold">Welcome in. A few norms keep this circle kind:</p>
            <ul className="mt-2 grid gap-1 text-[var(--muted)]">
              <li>Share your own experience; do not diagnose or give verdicts.</li>
              <li>Ask when you want replies; read quietly whenever you prefer.</li>
              <li>Report anything worrying — a human moderator reviews every report.</li>
            </ul>
          </div>
          {featuredPosts.length > 0 && (
            <div className="rounded-xl border border-[var(--line)] bg-[var(--lilac)] p-4 text-sm">
              <p className="font-semibold">Shared with permission — journeys members featured:</p>
              <ul className="mt-2 grid gap-2">
                {featuredPosts.map((featured) => (
                  <li key={featured.id}>
                    <span className="text-[var(--muted)]">{featured.author_alias}: </span>
                    {featured.body.slice(0, 140)}{featured.body.length > 140 ? "…" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent posts</h3>
            <div className="flex items-center gap-2">
              {pendingPosts && (
                <button
                  type="button"
                  onClick={() => { setPosts(pendingPosts.posts); setPendingPosts(null); }}
                  className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm text-white"
                >
                  {pendingPosts.count} new — show
                </button>
              )}
              <button type="button" onClick={() => void loadAll()} className="rounded-full bg-[var(--sage)] px-4 py-2 text-sm">
                Refresh
              </button>
            </div>
          </div>
          {null}
          {posts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--line)] p-6 text-[var(--muted)]">
              No posts yet. {activeMember ? "Yours could be the first — nothing here is invented." : "Check back after joining."}
            </p>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} community={community} membership={membership} moderator={moderator} onChanged={() => void loadAll()} agentName={agentName} decisionId={decisions.get(post.id) ?? null} featuredInitially={featuredIds.has(post.id)} />
            ))
          )}
          {activeMember && membership && community.launch_status !== "rejected" && community.launch_status !== "archived" && (
            <div className="composer-sticky rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <h4 className="font-semibold">Share with this community</h4>
              <ConsentComposer
                id="new-post"
                actionLabel="Post in this community"
                alias={membership.alias}
                communityName={community.name}
                maxLength={4000}
                busy={busy}
                onSubmit={submitPost}
                draftKey={`post-${communityId}`}
                showIntent
                intent={intent}
                onIntentChange={setIntent}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
