# Session Journal — Production deployment follow-up and demo plan

**Date:** 2026-11-04
**Branch:** `journey/end-to-end-2026-11-03`
**Goal:** Answer deployment status, establish why deployment stalled, and plan a cinematic full-product demo with accurate AI and live/prototype boundaries.

## Findings and completed work

- Production deployment of main commit `edbed0b` is READY. Vercel readiness returned `ready: true`, with database reachable and model configured; no runtime error/fatal events appeared in the last 30 minutes queried.
- The stall came from unsupported Vercel Node `26.x` and a stale preview deployment on `journey/end-to-end-2026-11-03` occupying the Hobby project's single build slot. Set the Vercel project to Node `24.x`, canceled the stale preview, and redeployed the exact main commit successfully.
- Production has `META_WONDER_ROUTES=setup,advice`: Wonder is primary on those routes, Spark is fallback. This is not a global model switch.
- Read-only Supabase migration history includes the community engagement and server-only access migrations. Earlier summary language that they remained unapplied was inaccurate. No production SQL or content writes were made for this turn.
- Audited current source and found the old runbook/architecture documentation contradicted implementation: `/connect` is real OTP-backed auth and persisted member/community APIs; `/app` is the local fictional prototype. The old shared credential and fake-local-flow instructions were removed from the current runbook.
- Added `docs/END_TO_END_DEMO_SCRIPT.md`, an 8:30 cinematic script plus 6:00 cut, exact synthetic prompt, shot timing, hold/scroll pacing, voiceover, AI inventory, staging requirements, recording checklist, and additional feature appendix.
- Documented material recording blockers honestly: no synthetic member activity is created by the checked-in community seed; no live reviewer allowlist in production; the onboarding disclosure still names Spark while adviser/setup are Wonder-first; the authenticated member shell still says “Prototype.”
- Added a Past Mistakes note: verify current source and remote state before trusting old runbooks or prior summaries.

## Verification and boundaries

- Verified source paths and route behavior by read-only inspection; read-only Supabase migration evidence and production readiness/build state were available from this session's platform checks.
- No tests were run, per project instruction. No user or community content was modified. No production DB writes were made.
- This branch is the flagged journey branch. The existing seed-script rewrite remains untouched and is not included in the demo plan. Do not merge this branch wholesale to main.
- The demo plan is documentary; the staging fixture pack, stale UI copy fixes, and staffing/reviewer setup are still prerequisites before recording the complete end-to-end path.
