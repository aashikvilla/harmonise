# Session Journal — Community activity progression

**Date:** 2026-11-02
**Branch:** `codex/community-progression`
**Goal:** Add community-scoped activity levels and optional human-reviewed role verification without editing existing community list/detail surfaces.

## Work recorded

- Added a SQL aggregate for visible posts and replies authored by an active membership in one community. Content under held/removed posts and held/removed content are excluded. Bodies need at least 20 trimmed characters; case-insensitive, whitespace-collapsed duplicate bodies count once across posts and replies, using the first visible occurrence's UTC day.
- Added `Getting started`, `Contributor` (3 contributions over 2 active days), and `Community regular` (10 over 5 active days). The authenticated progress endpoint returns only the caller's counts and thresholds, with no user or membership IDs.
- Added a reusable `CommunityProgressCard` that loads `/api/communities/{id}/progress`, handles loading/error/retry, and explains the limits of activity recognition.
- Added moderator-only reviewed role assignment/removal behind the server-only `COMMUNITY_ROLE_VERIFICATION_ENABLED` flag (default false in `.env.example`). A moderator cannot self-verify.
- Added clearly marked synthetic display fixtures; no Auth users or membership rows were seeded.

## Verification and outcome

- `npm run typecheck`: passed using a temporary junction to the main checkout's existing `node_modules`; the junction was removed afterward.
- ESLint on all changed TypeScript/TSX files: passed after fixing the effect-state lint rule.
- No unit tests were added or run. The migration was not applied to a live Supabase project; end-to-end behavior still needs integration after migration rollout.

## Notes

- Active-day thresholds use UTC calendar days. Counts include all currently visible qualifying unique activity; no retention window is applied. No AI judges content.
- The component is intentionally not wired into community pages in this branch so the integrator can place it after merge.
