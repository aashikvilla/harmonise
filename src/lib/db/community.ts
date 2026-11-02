import { randomUUID } from "node:crypto";
import { CONSENT_VERSION, sha256Hex } from "@/lib/consent";
import { detectCrisis } from "@/lib/connect/catalog";
import { requestMetaChatDetailed } from "@/lib/meta-model";
import { getCommunityProgressSummary } from "@/lib/community-progress";
import type {
  CommunityRow,
  CommunityAgentRow,
  ConsentRecordRow,
  MembershipRow,
  PostReactionRow,
  PostReplyRow,
  PostRow,
  PromotionRequestRow,
  ReportRow,
} from "@/lib/db/types";
import { SupabaseError, isUuid, selectSingle, supabaseCount, supabaseRest } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { enqueueModerationEvent } from "@/lib/db/moderation";

export type CommunityWithCounts = CommunityRow & { memberCount: number; postCount: number; recentPostCount: number; joined: boolean; moderatorCount: number };
export type PublicCommunity = Omit<CommunityWithCounts, "created_by" | "reviewed_by" | "reviewed_at" | "coverage_confirmed_at">;
export type PostWithAuthor = PostRow & { author_alias: string; replyCount: number; lastReplyAt: string | null };

/** True when the failure plausibly means migration 0005 is not applied live yet. */
function isMissingMigration(error: unknown) {
  return error instanceof SupabaseError && (error.status === 400 || error.status === 404);
}

async function communityLaunchStatus(communityId: string): Promise<string | null> {
  const rows = await supabaseRest<CommunityRow[]>("communities", { query: `?id=eq.${communityId}&select=launch_status` });
  return selectSingle(rows)?.launch_status ?? null;
}
export type ReplyWithAuthor = PostReplyRow & { author_alias: string };

export function publicCommunity(community: CommunityWithCounts): PublicCommunity {
  const safe: Record<string, unknown> = { ...community };
  delete safe.created_by;
  delete safe.reviewed_by;
  delete safe.reviewed_at;
  delete safe.coverage_confirmed_at;
  return safe as PublicCommunity;
}

export function validCommunityId(value: string) {
  return /^[a-z0-9-]{3,48}$/.test(value);
}

export function validAlias(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const alias = value.trim().replace(/\s+/g, " ");
  if (alias.length < 2 || alias.length > 40) return null;
  return alias;
}

export async function listCommunities(userId?: string): Promise<CommunityWithCounts[]> {
  const publicRows = await supabaseRest<CommunityRow[]>("communities", {
    query: "?launch_status=eq.approved&select=*&order=name.asc",
  });
  const ownedPending = userId
    ? await supabaseRest<CommunityRow[]>("communities", {
        query: `?launch_status=eq.pending_review&created_by=eq.${userId}&select=*&order=created_at.desc`,
      })
    : [];
  const rows = [...publicRows, ...ownedPending];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const joinedIds = new Set<string>();
  if (userId) {
    const mine = await supabaseRest<MembershipRow[]>("memberships", {
      query: `?user_id=eq.${userId}&status=eq.active&select=community_id`,
    });
    for (const row of mine) joinedIds.add(row.community_id);
  }
  return Promise.all(
    rows.map(async (community) => {
      const [memberCount, postCount, recentPostCount, moderatorCount] = await Promise.all([
        supabaseCount("memberships", `?community_id=eq.${community.id}&status=eq.active`),
        supabaseCount("posts", `?community_id=eq.${community.id}&status=eq.visible`),
        supabaseCount("posts", `?community_id=eq.${community.id}&status=eq.visible&created_at=gte.${weekAgo}`),
        supabaseCount("memberships", `?community_id=eq.${community.id}&status=eq.active&role=eq.moderator`),
      ]);
      return { ...community, memberCount, postCount, recentPostCount, joined: joinedIds.has(community.id), moderatorCount };
    }),
  );
}

export async function getCommunityWithCounts(id: string): Promise<CommunityWithCounts | null> {
  const rows = await supabaseRest<CommunityRow[]>("communities", { query: `?id=eq.${id}&select=*` });
  const community = selectSingle(rows);
  if (!community) return null;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [memberCount, postCount, recentPostCount, moderatorCount] = await Promise.all([
    supabaseCount("memberships", `?community_id=eq.${id}&status=eq.active`),
    supabaseCount("posts", `?community_id=eq.${id}&status=eq.visible`),
    supabaseCount("posts", `?community_id=eq.${id}&status=eq.visible&created_at=gte.${weekAgo}`),
    supabaseCount("memberships", `?community_id=eq.${id}&status=eq.active&role=eq.moderator`),
  ]);
  return { ...community, memberCount, postCount, recentPostCount, joined: false, moderatorCount };
}

export async function createPendingCommunity(input: {
  id: string;
  name: string;
  description: string;
  topics: string[];
  ownerId: string;
}): Promise<CommunityRow> {
  const rows = await supabaseRest<CommunityRow[]>("rpc/create_pending_community", {
    method: "POST",
    body: {
      p_id: input.id,
      p_name: input.name,
      p_description: input.description,
      p_topics: input.topics,
      p_owner_id: input.ownerId,
    },
  });
  const created = selectSingle(rows);
  if (!created) throw new Error("community not created");
  return created;
}

export async function getCommunityAgent(communityId: string): Promise<CommunityAgentRow | null> {
  const rows = await supabaseRest<CommunityAgentRow[]>("community_moderator_agents", {
    query: `?community_id=eq.${encodeURIComponent(communityId)}&select=id,community_id,display_name,status,community_context,created_at&limit=1`,
  });
  return selectSingle(rows);
}

export async function reviewPendingCommunity(communityId: string, reviewerId: string, coverageConfirmed: boolean) {
  const rows = await supabaseRest<CommunityRow[]>("rpc/review_community_launch", {
    method: "POST",
    body: { p_community_id: communityId, p_reviewer_id: reviewerId, p_coverage_confirmed: coverageConfirmed },
  });
  return selectSingle(rows);
}

export async function declinePendingCommunity(communityId: string, reviewerId: string, note: string) {
  const rows = await supabaseRest<CommunityRow[]>("communities", {
    method: "PATCH",
    query: `?id=eq.${communityId}&launch_status=eq.pending_review`,
    body: { launch_status: "rejected", reviewed_by: reviewerId, reviewed_at: new Date().toISOString() },
    prefer: "return=representation",
  });
  const declined = selectSingle(rows);
  if (!declined) return null;
  try {
    await supabaseRest("communities", {
      method: "PATCH",
      query: `?id=eq.${communityId}`,
      body: { review_note: note },
    });
  } catch {
    // Pre-migration: status is recorded, the note degrades away.
  }
  return declined;
}

export async function setCommunityArchived(userId: string, communityId: string, archived: boolean) {
  if (!(await isModerator(userId, communityId))) return { error: "forbidden" } as const;
  try {
    const rows = await supabaseRest<CommunityRow[]>("communities", {
      method: "PATCH",
      query: `?id=eq.${communityId}`,
      body: { launch_status: archived ? "archived" : "approved" },
      prefer: "return=representation",
    });
    return { community: selectSingle(rows) ?? null };
  } catch {
    return null;
  }
}

export async function listPendingCommunityReviews() {
  return supabaseRest<CommunityRow[]>("communities", {
    query: "?launch_status=eq.pending_review&select=id,name,description,topics,created_at&order=created_at.asc",
  });
}

export async function getMembership(userId: string, communityId: string): Promise<MembershipRow | null> {
  const rows = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?user_id=eq.${userId}&community_id=eq.${communityId}&select=*`,
  });
  return selectSingle(rows);
}

export async function isModerator(userId: string, communityId: string) {
  const membership = await getMembership(userId, communityId);
  return membership?.role === "moderator" && membership.status === "active";
}

export type JoinResult = { membership: MembershipRow } | { error: "not-found" | "blocked" };

export async function joinCommunity(userId: string, communityId: string, alias: string): Promise<JoinResult> {
  await ensureProfile(userId);
  const community = await getCommunityWithCounts(communityId);
  if (!community || community.launch_status !== "approved") return { error: "not-found" };
  const existing = await getMembership(userId, communityId);
  if (existing?.status === "blocked") return { error: "blocked" };
  if (existing) {
    const rows = await supabaseRest<MembershipRow[]>("memberships", {
      method: "PATCH",
      query: `?id=eq.${existing.id}`,
      body: { status: "active", alias },
      prefer: "return=representation",
    });
    return { membership: selectSingle(rows) ?? existing };
  }
  const rows = await supabaseRest<MembershipRow[]>("memberships", {
    method: "POST",
    body: { community_id: communityId, user_id: userId, alias },
    prefer: "return=representation",
  });
  const created = selectSingle(rows);
  if (!created) throw new Error("join failed");
  return { membership: created };
}

export async function leaveCommunity(userId: string, communityId: string) {
  const existing = await getMembership(userId, communityId);
  if (!existing || existing.status !== "active") return false;
  await supabaseRest("memberships", { method: "PATCH", query: `?id=eq.${existing.id}`, body: { status: "left" } });
  return true;
}

export type PostsAccess = { ok: true; moderator: boolean } | { ok: false; reason: "not-found" | "forbidden" | "signed-out" };

export async function checkPostsAccess(userId: string | null, communityId: string): Promise<PostsAccess> {
  const community = await getCommunityWithCounts(communityId);
  if (!community || community.launch_status !== "approved") return { ok: false, reason: "not-found" };
  if (community.visibility === "public") {
    const moderator = userId ? await isModerator(userId, communityId) : false;
    return { ok: true, moderator };
  }
  if (!userId) return { ok: false, reason: "signed-out" };
  const membership = await getMembership(userId, communityId);
  if (!membership || membership.status !== "active") return { ok: false, reason: "forbidden" };
  return { ok: true, moderator: membership.role === "moderator" };
}

async function aliasesFor(membershipIds: string[]) {
  if (membershipIds.length === 0) return new Map<string, string>();
  const rows = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?id=in.(${membershipIds.join(",")})&select=id,alias`,
  });
  return new Map(rows.map((row) => [row.id, row.alias]));
}

export async function listPosts(
  communityId: string,
  moderator: boolean,
  excludeMembershipIds: string[] = [],
  since?: string,
  ownMembershipId?: string,
): Promise<PostWithAuthor[]> {
  const statusFilter = moderator ? "" : "&status=eq.visible";
  const sinceFilter = since ? `&created_at=gte.${encodeURIComponent(since)}` : "";
  const rows = await supabaseRest<PostRow[]>("posts", {
    query: `?community_id=eq.${communityId}${statusFilter}${sinceFilter}&order=created_at.desc&select=*&limit=50`,
  });
  if (!moderator && ownMembershipId) {
    const own = await supabaseRest<PostRow[]>("posts", {
      query: `?community_id=eq.${communityId}&author_membership_id=eq.${ownMembershipId}&status=neq.visible&select=*&limit=10`,
    });
    for (const row of own) {
      if (!rows.some((existing) => existing.id === row.id)) rows.push(row);
    }
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const visible = excludeMembershipIds.length > 0 ? rows.filter((row) => !excludeMembershipIds.includes(row.author_membership_id)) : rows;
  const aliases = await aliasesFor([...new Set(visible.map((row) => row.author_membership_id))]);
  const counts = new Map<string, { count: number; lastAt: string | null }>();
  if (visible.length > 0) {
    const ids = visible.map((row) => row.id).join(",");
    const replies = await supabaseRest<Array<{ post_id: string; created_at: string }>>("post_replies", {
      query: `?post_id=in.(${ids})&status=eq.visible&select=post_id,created_at&order=created_at.asc&limit=2000`,
    });
    for (const reply of replies) {
      const entry = counts.get(reply.post_id) ?? { count: 0, lastAt: null };
      entry.count += 1;
      entry.lastAt = reply.created_at;
      counts.set(reply.post_id, entry);
    }
  }
  return visible.map((row) => ({
    ...row,
    author_alias: aliases.get(row.author_membership_id) ?? "Former member",
    replyCount: counts.get(row.id)?.count ?? 0,
    lastReplyAt: counts.get(row.id)?.lastAt ?? null,
  }));
}

export type CreatePostResult = { post: PostWithAuthor } | { error: "not-found" | "forbidden" | "blocked" | "stale-consent" | "crisis" | "archived" };

export async function createPost(
  userId: string,
  communityId: string,
  body: string,
  consentVersion: unknown,
  kind: "share" | "ask" = "share",
): Promise<CreatePostResult> {
  if (consentVersion !== CONSENT_VERSION) return { error: "stale-consent" };
  const text = body.trim();
  if (!text || text.length > 4000) return { error: "forbidden" };
  if (detectCrisis(text)) return { error: "crisis" };
  if ((await communityLaunchStatus(communityId)) === "archived") return { error: "archived" };
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status === "blocked") return { error: "blocked" };
  if (membership.status !== "active") return { error: "forbidden" };
  const consentRows = await supabaseRest<ConsentRecordRow[]>("consent_records", {
    method: "POST",
    body: {
      user_id: userId,
      action: "post",
      audience_community_id: communityId,
      text_sha256: await sha256Hex(text),
      consent_version: CONSENT_VERSION,
    },
    prefer: "return=representation",
  });
  const consent = selectSingle(consentRows);
  if (!consent) throw new Error("consent not recorded");
  let postRows: PostRow[];
  try {
    postRows = await supabaseRest<PostRow[]>("posts", {
      method: "POST",
      body: { community_id: communityId, author_membership_id: membership.id, consent_id: consent.id, body: text, kind },
      prefer: "return=representation",
    });
  } catch (error) {
    if (!isMissingMigration(error)) throw error;
    postRows = await supabaseRest<PostRow[]>("posts", {
      method: "POST",
      body: { community_id: communityId, author_membership_id: membership.id, consent_id: consent.id, body: text },
      prefer: "return=representation",
    });
  }
  const post = selectSingle(postRows);
  if (!post) throw new Error("post not created");
  try {
    await enqueueModerationEvent({
      communityId,
      reportId: null,
      type: "live-flag",
      targetPostId: post.id,
      targetReplyId: null,
      excerpt: text,
    });
  } catch {
    /* A queue failure must never lose the post itself. */
  }
  return { post: { ...post, author_alias: membership.alias, replyCount: 0, lastReplyAt: null } };
}

export async function deleteOwnPost(userId: string, postId: string) {
  if (!isUuid(postId)) return false;
  const rows = await supabaseRest<PostRow[]>("posts", { query: `?id=eq.${postId}&select=id,author_membership_id` });
  const post = selectSingle(rows);
  if (!post) return false;
  const mine = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?id=eq.${post.author_membership_id}&user_id=eq.${userId}&select=id`,
  });
  if (mine.length === 0) return false;
  await supabaseRest("posts", { method: "DELETE", query: `?id=eq.${postId}` });
  const remaining = await supabaseRest<PostRow[]>("posts", { query: `?id=eq.${postId}&select=id` });
  return remaining.length === 0;
}

/** Moderator-only status change, used by Phase 6 decisions. Author deletes use deleteOwnPost. */
export async function setPostStatus(postId: string, status: "visible" | "held" | "removed") {
  if (!isUuid(postId)) return false;
  await supabaseRest("posts", { method: "PATCH", query: `?id=eq.${postId}`, body: { status } });
  return true;
}

export async function setReplyStatus(replyId: string, status: "visible" | "held" | "removed") {
  if (!isUuid(replyId)) return false;
  await supabaseRest("post_replies", { method: "PATCH", query: `?id=eq.${replyId}`, body: { status } });
  return true;
}

export async function listReplies(postId: string, moderator: boolean, excludeMembershipIds: string[] = []): Promise<ReplyWithAuthor[]> {
  if (!isUuid(postId)) return [];
  const statusFilter = moderator ? "" : "&status=eq.visible";
  const rows = await supabaseRest<PostReplyRow[]>("post_replies", {
    query: `?post_id=eq.${postId}${statusFilter}&order=created_at.asc&select=*&limit=100`,
  });
  const visible = excludeMembershipIds.length > 0 ? rows.filter((row) => !excludeMembershipIds.includes(row.author_membership_id)) : rows;
  const aliases = await aliasesFor([...new Set(visible.map((row) => row.author_membership_id))]);
  return visible.map((row) => ({ ...row, author_alias: aliases.get(row.author_membership_id) ?? "Former member" }));
}

export type MemberBlockRow = {
  blocker_membership_id: string;
  blocked_membership_id: string;
  community_id: string;
  created_at: string;
};

export async function blockedMembershipIds(userId: string, communityId: string): Promise<string[]> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return [];
  const rows = await supabaseRest<MemberBlockRow[]>("member_blocks", {
    query: `?blocker_membership_id=eq.${membership.id}&select=blocked_membership_id`,
  });
  return rows.map((row) => row.blocked_membership_id);
}

export async function listBlockedAliases(userId: string, communityId: string): Promise<string[]> {
  const ids = await blockedMembershipIds(userId, communityId);
  if (ids.length === 0) return [];
  const rows = await supabaseRest<MembershipRow[]>("memberships", { query: `?id=in.(${ids.join(",")})&select=alias` });
  return rows.map((row) => row.alias);
}

export type BlockResult = { ok: true } | { error: "not-found" | "forbidden" | "no-such-member" | "cannot-block-self" };

export async function blockMember(userId: string, communityId: string, alias: string): Promise<BlockResult> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status !== "active") return { error: "forbidden" };
  if (membership.alias === alias) return { error: "cannot-block-self" };
  const targets = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?community_id=eq.${communityId}&alias=eq.${encodeURIComponent(alias)}&select=id`,
  });
  const others = targets.filter((target) => target.id !== membership.id);
  if (others.length === 0) return { error: "no-such-member" };
  for (const target of others) {
    await supabaseRest("member_blocks", {
      method: "POST",
      body: { blocker_membership_id: membership.id, blocked_membership_id: target.id, community_id: communityId },
      prefer: "resolution=ignore-duplicates",
    });
  }
  return { ok: true };
}

export async function unblockMember(userId: string, communityId: string, alias: string): Promise<BlockResult> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  const targets = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?community_id=eq.${communityId}&alias=eq.${encodeURIComponent(alias)}&select=id`,
  });
  const others = targets.filter((target) => target.id !== membership.id);
  if (others.length === 0) return { error: "no-such-member" };
  for (const target of others) {
    await supabaseRest("member_blocks", {
      method: "DELETE",
      query: `?blocker_membership_id=eq.${membership.id}&blocked_membership_id=eq.${target.id}`,
    });
  }
  return { ok: true };
}

export type CreateReplyResult = { reply: ReplyWithAuthor } | { error: "not-found" | "forbidden" | "blocked" | "stale-consent" | "crisis" | "archived" };

export async function createReply(
  userId: string,
  communityId: string,
  postId: string,
  body: string,
  consentVersion: unknown,
): Promise<CreateReplyResult> {
  if (!isUuid(postId)) return { error: "not-found" };
  if (consentVersion !== CONSENT_VERSION) return { error: "stale-consent" };
  const text = body.trim();
  if (!text || text.length > 2000) return { error: "forbidden" };
  if (detectCrisis(text)) return { error: "crisis" };
  if ((await communityLaunchStatus(communityId)) === "archived") return { error: "archived" };
  const posts = await supabaseRest<PostRow[]>("posts", { query: `?id=eq.${postId}&community_id=eq.${communityId}&select=id,status` });
  const post = selectSingle(posts);
  if (!post || post.status === "removed") return { error: "not-found" };
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status === "blocked") return { error: "blocked" };
  if (membership.status !== "active") return { error: "forbidden" };
  const consentRows = await supabaseRest<ConsentRecordRow[]>("consent_records", {
    method: "POST",
    body: {
      user_id: userId,
      action: "reply",
      audience_community_id: communityId,
      text_sha256: await sha256Hex(text),
      consent_version: CONSENT_VERSION,
    },
    prefer: "return=representation",
  });
  const consent = selectSingle(consentRows);
  if (!consent) throw new Error("consent not recorded");
  const replyRows = await supabaseRest<PostReplyRow[]>("post_replies", {
    method: "POST",
    body: { post_id: postId, author_membership_id: membership.id, consent_id: consent.id, body: text },
    prefer: "return=representation",
  });
  const reply = selectSingle(replyRows);
  if (!reply) throw new Error("reply not created");
  return { reply: { ...reply, author_alias: membership.alias } };
}

export const MAX_OPEN_REPORTS_PER_COMMUNITY = 200;

export type CreateReportResult = { report: ReportRow } | { error: "not-found" | "forbidden" | "blocked" | "invalid-target" | "community-busy" };

export async function createReport(
  userId: string,
  communityId: string,
  target: { postId?: string; replyId?: string },
  reason: string,
): Promise<CreateReportResult> {
  const text = reason.trim();
  if (!text || text.length > 1000) return { error: "invalid-target" };
  const hasPost = typeof target.postId === "string" && isUuid(target.postId);
  const hasReply = typeof target.replyId === "string" && isUuid(target.replyId);
  if ((hasPost ? 1 : 0) + (hasReply ? 1 : 0) !== 1) return { error: "invalid-target" };
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status === "blocked") return { error: "blocked" };
  if (membership.status !== "active") return { error: "forbidden" };
  const openReports = await supabaseCount("reports", `?community_id=eq.${communityId}&status=eq.open`);
  if (openReports >= MAX_OPEN_REPORTS_PER_COMMUNITY) return { error: "community-busy" };
  let excerpt = "";
  if (hasPost) {
    const posts = await supabaseRest<PostRow[]>("posts", {
      query: `?id=eq.${target.postId}&community_id=eq.${communityId}&select=id,body`,
    });
    const post = selectSingle(posts);
    if (!post) return { error: "invalid-target" };
    excerpt = post.body;
  } else {
    const replies = await supabaseRest<PostReplyRow[]>("post_replies", { query: `?id=eq.${target.replyId}&select=id,post_id,body` });
    const reply = selectSingle(replies);
    if (!reply) return { error: "invalid-target" };
    excerpt = reply.body;
    const posts = await supabaseRest<PostRow[]>("posts", {
      query: `?id=eq.${reply.post_id}&community_id=eq.${communityId}&select=id`,
    });
    if (posts.length === 0) return { error: "invalid-target" };
  }
  const rows = await supabaseRest<ReportRow[]>("reports", {
    method: "POST",
    body: {
      community_id: communityId,
      target_post_id: hasPost ? target.postId : null,
      target_reply_id: hasReply ? target.replyId : null,
      reporter_membership_id: membership.id,
      reason: text,
    },
    prefer: "return=representation",
  });
  const report = selectSingle(rows);
  if (!report) throw new Error("report not created");
  try {
    await enqueueModerationEvent({
      communityId,
      reportId: report.id,
      type: "report",
      targetPostId: hasPost ? target.postId : null,
      targetReplyId: hasReply ? target.replyId : null,
      excerpt,
    });
  } catch {
    /* A queue failure must never lose the report itself. */
  }
  return { report };
}

// ---------------------------------------------------------------------------
// Reactions ("this helped me"). Returns null when migration 0005 is missing.

export type ReactionSummary = { count: number; reacted: boolean };

export async function getReactionSummary(
  postId: string,
  membershipId: string | null,
): Promise<ReactionSummary | null> {
  if (!isUuid(postId)) return { count: 0, reacted: false };
  try {
    const rows = await supabaseRest<PostReactionRow[]>("post_reactions", {
      query: `?post_id=eq.${postId}&select=membership_id`,
    });
    return {
      count: rows.length,
      reacted: membershipId !== null && rows.some((row) => row.membership_id === membershipId),
    };
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

export async function toggleReaction(
  userId: string,
  communityId: string,
  postId: string,
): Promise<ReactionSummary | { error: "not-found" | "forbidden" } | null> {
  if (!isUuid(postId)) return { error: "not-found" };
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status !== "active") return { error: "forbidden" };
  const posts = await supabaseRest<PostRow[]>("posts", { query: `?id=eq.${postId}&community_id=eq.${communityId}&select=id` });
  if (!selectSingle(posts)) return { error: "not-found" };
  try {
    const existing = await supabaseRest<PostReactionRow[]>("post_reactions", {
      query: `?post_id=eq.${postId}&membership_id=eq.${membership.id}&select=id&limit=1`,
    });
    if (existing.length > 0) {
      await supabaseRest("post_reactions", {
        method: "DELETE",
        query: `?post_id=eq.${postId}&membership_id=eq.${membership.id}`,
      });
    } else {
      await supabaseRest("post_reactions", {
        method: "POST",
        body: { post_id: postId, membership_id: membership.id, kind: "helpful" },
        prefer: "return=minimal,resolution=ignore-duplicates",
      });
    }
    return getReactionSummary(postId, membership.id);
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Featuring consent: members opt a post in/out of shared-journey surfacing.

export async function featurePost(userId: string, communityId: string, postId: string) {
  if (!isUuid(postId)) return { error: "not-found" as const };
  const membership = await getMembership(userId, communityId);
  if (!membership || membership.status !== "active") return { error: "forbidden" as const };
  const posts = await supabaseRest<PostRow[]>("posts", {
    query: `?id=eq.${postId}&community_id=eq.${communityId}&select=id,body,author_membership_id,status`,
  });
  const post = selectSingle(posts);
  if (!post || post.status !== "visible") return { error: "not-found" as const };
  if (post.author_membership_id !== membership.id) return { error: "forbidden" as const };
  try {
    await supabaseRest("consent_records", {
      method: "POST",
      body: {
        user_id: userId,
        action: "feature",
        audience_community_id: communityId,
        text_sha256: await sha256Hex(post.body),
        consent_version: CONSENT_VERSION,
        post_id: postId,
      },
      prefer: "return=minimal",
    });
    return { featured: true as const };
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

export async function unfeaturePost(userId: string, communityId: string, postId: string) {
  if (!isUuid(postId)) return { error: "not-found" as const };
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" as const };
  try {
    await supabaseRest("consent_records", {
      method: "DELETE",
      query: `?user_id=eq.${userId}&action=eq.feature&audience_community_id=eq.${communityId}&post_id=eq.${postId}`,
    });
    return { featured: false as const };
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

export type FeaturedPost = PostWithAuthor & { featuredAt: string };

export async function listFeaturedPosts(communityId: string, limit = 5): Promise<FeaturedPost[] | null> {
  try {
    const consents = await supabaseRest<Array<{ post_id: string; created_at: string }>>("consent_records", {
      query: `?audience_community_id=eq.${communityId}&action=eq.feature&select=post_id,created_at&order=created_at.desc&limit=50`,
    });
    const ids = [...new Set(consents.map((row) => row.post_id).filter(Boolean))].slice(0, limit);
    if (ids.length === 0) return [];
    const rows = await supabaseRest<PostRow[]>("posts", {
      query: `?id=in.(${ids.join(",")})&status=eq.visible&select=*`,
    });
    const aliases = await aliasesFor([...new Set(rows.map((row) => row.author_membership_id))]);
    const featuredAt = new Map(consents.map((row) => [row.post_id, row.created_at]));
    return rows.map((row) => ({
      ...row,
      author_alias: aliases.get(row.author_membership_id) ?? "Former member",
      replyCount: 0,
      lastReplyAt: null,
      featuredAt: featuredAt.get(row.id) ?? row.created_at,
    }));
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Promotion requests: members request, moderators decide with rationale.

export async function requestPromotion(
  userId: string,
  communityId: string,
  requestedRole: "volunteer" | "verified-supporter",
  note: string,
): Promise<{ request: PromotionRequestRow } | { error: "not-found" | "forbidden" | "already-open" } | null> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "not-found" };
  if (membership.status !== "active") return { error: "forbidden" };
  try {
    const existing = await supabaseRest<PromotionRequestRow[]>("promotion_requests", {
      query: `?community_id=eq.${communityId}&membership_id=eq.${membership.id}&status=eq.open&select=id&limit=1`,
    });
    if (existing.length > 0) return { error: "already-open" };
    const rows = await supabaseRest<PromotionRequestRow[]>("promotion_requests", {
      method: "POST",
      body: { community_id: communityId, membership_id: membership.id, requested_role: requestedRole, note: note.trim().slice(0, 1000) },
      prefer: "return=representation",
    });
    const created = selectSingle(rows);
    if (!created) throw new Error("promotion request not created");
    return { request: created };
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

export async function listPromotionRequests(userId: string, communityId: string): Promise<PromotionRequestRow[] | { error: "forbidden" } | null> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return { error: "forbidden" };
  try {
    if (membership.role === "moderator") {
      return supabaseRest<PromotionRequestRow[]>("promotion_requests", {
        query: `?community_id=eq.${communityId}&status=eq.open&order=created_at.asc&select=*`,
      });
    }
    return supabaseRest<PromotionRequestRow[]>("promotion_requests", {
      query: `?community_id=eq.${communityId}&membership_id=eq.${membership.id}&order=created_at.desc&select=*`,
    });
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

export async function decidePromotionRequest(
  userId: string,
  communityId: string,
  requestId: string,
  decision: "approved" | "declined",
  rationale: string,
): Promise<{ request: PromotionRequestRow } | { error: "not-found" | "forbidden" } | null> {
  if (!isUuid(requestId)) return { error: "not-found" };
  if (!(await isModerator(userId, communityId))) return { error: "forbidden" };
  try {
    const rows = await supabaseRest<PromotionRequestRow[]>("promotion_requests", {
      query: `?id=eq.${requestId}&community_id=eq.${communityId}&status=eq.open&select=*`,
    });
    const target = selectSingle(rows);
    if (!target) return { error: "not-found" };
    const updated = await supabaseRest<PromotionRequestRow[]>("promotion_requests", {
      method: "PATCH",
      query: `?id=eq.${requestId}`,
      body: { status: decision, reviewer_rationale: rationale.trim().slice(0, 1000), decided_at: new Date().toISOString() },
      prefer: "return=representation",
    });
    const saved = selectSingle(updated);
    if (!saved) throw new Error("promotion request not updated");
    if (decision === "approved") {
      await supabaseRest("community_member_verifications", {
        method: "POST",
        query: "?on_conflict=membership_id",
        body: {
          membership_id: target.membership_id,
          community_id: communityId,
          role_label: target.requested_role === "volunteer" ? "Volunteer" : "Verified supporter",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        },
        prefer: "resolution=merge-duplicates,return=minimal",
      });
    }
    return { request: saved };
  } catch (error) {
    if (isMissingMigration(error)) return null;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Community facilitator: a clearly-labelled AI membership that answers
// questions no human reached. Never moderates, never pretends to be human.

export async function ensureFacilitatorMembership(communityId: string): Promise<MembershipRow | null> {
  const agent = await getCommunityAgent(communityId);
  if (!agent) return null;
  const existing = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?community_id=eq.${communityId}&alias=eq.${encodeURIComponent(agent.display_name)}&select=*&limit=1`,
  });
  const found = selectSingle(existing);
  if (found) return found;
  const facilitatorUserId = randomUUID();
  await ensureProfile(facilitatorUserId);
  const created = await supabaseRest<MembershipRow[]>("memberships", {
    method: "POST",
    body: { community_id: communityId, user_id: facilitatorUserId, alias: agent.display_name, role: "member", status: "active" },
    prefer: "return=representation",
  });
  return selectSingle(created);
}

export type FacilitateOutcome =
  | { facilitated: true; postId: string; replyId: string }
  | { facilitated: false; reason: "empty" | "no-agent" | "no-membership" | "unavailable" };

const FACILITATOR_SYSTEM = [
  "You are the community guide (AI) for a peer-support community. Answer the member's",
  "question warmly and briefly, drawing only on general peer-support patterns.",
  "Never diagnose, never give medical or legal verdicts, never tell anyone to stay in",
  "or leave a relationship. State plainly that you are an AI guide and that human",
  "members and moderators may add their perspectives. Keep replies under 120 words.",
].join(" ");

export async function facilitateOldestUnansweredAsk(communityId: string): Promise<FacilitateOutcome> {
  const agent = await getCommunityAgent(communityId);
  if (!agent) return { facilitated: false, reason: "no-agent" };
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let candidates: PostRow[];
  try {
    candidates = await supabaseRest<PostRow[]>("posts", {
      query: `?community_id=eq.${communityId}&status=eq.visible&kind=eq.ask&created_at=lt.${encodeURIComponent(cutoff)}&order=created_at.asc&select=*&limit=10`,
    });
  } catch (error) {
    if (!isMissingMigration(error)) throw error;
    candidates = await supabaseRest<PostRow[]>("posts", {
      query: `?community_id=eq.${communityId}&status=eq.visible&created_at=lt.${encodeURIComponent(cutoff)}&order=created_at.asc&select=*&limit=10`,
    });
  }
  let target: PostRow | null = null;
  for (const post of candidates) {
    const replies = await supabaseRest<PostReplyRow[]>("post_replies", {
      query: `?post_id=eq.${post.id}&status=eq.visible&select=id&limit=1`,
    });
    if (replies.length === 0) {
      target = post;
      break;
    }
  }
  if (!target) return { facilitated: false, reason: "empty" };
  const membership = await ensureFacilitatorMembership(communityId);
  if (!membership) return { facilitated: false, reason: "no-membership" };
  const context = (agent.community_context ?? {}) as Record<string, unknown>;
  let text: string;
  try {
    text = await requestMetaChatDetailed({
      messages: [
        { role: "system", content: `${FACILITATOR_SYSTEM} Community: ${typeof context.name === "string" ? context.name : communityId}. Scope: ${typeof context.description === "string" ? context.description.slice(0, 300) : ""}` },
        { role: "user", content: `A member asked (no human has replied yet):\n\n${target.body.slice(0, 1500)}` },
      ],
      maxTokens: 300,
      temperature: 0.5,
    }).then((result) => result.text);
  } catch {
    return { facilitated: false, reason: "unavailable" };
  }
  try {
    const rows = await supabaseRest<PostReplyRow[]>("post_replies", {
      method: "POST",
      body: { post_id: target.id, author_membership_id: membership.id, consent_id: null, body: text.trim().slice(0, 2000) },
      prefer: "return=representation",
    });
    const reply = selectSingle(rows);
    if (!reply) return { facilitated: false, reason: "unavailable" };
    return { facilitated: true, postId: target.id, replyId: reply.id };
  } catch {
    return { facilitated: false, reason: "unavailable" };
  }
}

// ---------------------------------------------------------------------------
// Member outcomes + notifications (computed from existing tables; no migration).

export type MyReportOutcome = {
  reportId: string;
  reportStatus: string;
  targetPostId: string | null;
  targetReplyId: string | null;
  decision: { id: string; decision: string; rationale: string; created_at: string } | null;
  appeal: { id: string; status: string } | null;
};

export async function getMyReportOutcomes(userId: string, communityId: string): Promise<MyReportOutcome[]> {
  const membership = await getMembership(userId, communityId);
  if (!membership) return [];
  const reports = await supabaseRest<Array<{ id: string; status: string; target_post_id: string | null; target_reply_id: string | null }>>("reports", {
    query: `?community_id=eq.${communityId}&reporter_membership_id=eq.${membership.id}&order=created_at.desc&select=id,status,target_post_id,target_reply_id&limit=25`,
  });
  return Promise.all(
    reports.map(async (report) => {
      const decisions = await supabaseRest<Array<{ id: string; decision: string; rationale: string; created_at: string }>>("moderation_decisions", {
        query: `?report_id=eq.${report.id}&order=created_at.desc&select=id,decision,rationale,created_at&limit=1`,
      });
      const decision = decisions[0] ?? null;
      const appeals = decision
        ? await supabaseRest<Array<{ id: string; status: string }>>("appeals", {
            query: `?decision_id=eq.${decision.id}&order=created_at.desc&select=id,status&limit=1`,
          })
        : [];
      return {
        reportId: report.id,
        reportStatus: report.status,
        targetPostId: report.target_post_id,
        targetReplyId: report.target_reply_id,
        decision,
        appeal: appeals[0] ?? null,
      };
    }),
  );
}

export type AccountNotification = {
  id: string;
  kind: "reply" | "decision" | "appeal";
  communityId: string;
  communityName: string;
  text: string;
  createdAt: string;
  link: string;
};

export async function getAccountNotifications(userId: string): Promise<AccountNotification[]> {
  const memberships = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?user_id=eq.${userId}&status=eq.active&select=id,community_id`,
  });
  if (memberships.length === 0) return [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const items: AccountNotification[] = [];
  for (const membership of memberships) {
    const communities = await supabaseRest<CommunityRow[]>("communities", {
      query: `?id=eq.${membership.community_id}&select=id,name`,
    });
    const name = communities[0]?.name ?? membership.community_id;
    const myPosts = await supabaseRest<PostRow[]>("posts", {
      query: `?author_membership_id=eq.${membership.id}&select=id,body,created_at&order=created_at.desc&limit=20`,
    });
    for (const post of myPosts.slice(0, 10)) {
      const replies = await supabaseRest<PostReplyRow[]>("post_replies", {
        query: `?post_id=eq.${post.id}&status=eq.visible&created_at=gte.${encodeURIComponent(since)}&author_membership_id=neq.${membership.id}&select=id,created_at&order=created_at.desc&limit=3`,
      });
      for (const reply of replies) {
        items.push({
          id: `reply-${reply.id}`,
          kind: "reply",
          communityId: membership.community_id,
          communityName: name,
          text: `New reply in "${post.body.slice(0, 60)}…"`,
          createdAt: reply.created_at,
          link: `/communities/${membership.community_id}`,
        });
      }
    }
    const outcomes = await getMyReportOutcomes(userId, membership.community_id);
    for (const outcome of outcomes.slice(0, 5)) {
      if (outcome.decision) {
        items.push({
          id: `decision-${outcome.reportId}`,
          kind: "decision",
          communityId: membership.community_id,
          communityName: name,
          text: `A moderator reviewed your report (${outcome.decision.decision}).`,
          createdAt: outcome.decision.created_at,
          link: `/communities/${membership.community_id}`,
        });
      }
      if (outcome.appeal && outcome.appeal.status !== "open") {
        items.push({
          id: `appeal-${outcome.appeal.id}`,
          kind: "appeal",
          communityId: membership.community_id,
          communityName: name,
          text: `Your appeal was ${outcome.appeal.status}.`,
          createdAt: outcome.decision?.created_at ?? new Date().toISOString(),
          link: `/communities/${membership.community_id}`,
        });
      }
    }
  }
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 20);
}


export type MyContribution = {
  communityId: string;
  communityName: string;
  alias: string;
  role: string;
  posts: Array<{ id: string; body: string; status: string; createdAt: string; replyCount: number; thanks: number }>;
  replies: number;
  thanksReceived: number;
  level: string;
};

export async function getMyContributions(userId: string): Promise<MyContribution[]> {
  const memberships = await supabaseRest<MembershipRow[]>("memberships", {
    query: `?user_id=eq.${userId}&status=eq.active&select=*`,
  });
  const out: MyContribution[] = [];
  for (const membership of memberships) {
    const [communities, posts, replies] = await Promise.all([
      supabaseRest<CommunityRow[]>("communities", { query: `?id=eq.${membership.community_id}&select=id,name` }),
      supabaseRest<PostRow[]>("posts", { query: `?author_membership_id=eq.${membership.id}&order=created_at.desc&select=*&limit=25` }),
      supabaseRest<PostReplyRow[]>("post_replies", { query: `?author_membership_id=eq.${membership.id}&select=id&limit=100` }),
    ]);
    let thanksReceived = 0;
    const enriched = await Promise.all(posts.map(async (post) => {
      const [replyRows, reactionRows] = await Promise.all([
        supabaseRest<PostReplyRow[]>("post_replies", { query: `?post_id=eq.${post.id}&status=eq.visible&select=id` }),
        supabaseRest<PostReactionRow[]>("post_reactions", { query: `?post_id=eq.${post.id}&select=id` }).catch(() => [] as PostReactionRow[]),
      ]);
      thanksReceived += reactionRows.length;
      return { id: post.id, body: post.body.slice(0, 140), status: post.status, createdAt: post.created_at, replyCount: replyRows.length, thanks: reactionRows.length };
    }));
    const progress = await getCommunityProgressSummary(membership.community_id, userId, membership.id).catch(() => null);
    out.push({
      communityId: membership.community_id,
      communityName: communities[0]?.name ?? membership.community_id,
      alias: membership.alias,
      role: membership.role,
      posts: enriched,
      replies: replies.length,
      thanksReceived,
      level: progress?.level ?? "new-member",
    });
  }
  return out;
}
