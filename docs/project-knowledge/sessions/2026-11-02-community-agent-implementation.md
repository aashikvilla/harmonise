# Session Journal — Community lifecycle and progression

**Date:** 2026-11-02
**Branch:** `codex/community-agent-creation` (from `codex/vercel-upload-filter`)
**Goal:** Add optional human-reviewed role verification, activity-based community levels, user-approved community proposals, per-community AI helper provisioning, and a browser-tested proposal/review journey.

## Implemented

- Added the community progress migration: service-role-only summary of visible posts/replies. Eligible text is at least 20 trimmed characters; normalized duplicate text counts once; active days use UTC. Thresholds are 3 contributions over 2 days for Contributor and 10 over 5 days for Community regular.
- Added a signed-in member-only activity endpoint and private activity card. `COMMUNITY_ROLE_VERIFICATION_ENABLED` defaults to false; a separate moderator-reviewed role record/API is unavailable unless explicitly enabled.
- Added demo-only example aliases at all levels. They are displayed only in the `/connect` prototype, never inserted as Auth accounts or real community memberships.
- Added the community lifecycle migration: existing communities remain approved; user proposals create a pending community and owner membership atomically; a trigger provisions one community-specific AI helper; review approval requires an allowlisted reviewer plus explicit human-coverage attestation.
- Pending communities cannot be joined, viewed by non-owners, or used to read/post/reply. Human reviewers receive only proposal-safe fields. The helper uses its community's purpose/topics when triaging queued content and records helper attribution; it cannot enforce moderation actions.
- Added a responsive proposal form, private pending-status page, reviewer queue, helper disclosure, activity card, and live-community link from the prototype circles.
- Updated the product journey plan and project knowledge to separate shipped work from remaining operations and end-to-end gaps.

## Verification

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed with Next.js 16.4.3.
- `npx playwright test --config tests/playwright.config.ts tests/community-creation-journey.spec.ts tests/demo-journey.spec.ts --reporter=list` — proposal/review journey and existing Connect demo passed on desktop and mobile (4/4). The new community browser journey used isolated API fixtures and did not write to Supabase.
- No unit tests were added or run.
- `git diff --check` passed before final documentation updates; rerun before commit.

## Remaining after implementation

- The community progress/lifecycle migrations and built-in topic backfill were applied to Supabase on 2026-11-03 as remote versions `20261102183254`, `20261102183300`, and `20261102185148`. `seed.sql` marks the three built-in communities approved and supplies their helper topics for clean resets.
- Set `COMMUNITY_REVIEWER_USER_IDS` before any proposal can be approved. Reviewer attestation is not a staffing schedule or proof of ongoing availability.
- The moderation worker still has no scheduled invocation or named coverage. Helper behavior is advisory when queued events are processed, not continuous monitoring.
- Full visitor → chat → match → join → history/reply → human response journey, role application/credential evidence flow, worker operations, and human review are still open in `PRODUCT_END_TO_END_JOURNEY_PLAN.md`.
- Agent phase commits integrated: `a53de30` contribution levels, `c6538a7` community lifecycle/helper, and `a8275a0` UI/docs/browser journey. Pushed to `origin/codex/community-agent-creation` after verification. No merge to `main` or deployment was performed.
