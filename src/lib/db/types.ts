/** TypeScript mirror of supabase/migrations/0001_harmonise_core.sql. Server use only. */

export type SessionStatus = "active" | "expired" | "deleted";
export type MessageRole = "user" | "assistant";
export type CommunityVisibility = "public" | "member";
export type CommunityLaunchStatus = "pending_review" | "approved" | "rejected";
export type MembershipRole = "member" | "moderator";
export type MembershipStatus = "active" | "left" | "blocked";
export type ConsentAction = "post" | "reply" | "question";
export type ContentStatus = "visible" | "held" | "removed";
export type ReportStatus = "open" | "decided" | "appealed" | "closed";
export type ModerationEventType = "report" | "live-flag";
export type ModerationEventStatus = "queued" | "processing" | "triaged" | "dead";
export type ModerationDecisionKind = "no-action" | "request-revision" | "remove" | "escalate";
export type AppealStatus = "open" | "upheld" | "overturned";

export type ProfileRow = { id: string; created_at: string };

export type PrivateSessionRow = {
  id: string;
  user_id: string;
  title: string;
  status: SessionStatus;
  last_active_at: string;
  expires_at: string;
  created_at: string;
};

export type SessionMessageRow = {
  id: string;
  session_id: string;
  role: MessageRole;
  text: string;
  created_at: string;
};

export type SessionUnderstandingRow = {
  session_id: string;
  suggested_themes: string[];
  confirmed_themes: string[];
  support_need: string;
  need_summary: string;
  correction_count: number;
  updated_at: string;
};

export type CommunityRow = {
  id: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  topics: string[];
  launch_status: CommunityLaunchStatus;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  coverage_confirmed_at: string | null;
  created_at: string;
};

export type CommunityAgentRow = {
  id: string;
  community_id: string;
  display_name: string;
  status: "active" | "inactive";
  community_context: { name?: string; description?: string; topics?: string[]; scope?: CommunityScopePackage };
  scope_package: CommunityScopePackage;
  scope_version: number;
  scope_updated_by: string | null;
  scope_updated_at: string;
  scope_source: "legacy" | "host-reviewed-proposal" | "moderator-approved-change" | "moderator-rollback";
  created_at: string;
};

export type CommunityScopePackage = {
  includedTopics: string[];
  adjacentTopics: string[];
  outOfScopeTopics: string[];
  norms: string[];
  welcomeMessage: string;
  starterPrompts: string[];
};

export type CommunityScopeRecommendation = {
  proposedDescription: string;
  proposedTopics: string[];
  proposedScopePackage: CommunityScopePackage;
  newCommunityName: string;
  newCommunityDescription: string;
  newCommunityTopics: string[];
  newCommunityScopePackage: CommunityScopePackage;
};

export type CommunityScopeChangeRow = {
  id: string;
  community_id: string;
  proposed_by: string | null;
  reviewed_by: string | null;
  recommendation_kind: "clarify" | "expand" | "split";
  risk: "low" | "moderate" | "high";
  status: "pending" | "approved" | "rejected" | "superseded";
  base_scope_version: number;
  prior_scope: { name: string; description: string; topics: string[]; scopePackage: CommunityScopePackage; scopeVersion: number };
  source_excerpt_length: number;
  recommendation: CommunityScopeRecommendation;
  rationale: string;
  model: string;
  provider_latency_ms: number | null;
  reviewer_rationale: string | null;
  created_at: string;
  reviewed_at: string | null;
  applied_at: string | null;
  rolled_back_by: string | null;
  rolled_back_at: string | null;
  rollback_rationale: string | null;
  split_community_id: string | null;
};

export type MembershipRow = {
  id: string;
  community_id: string;
  user_id: string;
  alias: string;
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
};

export type ConsentRecordRow = {
  id: string;
  user_id: string;
  action: ConsentAction;
  audience_community_id: string;
  text_sha256: string;
  consent_version: string;
  created_at: string;
  revoked_at: string | null;
};

export type PostRow = {
  id: string;
  community_id: string;
  author_membership_id: string;
  consent_id: string | null;
  body: string;
  status: ContentStatus;
  created_at: string;
};

export type PostReplyRow = {
  id: string;
  post_id: string;
  author_membership_id: string;
  consent_id: string | null;
  body: string;
  status: ContentStatus;
  created_at: string;
};

export type ReportRow = {
  id: string;
  community_id: string;
  target_post_id: string | null;
  target_reply_id: string | null;
  reporter_membership_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
};

export type ModerationEventRow = {
  id: string;
  community_id: string;
  report_id: string | null;
  event_type: ModerationEventType;
  payload: Record<string, unknown>;
  idempotency_key: string;
  status: ModerationEventStatus;
  attempts: number;
  created_at: string;
};

export type ModerationDecisionRow = {
  id: string;
  report_id: string;
  reviewer_user_id: string;
  model_concern: string | null;
  model_severity: string | null;
  model_rationale: string | null;
  decision: ModerationDecisionKind;
  rationale: string;
  policy_version: string;
  created_at: string;
};

export type AppealRow = {
  id: string;
  decision_id: string;
  appellant_membership_id: string;
  reason: string;
  status: AppealStatus;
  created_at: string;
};
