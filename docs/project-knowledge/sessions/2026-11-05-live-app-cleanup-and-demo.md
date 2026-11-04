# Session Journal — Live app cleanup and demo

**Date:** 2026-11-05
**Branch:** `codex/live-product-demo`
**Goal:** Replace fictional demo surfaces with real backend/Meta flows, make the voice feature visible, verify the app, and record a real product demo.

## Findings

- The production alias was still at commit `93fa5ce`; its `/app` page served the older fictional Arjun walkthrough and had no voice control.
- Production `/api/auth/config` and shared `/api/auth/demo` both returned 200. The local checkout could not authenticate (`/api/auth/demo` returned 503), so its signed-out `/app` view intentionally did not render authenticated chat controls.
- Production Supabase currently has one populated approved circle (58 active memberships, 15 visible posts) and two empty approved circles. The demo user has no circle memberships or contributions.
- Production posts are member-only personal narratives. There is no isolated Harmonise staging database or Supabase branch available in this workspace; synthetic production activity was not created.
- The former public community API included an unused moderator headcount. It has been removed from the count query and public response.

## Code changes

- Replaced the homepage iframe/story and `/app` fictional experience with real landing and private Meta chat/session/voice paths.
- Removed fictional support profiles, milestone scoring, local-only chat fixtures, dead OTP routes, and stale prototype surfaces.
- Added server-side signup validation for adult and AI-processing disclosures.
- Made Meta Voice Transcribe visible as “Record a voice message,” with explicit post-auth placement and editable-transcript guidance; added desktop/mobile E2E coverage.
- Return the actual serving model from `/api/advice` and show `Meta Muse Wonder` or `Meta Muse Spark` on the result.
- Added the V1 live-app screen recording plan and Playwright capture script outside deployable app source.

## Verification

- `npm run build`, `npm run typecheck`, and `npm run lint`: passed on the final source.
- Full desktop/mobile Playwright: 51 passed, 18 skipped, one desktop community-detail timeout under parallel load; that community test passed when rerun alone.
- Final focused desktop/mobile journeys: 20/20 passed serially across sign-in, age/AI disclosure gating, crisis cutoff, actual advice model attribution, signup states, community proposal flow, and authenticated voice control.
- `node --check demos/live-application/v1/capture-v1.mjs`: passed.
- No production community writes were performed. The hosted demo login was used read-only to inspect real directory/community/account counts.

## Recording safety

The capture plan is deliberately read-only after login. It does not join, post, react, report, submit a community proposal, or approve moderation. Voice input is transcribed to an editable draft and left unsent. Do not show member-only posts or personal identifiers in the recording.

## Next

Merge/deploy through the authorized main path, verify production AI + Voice Transcribe with the shared demo account, record and cold-review the real video, then preserve the final film and narration in `demos/live-application/v1/recording/`.
