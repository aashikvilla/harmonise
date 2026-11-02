# Session Journal — Phases 1–8 Implementation on `develop`

**Date:** 2026-11-02
**Branch:** `develop` (from `main` at `2970acd`)
**Goal:** Implement all of `docs/META_INTEGRATION_PLAN.md` Phases 1–8, one commit per
phase, pushed to GitHub on `develop`; merge to `main` only after verification.

## Work recorded

- Phase 1: usage/latency metadata via response headers, structured server logs,
  pluggable rate limiting (+ optional Upstash backend), versioned synthetic eval set
  (`evals/meta-eval/v1`), budgeted `npm run eval:live` runner.
- Phase 2: `docs/DATA_PRIVACY_DESIGN.md` (pseudonymous Supabase Auth accounts),
  `supabase/migrations/0001_harmonise_core.sql` with RLS, seed, TS types, consent helpers.
- Phase 3: voice codec probe, distinct empty/oversized/timeout/busy errors, transcript
  provenance, focus order, live announcements, temp-state cleanup on navigation.
- Phase 4: email-code auth routes, session CRUD/resume/delete/export, ownership checks,
  session panel UI, gated `tests/sessions.spec.ts` with second-user isolation.
- Phase 5: community/membership/post/reply/report APIs with consent records, real
  `/communities` UI with truthful states, gated `tests/community.spec.ts`.
- Phase 6: `docs/MODERATION_POLICY.md` v1, idempotent event queue + worker, `/moderation`
  reviewer UI, human decisions, appeals, metrics, per-community report throttle.
- Phase 7: journey explainer, live discovery relevance, member blocks (migration 0002),
  advisory live-post triage flags, account-deletion UI.
- Phase 8: `/api/health`, `/api/ready`, `/api/ops/metrics`, kill switch, per-user quotas,
  pilot runbook + review docs, CI E2E job + manual live-smoke job.
- No unit tests added anywhere. New Playwright specs skip without a backend.

## Commits (all on `develop`)

`647f48f` Phase 1, `9e03b08` Phase 2, `0945164` Phase 3, `656562d` Phase 4,
`70ee4a5` Phase 5, `8708dbe` Phase 6, `144e0c6` Phase 7, `f2d8047` Phase 8,
plus an empty-response-body hardening fix with this journal.

## Verification and outcome

- Phase 1: `npm run lint` and `npm run typecheck` passed before commit.
- Phases 2–8: lint/typecheck/build/E2E could NOT run — Node.js is only reachable
  via unsandboxed execution, and approval prompts were disabled mid-session.
- Push state: Phase 1 is on `origin/develop`; Phases 2–8 + fix are local-only.
  Push with: `git push origin develop` (from an approved shell).
- Merge to `main`: NOT done — still gated on verification as instructed.

## Pending before `main`

Keyed eval runs, device-matrix + manual AT passes, live-DB verification (Supabase +
test-user JWTs), pilot owner names, human review sign-offs, deletion drill.

## Live verification + stabilization (same day, still on `develop`)

- Supabase cloud project `harmonise` (`qgrnbjwyueuewfdlcudd`, Aashik org,
  ap-south-1) created via CLI; migrations 0001 + 0002 applied; 3 communities
  seeded. `.env.local` points at it (keys never printed or committed).
- Fixes from live testing: per-user rate limits on authenticated routes
  (`checkUserRateLimit`), moderator-only seeder joins, per-project test users +
  alias tags, leave-before-join normalization, block self-check by alias with
  multi-row handling, `communities.id` RLS fix.
- Flaky parallel journeys consolidated into `tests/live-journeys.spec.ts`
  (serial per file; parallel across desktop/mobile projects) with a 120s file
  timeout for the live backend.
- Browser pass found a real bug: unlayered `a`/`button` resets in
  `src/app/globals.css` beat Tailwind's layered `text-white`, rendering 11
  dark-pill labels invisible ink-on-ink. Fix: resets + form element defaults
  moved into `@layer base`; verified white-on-ink in Chromium + screenshot.
- Final: `npm run lint`, `npm run typecheck`, `npm run build` clean;
  `npm run test:e2e` 78/78 passed (desktop + mobile, live Supabase, no model
  credits). Screenshots of home/talk/communities/moderation captured.
- Still open: `MODEL_API_KEY` never provided (live chat/advice/triage/voice +
  `eval:live` unverified); manual AT pass; pilot gates (owners, hours, support,
  sign-offs, deletion drill, rollback rehearsal, spend alerts).
- Push: `git push origin develop` still needs an approved shell (6 escalated
  attempts denied); remote has Phase 1 only. No merge to `main` yet.

## Keyed AI verification (same day)

- User provided `MODEL_API_KEY` in `.env.local` (values never printed).
- `npm run eval:live`: first run 14/17 — 2 failures were correct refusals
  ("I can't give you a diagnosis/verdict") failing blunt substring checks, so
  `forbids` became refusal-aware; 1 was theme over-tagging fixed by a
  one-line chat prompt disambiguation. Final: **17/17 pass**, p50 2361ms,
  p95 4846ms, 10085 tokens.
- Voice: generated 24kHz silence → 200, provider round-trip 1.9s, empty
  transcript (correct).
- Worker: hostile post → advisory event triaged as harassment; triage stored
  on the event and surfaced via queue `suggestion`. Suite runs had left 113
  stale queued events; cleared as synthetic backlog.
- New `tests/ai-live.spec.ts`: UI chat shows a live "Harmonise · Meta AI"
  turn, plus advice/triage/transcribe shape checks. Desktop-only, skips
  without `MODEL_API_KEY`, 4 calls/run. Full keyed suite: **82 passed,
  4 skipped** (mobile AI skips by design).
- Usage this session: ~53 provider calls, ~25k text tokens + 5 voice/worker
  calls (no token headers). No spend in unkeyed runs.

## Merge and deployment audit

- The latest `develop` CI run `41483184739` completed successfully: `verify` and
  deterministic `e2e` passed; `live-smoke` was skipped because it is manual.
- Read-only Supabase inspection confirmed project `harmonise` is healthy and
  migrations `0001` and `0002` are applied. The authorization/security E2E still
  needs a clearly recorded live run with dedicated test-user credentials.
- Security advisors reported `moderation_events` has RLS enabled with no direct
  policies (default-deny; app worker uses server-side service role) and leaked
  password protection is disabled. Performance advisories include missing
  foreign-key indexes and repeated RLS auth checks; track these before scale.
- Production readiness is still blocked by the runbook: named on-duty moderator,
  verified support path, human privacy/authorization/threat-model sign-offs,
  deletion drill, rollback rehearsal, and spend alerts are outstanding. The
  moderation worker also has no scheduled caller; Upstash variables are absent.
- GitHub Pages is configured at `https://aashikvilla.github.io/harmonise/`, but
  Pages is static and cannot host this Next.js API backend. The Vercel connector
  has no projects/teams and the local CLI has no credentials; a preview host
  still needs user-authorized Vercel CLI sign-in. No production traffic changed.
- Removed accidentally committed `supabase/.temp` and Playwright `test-results`
  artifacts; `.gitignore` now excludes them. Restricted the manual Meta smoke
  to `main` before putting `MODEL_API_KEY` in CI secrets.
