# Session Journal — Password sign-in and shared demo access

**Date:** 2026-11-04
**Branch:** `codex/email-password-auth` (merged to `main`)
**Goal:** Replace email-link/code login with email/password, add one-tap demo sign-in, rename homepage calls to action, and deploy.

## Changes

- Merged the pending journey/docs and cinematic demo work to main first, then implemented password login in a separate branch.
- Added server-side Supabase Auth email/password signup and sign-in with httpOnly session cookies, rate limiting, input bounds, and profile creation.
- Added one-tap demo sign-in backed by server-only `DEMO_ACCOUNT_EMAIL` and `DEMO_ACCOUNT_PASSWORD`. The account is created on first use and reused after that. The page warns that this is a shared account and activity may be visible to other demo visitors.
- Configured the demo account environment variables for Vercel production and preview; the password is sensitive and is not stored in source or this journal.
- Changed homepage actions to “Sign in,” “Get started,” and “Start your journey.” Updated the homepage footer to describe real account/community behavior.
- Updated the demo runbook and cinematic script for email/password entry and shared demo behavior.
- The Supabase project owner confirmed that Auth Confirm Email was disabled. This allows immediate signup but marks email addresses confirmed without proof of ownership; keep the shared account for fictional demo content only.

## Verification

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- Production deployment for main commit `b48bd98` — READY on `harmonise-weld.vercel.app`.
- Production one-tap demo endpoint returned HTTP 200 and set the app session; `/api/auth/me` returned HTTP 200 for the synthetic `demo@harmonise.example` identity.
- Headless browser walkthrough on production: all three homepage CTA labels were present, **Get started** reached `/connect`, the one-tap demo button reached `/connect/member`, the member heading rendered, and there were no page errors.
- One initial unauthenticated request used a Vercel SSO hostname and returned HTML; verification was repeated against the configured `harmonise-weld.vercel.app` custom alias, which returned the application JSON successfully.
- No automated test suite was added or run. This release was verified with lint, typecheck, production build, authenticated HTTP checks, and one production browser journey.

## Operational caution

The demo account is a shared production identity by request. Its Supabase-backed data persists and is mutable by visitors. The UI labels it shared and asks visitors to use fictional content. Do not treat it as isolated staging; populate it only with synthetic examples and reset its records before public presentations as needed.
