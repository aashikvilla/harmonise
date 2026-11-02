import { CONSENT_VERSION, sha256Hex } from "@/lib/consent";
import type {
  CommunityRow,
  ConsentRecordRow,
  MembershipRow,
  PostReplyRow,
  PostRow,
  ReportRow,
} from "@/lib/db/types";
import { isUuid, selectSingle, supabaseCount, supabaseRest } from "@/lib/db/supabase";
import { ensureProfile } from "@/lib/db/sessions";
import { enqueueModerationEvent } from "@/lib/db/moderation";

export type CommunityWithCounts = CommunityRow & { memberCount: number; postCount: number };
export type PostWithAuthor = PostRow & { author_alias: string };
export type ReplyWithAuthor = PostReplyRow & { author_alias: string };

export function validCommunityId(value: string) {
  return /^[a-z0-9-]{3,48}$/.test(value);
}

export function validAlias(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const alias = value.trim().replace(/\s+/g, " ");
  if (alias.length < 2 || alias.length > 40) return null;
  return alias;
}

export async function listCommunities(): Promise<CommunityWithCounts[]> {
  const rows = await supabaseRest<CommunityRow[]>("communities", { query: "?select=*&order=name.asc" });
  return Promise.all(
    rows.map(async (community) => {
      const [memberCount, postCount] = await Promise.all([
        supabaseCount("memberships", `?community_id=eq.${community.id}&status=eq.active`),
        supabaseCount("posts", `?community_id=eq.${community.id}&status=eq.visible`),
      ]);
      return { ...community, memberCount, postCount };
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
  return { ...community, memberCount, postCount };
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
  if (!community) return { error: "not-found" };
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
  if (!community) return { ok: false, reason: "not-found" };
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

export async function listPosts(communityId: string, moderator: boolean): Promise<PostWithAuthor[]> {
  const statusFilter = moderator ? "" : "&status=eq.visible";
  const rows = await supabaseRest<PostRow[]>("posts", {
    query: `?community_id=eq.${communityId}${statusFilter}&order=created_at.desc&select=*&limit=50`,
  });
  const aliases = await aliasesFor([...new Set(rows.map((row) => row.author_membership_id))]);
  return rows.map((row) => ({ ...row, author_alias: aliases.get(row.author_membership_id) ?? "Former member" }));
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

export async function listReplies(postId: string, moderator: boolean): Promise<ReplyWithAuthor[]> {
  if (!isUuid(postId)) return [];
  const statusFilter = moderator ? "" : "&status=eq.visible";
  const rows = await supabaseRest<PostReplyRow[]>("post_replies", {
    query: `?post_id=eq.${postId}${statusFilter}&order=created_at.asc&select=*&limit=100`,
  });
  const aliases = await aliasesFor([...new Set(rows.map((row) => row.author_membership_id))]);
  return rows.map((row) => ({ ...row, author_alias: aliases.get(row.author_membership_id) ?? "Former member" }));
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
