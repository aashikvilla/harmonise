# Harmonise Data, Identity, Consent, and Privacy Design

**Status:** Approved design for pilot implementation (Phase 2). Durable storage
lands in Phases 4–6 against this design; no real stories or audio are sent to
any provider until the notices below ship in the UI.
**Updated:** 2026-11-02
**Assumed backend:** Supabase (Postgres + Auth). The app treats the database as
provisioned; server routes use the service-role key, the browser never sees it.

## 1. Field map and trust boundaries

| Field | Goes to Meta | Stored by Harmonise | Visible to peers | Never shared |
|---|---|---|---|---|
| Private chat messages | Yes, on send (chat) | Yes, if account + resume enabled | No | Outside the sender's session |
| Voice audio (WAV) | Yes, on transcribe | No (device memory only, cleared after) | No | Anywhere else |
| Transcript draft | No | No (device memory until sent as chat text) | No | Until user sends it as chat |
| Tentative themes | No (derived server-side, returned to sender) | Yes, marked tentative | No | Discovery, until confirmed |
| User-confirmed themes | No | Yes, stored separately from suggestions | Only as discovery input, never quoted | Peers as quotes |
| Alias | No | Yes, per membership | Yes, within that community | Across communities |
| Post / reply text (approved) | Only on user-triggered triage of a report | Yes | Yes, to the post audience | Beyond the approved audience |
| Report reason | Only on user-triggered triage of that report | Yes | No (reviewers only) | Reporters' identity to authors |
| Moderation decision + rationale | No | Yes, with reviewer id + policy version | Decision outcome to author; rationale to reviewers | Model suggestion as a decision |
| Consent record | No | Yes (version, audience, exact text hash, timestamp, revocation) | No | — |

Rules:

1. Private narrative is never copied to a community post without a separate
   exact-text and audience confirmation. The share preview shows precisely the
   alias, audience, and text that will be stored.
2. Model output is untrusted data: schemas are constrained, values validated,
   lengths capped, and the user stays in control.
3. Model triage is a signal for a human; it never publishes, hides, bans,
   contacts, or escalates on its own.
4. Fixtures stay labeled fictional until real rows exist; empty/loading/error
   states must be truthful once the database is connected.

## 2. Provider data handling (to re-verify from current official terms)

- Text flows use Muse Spark Standard mode. Contributor mode is never used for
  user content.
- Voice uses the transcription model only; audio is sent solely when the user
  taps transcribe.
- The app makes **no** zero-retention or confidentiality promise about Meta
  until the applicable data-handling terms and the app's logging/storage
  behavior have been reviewed. The UI says what is sent, when, and that
  Harmonise cannot erase provider-side copies.
- Server logs carry route, status, latency, request id, and token counts only.

## 3. Identity model for the pilot: pseudonymous account

Comparison:

| Model | Resume/expiry | Abuse control | Privacy cost | Pilot fit |
|---|---|---|---|---|
| Anonymous session | Device-only, fragile | Weak | Lowest | Kept for pre-signup private chat only |
| **Pseudonymous account (chosen)** | Server resume + delete/export | Per-account quotas, blocks | Email held by auth provider | Yes: durable sessions + community without real names |
| Verified account | Strongest | Strongest | Highest friction | Out of scope for pilot |

- Sign-in via Supabase Auth (email link). No real-name requirement.
- One account may hold several per-community aliases; aliases never link
  across communities in the UI.
- Server authorizes every read/write from the auth token; client-supplied ids
  are never trusted. RLS policies mirror the server checks (defense in depth).
- Roles: `member`, `moderator`, `admin`. Role checks run server-side; the
  browser role label is display-only.
- Sessions expire after 30 days of inactivity; private sessions after 90 days
  (see retention). Shared devices: explicit sign-out clears local tokens and
  drafts; no "remember me" on shared-device flow.

## 4. User rights: access, export, deletion

- **Access/export:** one export per account (`/api/account/export`) returning
  sessions, messages, consents, posts, and decisions as JSON.
- **Deletion:** `/api/account/delete` removes profile, sessions, messages,
  memberships, posts, and consents (hard delete) and revokes auth. Reports and
  moderation decisions about the user are retained pseudonymized for 12 months
  for safety appeals, then purged.
- **Session delete:** per-session delete removes its messages and tentative
  themes immediately.
- **Propagation:** deletes cascade in Postgres (`ON DELETE CASCADE`) and are
  confirmed by a post-delete read-back before the API returns success.
- **Provider copies:** anything already sent to Meta cannot be deleted by
  Harmonise; the UI states this before each transfer.

## 5. Schema and migration plan

Authoritative DDL: `supabase/migrations/0001_harmonise_core.sql`.

- Private tables (`private_sessions`, `session_messages`) are separated from
  community tables (`communities`, `memberships`, `posts`, `post_replies`).
- Every share action writes a `consent_records` row: consent version, audience,
  SHA-256 of the exact approved text, timestamp, revocation state.
- Moderation state (`reports`, `moderation_events`, `moderation_decisions`)
  keeps the human decision apart from the model suggestion, with the policy
  version attached.
- Migrations are additive and reviewed; destructive changes need a separate
  migration plus a deletion-propagation check.
- Encryption: TLS in transit; Supabase at-rest encryption for Postgres and
  Auth. Backups follow the Supabase project plan; point-in-time recovery is
  enabled for the pilot project.
- Retention jobs (Phase 8): nightly expiry of idle sessions (90 days) and
  purging of expired pseudonymized safety rows (12 months).

## 6. Threat model (pilot scope)

| Threat | Mitigation |
|---|---|
| Cross-account reads via forged ids | Server token auth + RLS ownership checks; negative tests with a second user |
| Privilege escalation to moderator | Server role check on every moderation route; role changes admin-only + audited |
| Private text leaking to community | Exact-text confirmation gate; separate tables; no shared query path |
| Prompt/data exfiltration via model | Structured outputs, allowlists, capped lengths, no raw echo of stored data |
| Key exposure | Service-role key server-only; anon key limited to Auth; no `NEXT_PUBLIC_` secrets |
| Limiter bypass on multi-instance | Shared Upstash limiter when configured (Phase 1) |
| Abuse of triage/reporting | Per-user report quotas, idempotent events, dead-letter review |

Out of scope for the pilot: end-to-end encryption, on-device-only mode,
multi-region residency guarantees.

## 7. RLS verification (positive and negative cases)

Run with two pilot accounts (A, B) and one moderator (M):

1. A reads A's session → allowed; B reads A's session → denied.
2. B inserts a message into A's session → denied.
3. Visitor reads a public community post → allowed; reads member-only post →
   denied without membership.
4. A joins, posts with consent record → allowed; post visible to members only.
5. B reports A's post → allowed; B reads the report queue → denied.
6. M reads the report queue → allowed; M decides → allowed, decision stored
   with reviewer id; A sees outcome, not reviewer notes.
7. A deletes A's session → messages gone on read-back; export no longer lists it.

## 8. Notices to ship before real data flows

- Chat/voice/adviser/triage transfer disclosures (shipped, Phase 0).
- Signup: what an account stores, expiry windows, export/delete paths.
- Share preview: alias, audience, exact text, consent version, revocation note.
- Moderation: human review required, response-time expectation, appeal path.
- Provider note: what leaves the device, and that provider copies cannot be
  erased by Harmonise.
