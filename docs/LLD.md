# Harmonise — Low-Level Design (LLD)

**Audience:** hackathon jury + implementing engineers. **Scope:** route
contracts, the Meta model adapter, request lifecycles, data model, state
machines, guards, workers, clients, evals, and failure handling.
Every file cited was read; ungrounded claims are marked *unverified*.

## 1. Runtime and dependency baseline

- **Next.js 16.4.3 App Router + React 19**, Node server mode
  (`package.json`, `next.config.ts`). No static export; `instrumentation.ts`
  calls `initSharedRateLimiting()` on Node startup.
- **Zero ORM / zero Supabase JS client.** Server data access is plain `fetch`
  to PostgREST + Auth endpoints (`src/lib/db/supabase.ts`,
  `src/lib/auth-server.ts`). No new runtime dependencies beyond
  `next`/`react`/`react-dom`/`lucide-react`.
- **Scripts:** `dev`, `build`, `start`, `lint`, `typecheck`, `test`
  (vitest), `test:e2e` (Playwright, `tests/playwright.config.ts`),
  `eval:live` (`scripts/meta-eval.mjs`).

## 2. Meta model adapter — `src/lib/meta-model.ts`

Single choke point for all Meta text calls (voice uses its own route, §4.5).

### 2.1 Endpoints and wire format

- Base `https://api.meta.ai/v1`; text via `POST /chat/completions`
  (OpenAI-compatible): `{ model, messages, max_completion_tokens,
  temperature, reasoning_effort: "minimal", response_format? }`.
- Auth: `Authorization: Bearer ${MODEL_API_KEY}`, server-side only.
  Missing key → `MetaModelError(503, "missing-key")`. Model ids validated
  against `/^[a-z0-9][a-z0-9._/-]{0,63}$/i`; invalid → `503
  "invalid-model"`. Client-supplied model ids are never passed through
  (`ChatOptions.model` is server-selected only).
- Timeouts: `AbortSignal.timeout(30_000)` → `503 "timeout"`.
- HTTP mapping: 429 → `429 "rate-limited"`; 408 → `503 "timeout"`;
  other 4xx → `"bad-request"`; 5xx → `"provider-error"`. Unparseable or
  empty-choices/empty-content bodies → `502 "bad-response"`.
- Usage parsing reads `prompt_tokens|input_tokens`,
  `completion_tokens|output_tokens`, `total_tokens` (non-negative finite
  numbers only) into `MetaUsage`; result shape is
  `{ text, usage, latencyMs, model }` (`MetaResult`).

### 2.2 Model selection and routing

- `DEFAULT_TEXT_MODEL = "muse-spark-1.3"`; `configuredTextModel()` prefers
  `META_TEXT_MODEL`. `WONDER_MODEL = "muse-wonder-1.0"`.
- `ModelRoute = "setup" | "advice" | "facilitate" | "chat"`.
  `wonderRoutes()` parses `META_WONDER_ROUTES` (default `"setup,advice"`;
  empty disables Wonder).
- `modelFor(route)`: `setup` honors a valid `META_SETUP_MODEL` override
  first; any route listed in `wonderRoutes()` resolves to Wonder; otherwise
  the configured text (Spark) model.
- `requestMetaChatRouted(route, options)`: calls the primary model, and on
  any failure retries once on the configured text model — **except** when
  primary already equals fallback, and **except** rate-limits (rethrown
  immediately to respect provider backpressure).
- `requestValidatedWithFallback(route, options, validate)` is the standard
  call for advisory surfaces: validates the primary model's output and
  retries once on Spark on validation failure. Callers: `/api/advice`
  (`"advice"`) and `/api/communities/propose/assist` (`"setup"`).
- Effective routing as read (no env overrides): `setup` → Wonder/Spark
  fallback; `advice` → Wonder/Spark fallback; `chat`, `facilitate` (and all
  direct `requestMetaChatDetailed` callers: triage, queue worker, guide,
  scope review, facilitator) → Spark. With `.env.example` applied,
  `META_SETUP_MODEL=muse-spark-1.3` pins setup to Spark.

### 2.3 Rate limiting (same module)

- `RateLimitStore.checkAndRecord(key, max, windowMs)`; default is a
  process-memory sliding-window store (5000-bucket cap, clears on overflow).
- `checkRateLimit(request, scope, max, windowMs=60s)`: IP from
  `x-forwarded-for` → `scope:ip`. `checkUserRateLimit(userId, scope, …)`:
  per-account `user:scope:id`. `configureRateLimitStore()` swaps in the
  shared backend; `isSharedRateLimitStoreConfigured()` reports it.
- `modelFailureStatus()` / `modelErrorKind()` translate `MetaModelError`
  into safe route responses (429→503, 4xx→502, passthrough otherwise;
  non-model errors → 503).

## 3. Shared route guards

### 3.1 `src/lib/api-guard.ts` (server-only, never logs bodies)

- `newRequestId()` (UUID), `bodyTooLarge(request, maxBytes)` via
  content-length, `parseJsonBody()` (ok/err union).
- `logRouteCall({route,status,latencyMs,requestId,outcome,providerLatencyMs?,
  usage?,model?,errorKind?})`: single JSON line — route, status, latency,
  request id, token counts only — plus `recordRouteMetric()`.
- `withMetaHeaders()`: `x-harmonise-request-id`, `x-meta-latency-ms`,
  `x-meta-{input,output,total}-tokens`, `x-meta-model`. No prompts,
  completions, keys, or audio.

### 3.2 `src/lib/ops-limits.ts` — kill switch + per-user quotas

- `isKillSwitchOn()`: `HARMONISE_KILL_SWITCH === "1"` → model routes fail
  closed (503 `unavailable`, `errorKind: kill-switch`) without calling Meta.
- `checkUserQuota(userId, route)`: per-route daily counter, cap from
  `DAILY_MODEL_CALLS_PER_USER` (default 100), UTC-day buckets in process
  memory (20k cap). Over → 429. `userIdForQuota()` resolves the user only
  when a token/cookie is present, else anonymous callers stay on IP limits.

### 3.3 `src/lib/ops-metrics.ts` — metadata-only counters

Per-route `{count, errors, rateLimited, latencySum/Max,
providerLatencySum/Calls, inputTokens, outputTokens}` plus
`killSwitchDrops`/`quotaDrops`. Served (with queue depth + funnel) by
`GET /api/ops/metrics` behind `x-ops-secret`, rendered by `/ops`
(`src/app/ops/page.tsx`).

### 3.4 Deterministic screens — `src/lib/connect/catalog.ts`

- `detectCrisis(text)`: regex phrase screen (suicide, self-harm, danger,
  harm-to-others). Runs **before any model call** on client and server;
  routes to safety UI/resources, never to automated action.
- `leaksCommunityReference(text)`: guards adviser visible text against
  naming/hinting communities (server rejects leaking outputs).
- Fixed demo catalogs (`COMMUNITY_IDS`, `COACHES`, `SUGGESTED_MILESTONES`).

## 4. Model-backed API routes

All below: `export const runtime = "nodejs"`, kill-switch → quota → rate
limit → body cap → input validation → crisis screen (where applicable) →
Meta call → strict schema validation → `finish()` with log + meta headers.
On any model failure the user's text is preserved for retry; UI copy names
Meta explicitly.

### 4.1 `POST /api/chat` — `src/app/api/chat/route.ts`

- **Model:** Spark via `requestMetaChatDetailed` (unrouted — always the
  configured text model). Limits: 20 req/min/IP, 24 KB body, message ≤
  `MAX_MESSAGE_LENGTH` (2000, `src/lib/connect/advice.ts`), last 8 history
  turns via `cleanHistory()`.
- **Prompt:** `SYSTEM_PROMPT` — warm non-clinical peer guide; no diagnosis,
  no medical/legal advice, no stay/leave verdicts, ≤1 gentle question,
  untrusted-input framing, theme timing rules
  (timing/family pressure → `family-expectations`), need-summary style cap.
- **Schema** (`harmonise_chat_turn`, strict): `{ reply, suggestedThemes:
  ThemeId[≤4], supportNeed, needSummary }` against the 8-theme /
  4-need enums shared with `src/lib/harmonise.ts`.
- **Validation:** `validResult()` enforces enums, trims/caps
  (reply 1600, needSummary 300 chars), dedupes themes. Crisis match →
  `200 {crisis:true}`, outcome `crisis-screened`, no model call.
- **Call:** `maxTokens: 550, temperature: 0.55`.

### 4.2 `POST /api/advice` — `src/app/api/advice/route.ts`

- **Model:** `requestValidatedWithFallback("advice", …)` — Wonder-first by default,
  automatic Spark fallback on request failure *or* validation failure; response headers report the serving model.
  Limits: 10 req/min/IP, 16 KB body, last `MAX_HISTORY_TURNS` (4) turns.
- **Grounding:** `loadMatchable()` pulls ≤8 approved communities from
  `listCommunities()` and appends `id: name — topics` lines to the system
  prompt; the JSON schema enums match ids to that allowlist
  (`__none__` when empty).
- **Prompt:** calm peer guide; reflection/steps/perspective must not
  mention communities/matching/groups; 0–2 matches only on clear fit;
  `validAdvice()` enforces 2–4 steps, ≤2 allowlisted matches, length caps
  (reflection 600, step 350, perspective 450, reason 300), and rejects any
  `leaksCommunityReference()` hit.
- **Call:** `maxTokens: 700, temperature: 0.7`.

### 4.3 `POST /api/moderation/triage` — `src/app/api/moderation/triage/route.ts`

- **Model:** Spark via `requestMetaChatDetailed`, `maxTokens: 700,
  temperature: 0`. Limits: 30 req/min/IP, 5 KB body, text ≤3000 chars.
- **Schema** (`harmonise_moderation_triage`, strict): `{ concern ∈ 8
  policy concerns, severity ∈ low/review/urgent, rationale,
  recommendedAction ∈ no-action/human-review/urgent-human-review }`.
- **Prompt:** safety triage assistant; classify only supplied text; never
  decide guilt, diagnose, infer intent, or take action; urgent only for
  credible immediate threat / explicit imminent self-harm.
- **Crisis short-circuit:** deterministic match returns a fixed
  `self-harm/urgent/urgent-human-review` advisory without a model call.
- Advisory only: the route changes no content status; enforcement lives in
  `POST /api/moderation/decide` (human-only).

### 4.4 `POST /api/communities/propose/assist` — setup copilot

`src/app/api/communities/propose/assist/route.ts`. Auth required
(`getAuthUser`), quota scope `community-setup`, 5 req/min/user, 4 KB body.

- **Model:** `requestValidatedWithFallback("setup", …)` — Wonder-first unless
  `META_SETUP_MODEL` pins it; Spark fallback on request or validation failure.
  `maxTokens: 900, temperature: 0.2`.
- **Input:** proposal `{name, purpose, topics}` + ≤40 approved communities
  (id/name/description/topics) as the fit-check universe.
- **Schema** (`harmonise_community_setup_draft`, strict): description,
  included/adjacent/out-of-scope topics, 3–6 norms, welcome message, 2–4
  starter prompts, `communityFit {kind ∈
  fits-existing/distinct-community/human-review, candidateIds ≤3,
  explanation}`.
- **Validation:** `validateDraft()` — NFKC/HTML/control-char cleanup,
  per-field caps, dedupe; `candidateIds` must be subset of supplied ids;
  `fits-existing` requires ≥1 id, other kinds require empty.
- Response includes the draft plus hydrated `matchingCommunities` and
  reports the serving model in `x-meta-model`; the host edits and
  explicitly includes the scope package at proposal submit (client:
  `src/components/community/community-proposal-form.tsx`), and the
  proposal still enters `pending_review`.

### 4.5 `POST /api/voice/transcribe` — `src/app/api/voice/transcribe/route.ts`

- **Model:** `muse-voice-transcribe-1.0`, `POST
  https://api.meta.ai/v1/asr/transcribe`, multipart `{request: {model,
  audioEncoding: WAV, mode: PUSH_TO_TALK}, audio}`. 45 s provider timeout,
  8 MB WAV cap (`audio/wav|wave|octet-stream`, else `wav-required`).
  Limits: 8 req/min/IP + `voice` quota scope.
- Returns `{transcript ≤4000 chars}`; 429→503, other provider errors→502.
  Input-only: no TTS, no streaming. Client records locally, converts to
  24 kHz mono PCM WAV (`encodeMonoPcmWav`), reviews, then transcribes;
  transcript stays editable and unsent
  (`src/components/harmonise-experience.tsx`).

### 4.6 `POST /api/communities/[id]/guide` — private member guide

`src/app/api/communities/[id]/guide/route.ts`. Requires DB, auth, **active
membership** in an **approved** community, active helper row, quota scope
`community-guide`, 8 req/min/IP, 8 KB body, question ≤1200 chars.

- **Model:** Spark via `requestMetaChatDetailed`, `maxTokens: 300,
  temperature: 0.2`.
- **Grounding:** community name/description/topics + approved scope
  package only (`approvedScopePackage()` sanitizes; empty scope →
  immediate `out_of_scope`). Never reads posts, replies, or private chats.
- **Schema** (`harmonise_community_guide`, strict): `{decision ∈
  answer/out_of_scope, answer}`; `out_of_scope` answers are replaced
  server-side with a fixed message. Crisis match returns a fixed crisis
  message **without calling Meta** (and explicitly does not alert anyone).
- Client `src/components/community/community-guide.tsx` discloses the Meta
  transfer, shows private-reply framing, and handles 401/403/429/paused.

### 4.7 Scope stewardship — `src/app/api/communities/[id]/scope-proposals/*`

- `POST /api/communities/[id]/scope-proposals`: moderator-only, quota
  scope `scope-review`, 4 req/15 min/user/community, excerpt 40–1200
  chars. **Model:** Spark direct, `maxTokens: 650, temperature: 0.1`.
  Sends public scope metadata + the one moderator-selected excerpt (never
  stored — only its length). Schema
  (`harmonise_community_scope_review`): `recommendation ∈
  clarify/expand/split`, `risk ∈ low/moderate/high`, rationale, revised
  current scope, and (split only) new-community draft. Server normalizes:
  splits keep current scope untouched; non-splits clear new-community
  fields. Persists a `community_scope_changes` row with model +
  provider latency for audit.
- `GET` lists ≤25 changes (moderators). `PATCH …/[proposalId]`
  (`src/app/api/communities/[id]/scope-proposals/[proposalId]/route.ts`):
  human `approved|rejected|rollback` + rationale (3–1000 chars) via
  transactional RPCs; split approval creates a private `pending_review`
  community (no copied memberships, no invites); version conflicts → 409
  `scope-changed` / `rollback-unavailable`.
- Client `src/components/moderation/scope-stewardship-panel.tsx` shows the
  transfer notice, excerpt form, pending/applied/rolled-back states.

### 4.8 Queue worker triage — `src/lib/db/moderation.ts`

- `triageEventText(excerpt, agent)`: Spark direct, `maxTokens: 700,
  temperature: 0`, schema `harmonise_queue_triage` (concern/severity/
  rationale/**uncertainty**), system prompt pinned to
  `POLICY_VERSION = "2026-11-02.1"` plus the community's public context
  (name ≤80, description ≤500, topics ≤8 chars-capped). Strict output
  validation; throws `invalid triage result` on schema/enum violations.
- `processNextEvent()`: claims oldest `queued` event (sets
  `processing`, `attempts+1`), requires an active helper row, triages,
  writes `triaged` with `{triage, helper:{id,display_name,kind:"ai"},
  triaged_at}`; on any error requeues or marks `dead` after
  `MAX_EVENT_ATTEMPTS = 5`. Invoked by `POST /api/moderation/process`
  (worker secret `x-worker-secret` or Vercel Cron `CRON_SECRET` bearer;
  one event per call; daily on Hobby via `vercel.json`).
- `GET /api/communities/[id]/agent` discloses the helper identity
  (display name, status, advisory-only disclosure) to active members/owner.

### 4.9 Facilitator — `src/lib/db/community.ts` + `/api/moderation/facilitate`

- `facilitateOldestUnansweredAsk(communityId)`: finds oldest visible
  `kind=ask` post older than 24 h with zero visible replies (falls back
  gracefully pre-`kind` migration), ensures a labelled AI membership
  (`ensureFacilitatorMembership`, display name = helper name), and calls
  **Spark direct** (`FACILITATOR_SYSTEM` + community name/description,
  `maxTokens: 300, temperature: 0.5`). Posts the reply as that membership.
- Route defaults to **503 unless `COMMUNITY_FACILITATOR_ENABLED=true`**;
  same worker-secret auth as the queue worker; scans approved communities
  in turn (or `?community=`), one facilitation per call; daily Hobby cron
  entry exists in `vercel.json`.

## 5. Auth, account, and private sessions

### 5.1 Auth — `src/lib/auth-server.ts`, `src/lib/db/supabase.ts`

- Supabase Auth (GoTrue) over `fetch`: `supabaseAuth()` posts to
  `/auth/v1…` with the anon key; `setAuthCookies()` sets HttpOnly
  `sb-access` (1 h) + `sb-refresh` (30 d), `SameSite=Lax`, Secure in
  production. `validEmail()` gates OTP requests.
- `getAuthUser(request)`: reads `Authorization: Bearer` or `sb-access`
  cookie, validates against `GET /auth/v1/user` (10 s timeout). Never
  trusts client-supplied ids. Routes: `/api/auth/{otp,verify,refresh,
  signout,me,config}` (config reports `databaseEnabled` for degraded UI).
- Client sign-in UI: `src/components/connect/onboarding.tsx` (email →
  code → verify; requires 18+ and Meta-transfer confirmations) and
  `src/components/account/auth-card.tsx`.

### 5.2 Private sessions — `src/lib/db/sessions.ts` + `/api/sessions/*`

- `private_sessions` (owner-only) + `session_messages` (role/text ≤4000)
  + `session_understanding` (one row/session: suggested vs **confirmed**
  themes, support need, need summary, correction count).
- Routes (`src/app/api/sessions/route.ts`,
  `src/app/api/sessions/[id]/route.ts`, `…/messages/route.ts`,
  `…/understanding/route.ts`): `GET/POST /api/sessions` (create 30/min/user,
  title ≤120), `GET/PATCH/DELETE /api/sessions/[id]` (full read incl.
  understanding, rename, delete with read-back confirmation),
  `POST …/messages` (60/min/user, 12 KB, role/text ≤4000),
  `PUT …/understanding` (60/min/user, 8 KB, strict enum validation via
  `validUnderstandingInput`). All owner-scoped; non-owner → 404.
- Browser sync `src/lib/session-sync.ts`: no-ops when DB unconfigured or
  signed out; lazily creates a session from the first user turn, appends
  unsent turns incrementally, upserts understanding; sync failures never
  interrupt chat. Resume/delete UI in
  `src/components/account/session-panel.tsx`.
- Account (`src/app/api/account/*/route.ts`): `GET …/export` returns
  sessions/messages/understanding/consents/memberships/posts/replies/
  reports JSON (`exportAccount`); `GET …/contributions` returns the
  member's private per-community contributions (`getMyContributions`,
  30/min); `GET …/notifications` returns 7-day reply/decision/appeal
  items (`getAccountNotifications`, 30/min); `POST …/delete` (3/min)
  requires typed `confirm: "delete my data"`, hard-deletes profile data
  with post-delete read-back (`deleteAccount`), and clears auth cookies.

## 6. Community lifecycle — `src/lib/db/community.ts` + `/api/communities/*`

### 6.1 Directory and visibility

- `GET /api/communities` (`src/app/api/communities/route.ts`): approved
  communities for everyone + own `pending_review` for owners; returns
  `publicCommunity()` (strips `created_by/reviewed_*`/`coverage_*`) with
  live member/post/recent-post counts. `GET /api/communities/[id]`
  hides non-approved communities as 404 except to owner (pending) or
  members/owner (archived).
- `validCommunityId`: `^[a-z0-9-]{3,48}$`. Seeded directory
  (`supabase/seed.sql`): `rebuilding`, `legal-clarity`, `steady-ground`
  (all `approved`, `member` visibility).
- Deterministic relevance only: `overlappingThemes()` in
  `src/lib/community-topics.ts` (fixed theme map, overlap labels — never
  scores). `/app` discovery links `/communities?themes=` with confirmed
  themes; `CircleRecommendation` in `harmonise-experience.tsx` ranks by
  overlap. No model-driven ranking of live communities (explicitly a
  future opportunity in the audit).

### 6.2 Proposals and launch review

- `POST /api/communities`: auth + 3/min/user + 8 KB; sanitizes name
  (3–80), description (20–500), topics (≤8, 2–36 chars), optional
  host-reviewed `scopeDraft`; `createPendingCommunity()` calls
  `rpc/create_pending_community[_with_scope]` (single service-role
  transaction: community + host membership; DB trigger provisions the
  helper row). Id slug + 8 random hex chars. Returns 201 with community
  + helper disclosure.
- `GET /api/communities/review`: allowlisted reviewers only
  (`COMMUNITY_REVIEWER_USER_IDS`), proposal-safe projection (no owner
  ids). `POST /api/communities/[id]/review`
  (`src/app/api/communities/[id]/review/route.ts`, 10/min): approve
  requires `{coverageConfirmed: true}` (else
  `coverage-confirmation-required`); decline requires
  `{decision: "declined", message}` (≤1000 chars) and records
  `review_note` for the proposer. Client
  `community-proposal-review-queue.tsx` gates approval behind a
  named-human-coverage checkbox and hides entirely for non-reviewers.
  Production leaves the reviewer list unset until a real reviewer is
  confirmed (`docs/project-knowledge/ARCHITECTURE.md`).
- `PATCH /api/communities/[id]`: moderator-only archive/revive
  (`setCommunityArchived`); archived communities reject new posts/replies.

### 6.3 Membership, posts, replies, reactions, blocks

- Join/leave/membership (`…/join`, `…/leave`, `…/membership` routes):
  `POST …/join` (10/min) with alias 2–40 chars; blocked stays blocked
  (403), rejoin reactivates; `POST …/leave` sets `left`;
  `GET …/membership` returns the caller's row or `{membership: null}`.
- Posts/replies (`…/posts`, `…/posts/[postId]/replies` routes):
  `createPost`/`createReply` require consent version exactly
  `CONSENT_VERSION` (`2026-11-02.1`, else 409 `stale-consent`); crisis
  match → `200 {crisis:true}` (no write); archived → 403; then
  `consent_records` (SHA-256 of exact text) + post/reply write; every
  post best-effort enqueues a `live-flag` moderation event (queue
  failure never loses the post). Bodies ≤4000/≤2000 chars; post
  `kind ∈ share|ask` (20/min posts, 30/min replies).
- Reads: `listPosts`/`listReplies` (≤50/≤100, member-block filtered,
  moderators see held/removed; authors see own non-visible posts),
  `…/posts?since=` for since-last-visit counts. Authors delete own posts
  (`DELETE …/posts/[postId]`, read-back confirmed); status changes are
  moderator-only (`setPostStatus`/`setReplyStatus`).
- Reports (`POST …/reports`, 10/min): exactly one of `{postId, replyId}`
  + reason; open-report cap 200/community (`community-busy` → 429);
  enqueues a `report` event; returns only `{id, status}`.
- Reactions (`…/posts/[postId]/reactions`, GET summary / POST toggle
  `helpful`, 60/min each): `{count, reacted}`; 503-degraded
  pre-engagement-migration.
- Featuring (`…/featured`: GET list / POST opt-in / DELETE `?postId=`
  opt-out): author-only via `feature` consent rows; `listFeaturedPosts`
  surfaces ≤5 for shared journeys.
- Blocks (`…/blocks`: GET aliases / POST `{alias}` / DELETE `?alias=`):
  alias-based member blocks filter reads; cannot block self (403);
  unknown alias → 404 `no-such-member`.
- Promotions (`GET|POST …/promotions`, `POST …/promotions/[requestId]`):
  member requests `volunteer|verified-supporter` with note ≤1000
  (one open each, else 409); moderators see open queue and
  approve/decline with required rationale; approval writes
  `community_member_verifications`.
- Verification (`POST|DELETE …/verification`): moderator-only, 404
  `disabled` unless `COMMUNITY_ROLE_VERIFICATION_ENABLED=true`; sets or
  clears a `role_label` (2–64 chars); self-verification rejected.
- Progress (`GET …/progress`, 60/min, active members only,
  `Cache-Control: private, no-store`): `getCommunityProgressSummary()`
  via `rpc/community_member_contribution_summary` — levels `new-member` /
  `contributor` (3 contributions, 2 UTC days) / `community-regular`
  (10, 5 days); dedupe + ≥20-char + visible-only rules per decisions.

## 7. Moderation pipeline — `src/lib/db/moderation.ts` + `/api/moderation/*`

### 7.1 Event flow and state machine

```text
createPost → live-flag event ─┐
createReport → report event ──┤→ moderation_events (queued)
                              │→ processNextEvent: queued → processing → triaged
                              │   (failure: requeue; ≥5 attempts → dead)
                              └→ reviewer queue → human decision → optional appeal
```

- `enqueueModerationEvent()`: idempotency keys `report:<id>` /
  `live-post:<id>` with `resolution=ignore-duplicates`; payload carries
  `policy_version`, target ids, 500-char excerpt.
- `getQueue(communityId)`: open/appealed reports + target post/reply +
  reporter alias + latest triage suggestion (concern/severity/rationale/
  uncertainty/policy/helper attribution) + decisions + appeals.
- `getLiveFlags()`: recent triaged live-flags with `review`/`urgent`
  severity only (served by `GET /api/moderation/flags`).
- `recordDecision()`: moderator-only; snapshots model
  concern/severity/rationale beside the human `decision ∈
  no-action/request-revision/remove/escalate` + rationale + policy
  version; sets report `decided`; maps content status
  (remove→removed, no-action→visible, else held). Closed reports → 409.
- Appeals: `fileAppeal()` (author-only, one open per decision) →
  report `appealed`; `decideAppeal()` (moderator, different reviewer
  when staffing allows, else `same-reviewer` 409) → `upheld|overturned`;
  overturn restores `visible`; report → `closed`.
- Metrics (`getMetrics`, moderator-only `GET /api/moderation/metrics?
  community=`): report counts, decisions by kind, suggestions by
  severity, appeal counts, overturn rate. Decision log (`getDecisionLog`,
  moderator-only `GET /api/moderation/decisions?community=`):
  audit entries with reviewer alias + appeal status.
- Supporting routes: `GET /api/moderation/assignments` (caller's active
  moderator memberships + community names), `GET …/flags?community=`
  (moderator-only live flags), `GET …/my-decisions?community=` (member's
  own report outcomes for appeal entry points, 60/min),
  `POST /api/moderation/appeal` (author files appeal, 10/min),
  `POST /api/moderation/appeals/[id]/decide` (`upheld|overturned`;
  `same-reviewer` → 403).

### 7.2 Reviewer UI — `src/components/moderation/*`, `/moderation`

- `reviewer-queue.tsx`: assignment picker, queue + metrics + live flags,
  30 s visible-tab refresh; reviewer-duty banner (staffed hours,
  no monitoring, helpline link); per-report card with reason, target,
  advisory AI suggestion panel (concern/severity/uncertainty/policy/
  helper attribution + rationale), decision history, inline appeals, and
  four decision buttons with required-except-no-action rationale;
  embedded `ScopeStewardshipPanel`; audit-trail link.
- `/moderation/decisions` (`src/app/moderation/decisions/page.tsx`):
  per-community audit list (decision, appeal status, reviewer alias,
  report reason, rationale) + CSV export for pilot review
  (`quoteCsvCell` from `src/lib/csv`).
- `community-proposal-review-queue.tsx`: allowlisted launch review with
  coverage attestation. `promotion-queue.tsx`: per-assignment open
  role-request decisions with rationale shown to the member.
- Page copy is explicit: *"AI suggestions advise; only people decide."*

## 8. Data model and authorization

### 8.1 Tables (Postgres, additive migrations)

Core (`0001_harmonise_core.sql`): `profiles`, `private_sessions`,
`session_messages`, `session_understanding`, `communities`, `memberships`,
`consent_records`, `posts`, `post_replies`, `reports`, `moderation_events`,
`moderation_decisions`, `appeals`. Follow-ups: `0002_member_blocks`;
`20261102183254_community_progress` (contribution RPC);
`20261102183300_community_lifecycle` (topics, `launch_status`,
`created_by/reviewed_*`, `coverage_confirmed_at`,
`community_moderator_agents` + provisioning trigger + create/review RPCs);
`20261102185148` topic backfill; `20261102195744/…748` scope stewardship +
split proposals (`scope_package`, `scope_version`,
`community_scope_changes` + review/rollback/split RPCs);
`20261102204240_community_engagement` (post `kind`, reactions, featuring,
promotions, verifications); `20261102204243_community_review_note`.
Later-migration details beyond the lifecycle file were not re-read for
this document — the `CommunityRow`/`CommunityAgentRow`/
`CommunityScopeChangeRow` shapes in `src/lib/db/types.ts` mirror them.

### 8.2 Authorization posture

- Server code is authoritative: `getAuthUser()` + explicit owner,
  membership-status, moderator-role, and launch-status checks on every
  route; `moderatorMemberships()`/`isCommunityModerator()` gate all
  reviewer paths.
- RLS enabled on all core tables as defense in depth: owner-only private
  rows, visibility-aware post reads, reporter/moderator report reads,
  server-only moderation events. Service role bypasses RLS; anon key is
  Auth-only. No `NEXT_PUBLIC_` secrets exist.

## 9. Clients

- `/app` — `src/components/harmonise-experience.tsx` (+
  `src/lib/harmonise.ts` reducer, 15 screens): chat via `/api/chat`
  (crisis → help screen, model text preserved on failure), theme/need
  confirmation, voice record→review→transcribe→editable composer,
  fictional discovery with `SYNC_CHAT_CONTEXT`, sample→real handoff,
  saved-session resume, triage demo in the fictional moderation screen.
  `GET /api/ready` drives the "Live Meta AI chat" header state.
  Local deterministic replies (`src/lib/conversation.ts`) and fixtures
  (`src/lib/harmonise-content.json`) back the fictional paths.
- `/connect` — `src/components/connect/*` + `src/lib/connect/session.tsx`
  reducer: OTP onboarding with 18+/Meta-transfer gates
  (`onboarding.tsx`), `adviser.tsx` (live `/api/advice`, client crisis
  screen, consent-gated match reveal, AI disclaimer, per-message Meta
  notice), `community-cards.tsx` (match cards with live counts, why-fit
  reason, join-as-alias, preview), `circles.tsx` (per-circle live feed:
  membership, posts, composer with consent version, helpful reactions,
  crisis notice), `coaches.tsx` (`fetchSupporterData`:
  contributions + promotion states per community).
- `/communities` — `real-community-list.tsx` (directory with counts,
  pending/visibility badges, `?themes=` overlap lines, truthful
  loading/unavailable/error/empty states), `real-community-detail.tsx`:
  join-with-alias / leave / archive-revive, `ConsentComposer`
  (draft → review-exact-text-and-audience → confirm checkbox → post),
  share/ask intent, `PostCard` (replies, report, two-tap block, delete
  own, helpful, feature, appeal), 15 s visible-tab poll with
  pending-posts pill + Refresh + since-last-visit counts, featured
  journeys, blocked-alias list; active members also see
  `community-helper-card.tsx` (helper disclosure + limits),
  `community-guide.tsx` (model §4.6), `community-progress-card.tsx`
  (level, next thresholds, verification, counting rules);
  `community-proposal-form.tsx` (setup copilot §4.4: "Draft with Meta"
  transfer notice, editable scope fields, fit verdict, host review
  checkbox → `scopeDraft` submit → pending-review receipt).
- `/profile` (`src/app/profile/page.tsx`): private notifications (7-day,
  unread counts via localStorage seen-marker), circles with alias/level/
  post/reply/thanks counts, volunteer/verified-supporter request flows,
  and the standing ladder (activity rungs automatic; Trusted+ human
  reviewed).
- `/moderation`, `/ops`, account — §7.2, §3.3,
  `session-panel.tsx` (saved-session list, resume/rename/delete, export
  download, typed-confirm account delete with receipt) /
  `auth-card.tsx` (email-code sign-in with resend cooldown).
- Homepage `src/components/harmonize-homepage.tsx`: static visual source
  of truth — palette, serif/scale type, rounded controls, soft shadows,
  restrained reduced-motion-aware motion (`AGENTS.md`). *Component
  internals unverified (not re-read for this document).* The file
  `public/harmonize-motion-revival.html` is present (contents unverified).

## 10. Workers, scheduling, and probes

| Probe / worker | Code | Behavior |
|---|---|---|
| `GET /api/health` | `src/app/api/health/route.ts` | Public liveness: booleans for DB configured, model configured, kill switch |
| `GET /api/ready` | `src/app/api/ready/route.ts` | Readiness: servable with/without DB; reports DB reachability + model configured |
| `GET /api/ops/metrics` | `src/app/api/ops/metrics/route.ts` | Secret-gated ops summary: route metrics + queue depth + oldest-queued age + signup→join→post funnel |
| Queue worker | `src/app/api/moderation/process/route.ts` | One `processNextEvent()` per call; worker-secret or cron auth |
| Facilitator worker | `src/app/api/moderation/facilitate/route.ts` | Disabled by default; one facilitation per call |
| Cron | `vercel.json` | Daily `process` (05:00) + `facilitate` (09:00); one item per run on Hobby |

## 11. Evaluation and tests

- **Live-model eval** (`scripts/meta-eval.mjs`, `evals/meta-eval/v1/`):
  budgeted runner over 17 synthetic cases (`cases.json`,
  `model: muse-spark-1.3`): chat/adversarial, advice, triage. Refusal-aware
  `forbids` checks, theme-subset, support-need, severity checks; hard
  `--max-calls`/`--max-tokens` caps; metadata-only stdout + report;
  transcripts to gitignored local files. Recorded keyed run: 17/17,
  p50 2361 ms, p95 4846 ms (~10k tokens/17 calls per
  `docs/META_INTEGRATION_PLAN.md`).
- **Keyed browser spec** (`tests/ai-live.spec.ts`): 4 provider calls,
  desktop-only, skips without `MODEL_API_KEY`; asserts shapes/enums only,
  never prints prompts/completions. Voice case posts generated WAV silence.
- **Deterministic E2E** (`tests/playwright.config.ts`, read): desktop +
  mobile projects against the local dev server. Spec files present in
  `tests/` (filenames observed; contents not re-read except `ai-live`):
  `community-creation-journey`, `community`, `connect-circles`,
  `connect-journey`, `connect`, `demo-journey`, `design-system`,
  `homepage`, `live-journeys`, `moderation`, `new-surfaces`,
  `product-flow`, `sessions` (+ `live-users.ts` helper). Routine runs
  stay stubbed with zero Meta spend per `evals/meta-eval/v1/README.md`.
- **Unit** (`vitest`): `src/lib/conversation.test.ts`, `csv.test.ts`,
  `harmonise.test.ts` are present (contents unverified). Project convention
  (`AGENTS.md` plus a standing no-unit-tests instruction) forbids unit tests;
  high-level browser end-to-end tests are the sanctioned suite.

## 12. Environment

Server-only secrets (never `NEXT_PUBLIC_`): `MODEL_API_KEY`,
`META_TEXT_MODEL` (default `muse-spark-1.3`), `META_SETUP_MODEL`,
`META_WONDER_ROUTES`, `SUPABASE_URL/ANON_KEY/SERVICE_ROLE_KEY`,
`UPSTASH_REDIS_REST_URL/TOKEN`, `MODERATION_WORKER_SECRET`, `CRON_SECRET`,
`COMMUNITY_REVIEWER_USER_IDS`, `OPS_METRICS_SECRET`,
`HARMONISE_KILL_SWITCH`, `DAILY_MODEL_CALLS_PER_USER`,
`COMMUNITY_FACILITATOR_ENABLED`, `COMMUNITY_ROLE_VERIFICATION_ENABLED`
(`.env.example`). `.env.local` is gitignored.

## 13. Failure matrix (model paths)

| Failure | Detection | User-visible result |
|---|---|---|
| Kill switch on | `isKillSwitchOn()` | 503 `unavailable`, no Meta call, `killSwitchDrops+1` |
| Over quota / rate limit | `ops-limits` / limiter | 429, text preserved for retry |
| Missing/invalid key or model | `MetaModelError` | 503/502 `unavailable`, `errorKind` logged + header |
| Provider 429 | adapter | 503 surfaced, **no Wonder→Spark retry** |
| Provider 5xx / timeout / network | adapter (30 s chat, 45 s voice) | 502/503 `unavailable`, text preserved |
| Malformed/invalid model JSON | per-route validators | 502 `unavailable`, `bad-response` |
| Crisis match | `detectCrisis()` | Safety UI/resources, no model call (guide/triage use fixed messages) |
| DB down / unconfigured | `isDatabaseConfigured` + REST errors | 503 `unavailable`; `/app` chat still works key-only |
| Queue worker item fails | `processNextEvent` catch | Requeue; `dead` after 5 attempts; ops shows depth/age |
| Facilitator model fails | `facilitateOldestUnansweredAsk` catch | `facilitated:false, reason:unavailable`, no post written |

## 14. File index (cited sources — all read)

- `src/lib/meta-model.ts` — adapter, routing, limiter
- `src/app/api/chat/route.ts`, `src/app/api/advice/route.ts` — chat, adviser
- `src/app/api/voice/transcribe/route.ts` — voice
- `src/app/api/moderation/{triage,process,facilitate,queue,decide,
  assignments,metrics,flags,my-decisions,appeal,decisions}/route.ts`,
  `src/app/api/moderation/appeals/[id]/decide/route.ts`,
  `src/lib/db/moderation.ts` — triage pipeline, queue, appeals
- `src/app/api/communities/propose/assist/route.ts`,
  `src/app/api/communities/[id]/{guide,scope-proposals/**,agent,
  review,join,leave,membership,posts,reports,progress,blocks,
  featured,promotions/**,verification,posts/[postId]/**}/route.ts`,
  `src/lib/db/community.ts` — setup copilot, guide, scope, facilitator,
  membership, content, engagement
- `src/app/api/communities/{route,review}/route.ts`,
  `src/app/api/communities/[id]/route.ts` — directory, proposals, launch
- `src/app/api/sessions/{route,[id]/route,[id]/messages/route,
  [id]/understanding/route}.ts`, `src/lib/db/sessions.ts`,
  `src/app/api/account/{export,delete,contributions,notifications}/
  route.ts` — sessions, account
- `src/app/api/{health,ready,ops/metrics}/route.ts`, `src/lib/api-guard.ts`,
  `src/lib/{ops-limits,ops-metrics,rate-limit-upstash}.ts`,
  `src/instrumentation.ts` — guards, ops, probes
- `src/lib/connect/catalog.ts`, `src/lib/connect/advice.ts`,
  `src/lib/connect/session.tsx`, `src/lib/{consent,community-topics,
  community-progress,session-sync,conversation,harmonise}.ts` —
  domain libs
- `src/lib/db/{supabase,types}.ts`, `src/lib/auth-server.ts` —
  data + auth plumbing
- `src/components/harmonise-experience.tsx`, `src/components/
  product-route.tsx`, `src/components/connect/{adviser,onboarding,
  circles,coaches,community-cards}.tsx`, `src/components/community/
  {real-community-list,real-community-detail,community-guide,
  community-helper-card,community-progress-card,community-proposal-
  form}.tsx`, `src/components/moderation/{reviewer-queue,
  community-proposal-review-queue,promotion-queue,
  scope-stewardship-panel}.tsx`, `src/components/account/{auth-card,
  session-panel}.tsx` — UI components
- `src/app/{page,layout}.tsx`, `src/app/app/page.tsx`,
  `src/app/connect/{page,member/page}.tsx`, `src/app/communities/
  {page,[id]/page,propose/page}.tsx`, `src/app/moderation/{page,
  decisions/page}.tsx`, `src/app/{ops,profile}/page.tsx` — pages
- `supabase/migrations/0001_harmonise_core.sql`,
  `supabase/migrations/20261102183300_community_lifecycle.sql`,
  `supabase/seed.sql` — schema + seed
- `scripts/meta-eval.mjs`, `evals/meta-eval/v1/{cases.json,README.md}`,
  `tests/{ai-live.spec.ts,playwright.config.ts}` — eval + tests
- `docs/{META_INTEGRATION_PLAN,META_MODELS_AND_JOURNEY_AUDIT,
  DATA_PRIVACY_DESIGN,MODERATION_POLICY,END_TO_END_JOURNEY_AND_GAPS}.md`,
  `docs/project-knowledge/{ARCHITECTURE,DECISIONS}.md` — design record
- `package.json`, `next.config.ts`, `vercel.json`, `README.md`,
  `.env.example`, `AGENTS.md` — platform config

