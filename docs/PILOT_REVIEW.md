# Harmonise Pilot Reviews

**Status:** living checklist. Code-complete checks are marked; human sign-off rows need
names and dates before launch.

## 1. Privacy review

- [x] Field map reviewed (`docs/DATA_PRIVACY_DESIGN.md`): private chat, audio,
      transcripts, tentative vs confirmed themes, aliases, posts, reports, decisions.
- [x] Transfer disclosures ship at every Meta boundary (chat, voice, adviser, triage).
- [x] No zero-retention promise is made about Meta; UI states provider copies can't
      be erased by Harmonise.
- [x] Server logs carry route, status, latency, request id, and token counts only.
- [x] Consent records capture version, audience, exact-text hash, timestamp, revocation.
- [ ] Human sign-off: __________ on __________.

## 2. Authorization review

| Surface | Rule | Evidence |
|---|---|---|
| Sessions/messages/understanding | Owner JWT only; ids from path validated as UUID | `tests/sessions.spec.ts` isolation test (runs with test users) |
| Member-only posts/replies | Active membership required | `tests/community.spec.ts` 403 tests |
| Post/reply writes | Active membership + current consent version | 409 stale-consent tests |
| Reports | Active membership; per-user + per-community caps | Route guards + `community-busy` path |
| Moderation queue/metrics/flags | Moderator role in that community | 403 tests in `tests/moderation.spec.ts` |
| Decisions/appeal rulings | Moderator; rationale required for action | 400/403/409 tests |
| Appeals | Content author only, one open per decision | 403/409 tests |
| Blocks | Own membership only | 403 self-block test |
| Worker/metrics endpoints | Shared secrets, no user data | 403 tests |
| Service-role key | Server-only; RLS mirrors checks | Migration policies + design doc |

- [ ] Human sign-off: __________ on __________.

## 3. Threat model

Covered in `docs/DATA_PRIVACY_DESIGN.md` section 6: cross-account reads, privilege
escalation, private-text leaks, prompt exfiltration, key exposure, limiter bypass,
reporting abuse. Residual pilot risks: single-instance memory quotas/limiters (replace
with shared backends before scale), email-code delivery dependence, no residency
guarantees.

- [ ] Human sign-off: __________ on __________.

## 4. Data-deletion drill

1. Create a test account; save a session; join a community; post and reply.
2. Delete one session → read-back shows no session and no messages.
3. Delete one post → read-back shows no post; replies cascade.
4. Export the account → JSON contains only that user's rows.
5. Delete the account with confirmation `delete my data` → profile, sessions,
   messages, memberships, posts, consents gone on read-back; cookies cleared.
6. Record: operator, date, release, and any leftover rows (none expected).

- [ ] Drill completed by __________ on __________ (release __________).

## 5. Release verification

- [ ] Deterministic E2E green on the candidate (CI `verify` + `e2e` jobs).
- [ ] Synthetic live-provider smoke run with explicit caps; usage metadata only.
- [ ] `/api/health` and `/api/ready` checked in the deployed environment.
- [ ] Kill switch toggled and observed (503s without provider calls), then cleared.
