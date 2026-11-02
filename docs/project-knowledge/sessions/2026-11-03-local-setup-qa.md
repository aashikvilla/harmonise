# Session Journal — Local setup QA and cron release check

**Date:** 2026-11-03
**Branch:** `journey/end-to-end-2026-11-03`
**Goal:** Check whether the Vercel Hobby cron fix reached `main`, run the local app, and verify end-user flows across desktop and mobile.

## Findings and changes

- The cron cadence fix is in commit `4841a04` and has a successful Vercel preview deployment (`dpl_DWDsFtJiNrv9MoTRWfrYmktEzWxH`, READY). Its two schedules are daily at 05:00 and 09:00 UTC. The current production deployment's readiness endpoint reported the database reachable. The feature-branch preview does not have database credentials configured, so its readiness endpoint reports the database unconfigured.
- At the start of this run, production `main` still pointed at `75dade0`, before the cron fix; the fix had not yet reached `main`.
- Local `/api/ready` reported the database reachable and the model integration configured. The readiness probe does not prove a live model completion.
- The browser journey `independent spaces support group-only contact, reviewed contribution and human review` exceeded the default 30-second timeout when all viewport projects ran together. It passed alone in 28.4 seconds. Set this unusually long journey's timeout to 60 seconds and reran the desktop/mobile suite successfully.
- Added the timeout lesson to `PAST_MISTAKES.md`.
- A concurrent saved-session refresh fix (`a24d840`) landed on the same feature branch and is included in the passing local build and deployment.

## Verification

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed on Next.js 16.4.3; 44 static pages generated and all app/API routes compiled.
- E2E desktop and mobile homepage, demo, community proposal, visual system, and product journeys — 72/72 passed on rerun.
- Read-only authenticated-session/community/moderation guards — 8 passed, 2 moderator-token-gated checks skipped.
- Live Meta integration smoke — 4/4 passed using synthetic chat, advice, triage, and generated silence inputs.
- The stateful live-community journeys were not run because they create/delete community posts in the connected database. The broader live-model evaluation suite was not run; this session used only the four-call smoke above. The `/app` and `/connect` journeys remain explicitly fictional demos per the architecture notes; production community/moderation surfaces use the database-backed APIs.

## Release status

- Pushed the validated feature branch to `origin/journey/end-to-end-2026-11-03`; latest preview deployment for `a24d840` is READY. Its readiness endpoint reports database credentials are not configured for this preview environment.
- Production `main` still pointed at `75dade0` at the time of this journal entry; fast-forward it after review and confirm its Vercel production deployment before calling the cron fix released.
- The daily worker still processes one queue item per run and does not provide continuous human moderation coverage.
