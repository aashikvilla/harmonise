# Session Journal — Community Lifecycle and Scoped AI Helper

**Date:** 2026-11-02
**Branch:** `codex/community-lifecycle`
**Scope:** Backend community pending review, launch coverage approval, and per-community advisory helper.

## Work recorded

- Added migration `0003_community_lifecycle.sql`: existing communities remain approved; new communities default to `pending_review`; helper rows are backfilled for existing communities and created by trigger for every new row.
- Added service-role-only RPCs so community creation plus owner membership, and reviewer approval plus moderator assignment, are atomic. Approval requires an explicit coverage confirmation.
- Added authenticated community creation, reviewer-only proposal queue/approval, and member/owner helper-status routes. Names/descriptions/topics are bounded and sanitized, with descriptions required to be 20–500 characters. Public listings filter to approved communities and allow owners to see their own pending row; join, detail, and post access are gated.
- Bound moderation triage to the helper and its public community context. Triage events and queue responses retain helper ID, AI disclosure, and display name; model output remains advisory.
- No private session messages are read or copied by these routes. User-provided description is stored as plain text and remains pending until human review.

## Verification

- Read Next.js 16.4.3 Route Handler docs from the main checkout before implementation.
- `tsc --noEmit`: passed.
- ESLint on changed TypeScript files: passed after cleanup.
- Next.js production build (`next build --webpack`): passed. Turbopack could not resolve the shared dependency junction from outside the worktree root.
- No unit tests added or run; no migration was applied remotely.

## Operational note

- Launch approval fails closed until `COMMUNITY_REVIEWER_USER_IDS` is configured with reviewer UUIDs. The reviewer must explicitly confirm coverage in the approval request. This records an attestation; it does not itself schedule shifts or prove future availability.
