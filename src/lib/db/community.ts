import { CONSENT_VERSION, sha256Hex } from "@/lib/consent";
import type {
  CommunityRow,
  CommunityAgentRow,
  CommunityScopePackage,
  CommunityScopeChangeRow,
  CommunityScopeRecommendation,
  ConsentRecordRow,
  MembershipRow,
  PostReplyRow,
  PostRow,
  ReportRow,
} from "@/lib/db/types";
import { isUuid, selectSingle, supabaseCount, supabaseRest } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { enqueueModerationEvent } from "@/lib/db/moderation";

export type CommunityWithCounts = CommunityRow & { memberCount: number; postCount: number; recentPostCount: number; joined: boolean };
export type PublicCommunity = Omit<CommunityWithCounts, "created_by" | "reviewed_by" | "reviewed_at" | "coverage_confirmed_at">;
export type PostWithAuthor = PostRow & { author_alias: string };
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
      const [memberCount, postCount, recentPostCount] = await Promise.all([
        supabaseCount("memberships", `?community_id=eq.${community.id}&status=eq.active`),
        supabaseCount("posts", `?community_id=eq.${community.id}&status=eq.visible`),
        supabaseCount("posts", `?community_id=eq.${community.id}&status=eq.visible&created_at=gte.${weekAgo}`),
      ]);
      return { ...community, memberCount, postCount, recentPostCount, joined: joinedIds.has(community.id) };
    }),
  );
}

export async function getCommunityWithCounts(id: string): Promise<CommunityWithCounts | null> {
  const rows = await supabaseRest<CommunityRow[]>("communities", { query: `?id=eq.${id}&select=*` });
  const community = selectSingle(rows);
  if (!community) return null;
  const [memberCount, postCount] = await Promise.all([
    supabaseCount("memberships", `?community_id=eq.${id}&status=eq.active`),
    supabaseCount("posts", `?community_id=eq.${id}&status=eq.visible`),
  ]);
  return { ...community, memberCount, postCount, recentPostCount: 0, joined: false };
}

export async function createPendingCommunity(input: {
  id: string;
  name: string;
  description: string;
  topics: string[];
  ownerId: string;
  scopePackage?: CommunityScopePackage;
}): Promise<CommunityRow> {
  const rows = await supabaseRest<CommunityRow[]>(input.scopePackage ? "rpc/create_pending_community_with_scope" : "rpc/create_pending_community", {
    method: "POST",
    body: input.scopePackage
      ? {
          p_id: input.id,
          p_name: input.name,
          p_description: input.description,
          p_topics: input.topics,
          p_owner_id: input.ownerId,
          p_scope_package: input.scopePackage,
        }
      : {
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
    query: `?community_id=eq.${encodeURIComponent(communityId)}&select=id,community_id,display_name,status,community_context,scope_package,scope_version,scope_updated_by,scope_updated_at,scope_source,created_at&limit=1`,
  });
  return selectSingle(rows);
}

export async function createCommunityScopeChange(input: {
  communityId: string;
  proposedBy: string;
  recommendationKind: CommunityScopeChangeRow["recommendation_kind"];
  risk: CommunityScopeChangeRow["risk"];
  baseScopeVersion: number;
  priorScope: CommunityScopeChangeRow["prior_scope"];
  sourceExcerptLength: number;
  recommendation: CommunityScopeRecommendation;
  rationale: string;
  model: string;
  providerLatencyMs: number;
}) {
  const rows = await supabaseRest<CommunityScopeChangeRow[]>("community_scope_changes", {
    method: "POST",
    body: {
      community_id: input.communityId,
      proposed_by: input.proposedBy,
      recommendation_kind: input.recommendationKind,
      risk: input.risk,
      base_scope_version: input.baseScopeVersion,
      prior_scope: input.priorScope,
      source_excerpt_length: input.sourceExcerptLength,
      recommendation: input.recommendation,
      rationale: input.rationale,
      model: input.model,
      provider_latency_ms: input.providerLatencyMs,
    },
    prefer: "return=representation",
  });
  return selectSingle(rows);
}

export async function listCommunityScopeChanges(communityId: string) {
  return supabaseRest<CommunityScopeChangeRow[]>("community_scope_changes", {
    query: `?community_id=eq.${encodeURIComponent(communityId)}&select=*&order=created_at.desc&limit=25`,
  });
}

export async function getCommunityScopeChange(communityId: string, changeId: string) {
  const rows = await supabaseRest<CommunityScopeChangeRow[]>("community_scope_changes", {
    query: `?id=eq.${encodeURIComponent(changeId)}&community_id=eq.${encodeURIComponent(communityId)}&select=*&limit=1`,
  });
  return selectSingle(rows);
}

export async function reviewCommunityScopeChange(input: {
  changeId: string;
  communityId: string;
  reviewerId: string;
  decision: "approved" | "rejected";
  rationale: string;
}) {
  const rows = await supabaseRest<CommunityScopeChangeRow[]>("rpc/review_community_scope_change", {
    method: "POST",
    body: {
      p_change_id: input.changeId,
      p_community_id: input.communityId,
      p_reviewer_id: input.reviewerId,
      p_decision: input.decision,
      p_rationale: input.rationale,
    },
  });
  return selectSingle(rows);
}

export async function approveCommunityScopeSplit(input: {
  changeId: string;
  communityId: string;
  reviewerId: string;
  rationale: string;
}) {
  const rows = await supabaseRest<CommunityScopeChangeRow[]>("rpc/approve_community_scope_split", {
    method: "POST",
    body: {
      p_change_id: input.changeId,
      p_community_id: input.communityId,
      p_reviewer_id: input.reviewerId,
      p_rationale: input.rationale,
    },
  });
  return selectSingle(rows);
}

export async function rollbackCommunityScopeChange(input: {
  changeId: string;
  communityId: string;
  reviewerId: string;
  rationale: string;
}) {
  const rows = await supabaseRest<CommunityScopeChangeRow[]>("rpc/rollback_community_scope_change", {
    method: "POST",
    body: {
      p_change_id: input.changeId,
      p_community_id: input.communityId,
      p_reviewer_id: input.reviewerId,
      p_rationale: input.rationale,
    },
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

export async function listPosts(communityId: string, moderator: boolean, excludeMembershipIds: string[] = []): Promise<PostWithAuthor[]> {
  const statusFilter = moderator ? "" : "&status=eq.visible";
  const rows = await supabaseRest<PostRow[]>("posts", {
    query: `?community_id=eq.${communityId}${statusFilter}&order=created_at.desc&select=*&limit=50`,
  });
  const visible = excludeMembershipIds.length > 0 ? rows.filter((row) => !excludeMembershipIds.includes(row.author_membership_id)) : rows;
  const aliases = await aliasesFor([...new Set(visible.map((row) => row.author_membership_id))]);
  return visible.map((row) => ({ ...row, author_alias: aliases.get(row.author_membership_id) ?? "Former member" }));
}

export type CreatePostResult = { post: PostWithAuthor } | { error: "not-found" | "forbidden" | "blocked" | "stale-consent" };

export async function createPost(userId: string, communityId: string, body: string, consentVersion: unknown): Promise<CreatePostResult> {
  if (consentVersion !== CONSENT_VERSION) return { error: "stale-consent" };
  const text = body.trim();
  if (!text || text.length > 4000) return { error: "forbidden" };
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
  const postRows = await supabaseRest<PostRow[]>("posts", {
    method: "POST",
    body: { community_id: communityId, author_membership_id: membership.id, consent_id: consent.id, body: text },
    prefer: "return=representation",
  });
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
  return { post: { ...post, author_alias: membership.alias } };
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

export type CreateReplyResult = { reply: ReplyWithAuthor } | { error: "not-found" | "forbidden" | "blocked" | "stale-consent" };

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
