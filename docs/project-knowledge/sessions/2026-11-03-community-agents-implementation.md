# Session Journal — Community agents and scope stewardship implementation

**Date:** 2026-11-03  
**Branch:** `develop` (local integration worktree)  
**Goal:** Implement the community setup copilot, private community guide, and human-reviewed scope stewardship plan in isolated feature worktrees.

## Completed

- Fast-forwarded local `develop` from `0dd7b06` to the accepted `origin/main` baseline `7c44931`, which contained the already-merged proposal and community-helper lifecycle. The original checkout had unrelated uncommitted work and was left untouched.
- Implemented the setup copilot on `community-setup`: optional host-invoked Meta drafting, public-metadata overlap, editable scope package, explicit host confirmation, and atomic scope persistence during pending proposal creation. Muse Spark is the default; Muse Wonder is an allowlisted non-production evaluation option only.
- Implemented the active-member private guide on `community-guide`: approved scope package plus public community metadata and the current question only; no posts, replies, private chat, publishing, or contact actions.
- Implemented scope stewardship on `scope-stewardship`: moderator-selected excerpt with point-of-use Meta disclosure; the excerpt is not retained; recommendations are versioned and human-reviewed; moderators can approve, reject, or roll back.
- Accepted split recommendations create one private `pending_review` proposal transactionally and idempotently, without memberships, posts, notifications, or invitations. The usual allowlisted launch reviewer and coverage confirmation remain required.
- Merged all three feature branches to local `develop`; current integration head is `d10d861`.
- Added architecture, decision, past-mistake, roadmap, model-audit, and README updates describing the new boundaries and pending database rollout.

## Verification and limits

- Feature worktrees and the combined integration worktree passed `npm run typecheck`, `npm run lint`, and `npm run build`.
- No unit, browser, or other tests were run. No Supabase migration was applied remotely, no production deployment was changed, and no live Meta model call was made for this implementation.
- Migrations `20261102195744_20261102192729_community_scope_stewardship.sql` and `20261102195748_20261102194236_scope_split_proposals.sql` were applied to the live Supabase project in order. The filenames were aligned to the versions recorded by the migration service so future CLI migration checks will not replay them.
- A post-apply privilege query confirmed the new scope-change table has RLS enabled, grants no read access to `anon` or `authenticated`, and grants service-role access; scope review, rollback, and split-approval functions execute only as `service_role`.
- `COMMUNITY_REVIEWER_USER_IDS`, named reviewer coverage, and the moderation worker schedule remain unconfigured; these features do not imply continuous moderation.
- Optional auto-application of scope changes is not enabled. Silence or timeout never approves a change or launches a community.
- The setup-model switch defaults to Spark; Wonder has not yet been compared on synthetic cases. The install audit surfaced 2 critical and 17 moderate development-tooling advisories in the existing lockfile; no dependency changes were made.
