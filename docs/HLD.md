# Harmonise — High-Level Design (HLD)

**Audience:** hackathon jury. **Scope:** what the system is, who it serves,
how it is structured, and where Meta AI models are used and why.
Every claim below is grounded in repository code or design docs; anything else
is marked *unverified*.

## 1. The problem and the product

People facing difficult life moments — family pressure, separation, relocation,
work stress — often need to think things through **privately** before deciding
whether to share anything with anyone. Harmonise is a private-first peer
reflection space:

1. **Talk privately** with an AI conversation guide (`/app`) or adviser
   (`/connect`), including voice input.
2. **Review a tentative understanding** — suggested themes and support
   preference that the user can correct, reject, or confirm.
3. **Explore communities** — first fictional samples, then live
   Supabase-backed communities with real memberships and posts.
4. **Choose what to share** — join with a per-community alias, post with
   exact-text/audience consent, report, block, leave, or delete.
5. **Human-reviewed safety** — AI triage only *suggests*; authorized human
   moderators decide, with appeals and an audit trail.

The product promise, enforced in code: **private narrative is never copied to
a community surface without a separate confirmation, and model output never
takes a moderation action** (`docs/DATA_PRIVACY_DESIGN.md`,
`docs/project-knowledge/ARCHITECTURE.md`).

## 2. Who it serves and the core journeys

| Journey | Route | Live or demo |
|---|---|---|
| Marketing homepage (visual source of truth) | `/` (`src/app/page.tsx`) | Live UI, static content |
| Private chat + voice + understanding + sample discovery + saved sessions | `/app` (`src/app/app/page.tsx`, `src/components/harmonise-experience.tsx`) | Live Meta chat/voice; sample communities fictional |
| Adviser + circles + coaches demo | `/connect` (`src/app/connect/page.tsx`, `src/components/connect/*`) | Live Meta adviser; membership local session state |
| Real community directory, proposals, membership, posts, replies, reports | `/communities`, `/communities/[id]`, `/communities/propose` | Live, Supabase-backed |
| Human reviewer queues (reports, proposals, promotions, scope) | `/moderation` | Live, Supabase-backed |
| Pilot ops dashboard (metadata only) | `/ops` | Live, secret-gated |

The end-to-end story the jury can follow: land → talk (Spark) → confirm
understanding → browse live communities → join with alias → post with consent
→ report routes to a human with an AI suggestion beside it → appeal if needed.
See `docs/END_TO_END_JOURNEY_AND_GAPS.md` for the seven-act telling
(Land, Talk, Understand, Match, Join, Belong, Grow).

## 3. System context

```text
                    ┌───────────────────────────────┐
                    │  Browser (Next.js App Router) │
                    │  /  /app  /connect            │
                    │  /communities  /moderation    │
                    │  /ops  /profile               │
                    └───────┬───────────────┬───────┘
                            │               │  service-role REST (server only)
                    ┌───────▼───────┐ ┌─────▼─────────────────┐
                    │ Meta Model API │ │ Supabase Postgres     │
                    │ (server-side   │ │ + Auth (OTP email)    │
                    │  calls only)   │ │ sessions, memberships,│
                    │ Chat Completions│ │ posts, reports, queue,│
                    │ ASR transcribe │ │ decisions, appeals    │
                    └───────────────┘ └───────────────────────┘
```

Key architectural facts:

- **Next.js 16 App Router, Node server mode** (`next.config.ts`,
  `package.json`). No static export: model routes need a Node runtime.
- **The browser never holds a Meta or Supabase service key.** All Meta calls
  happen in `src/app/api/**/route.ts` via `src/lib/meta-model.ts`; all
  database access goes through server-only `supabaseRest()` in
  `src/lib/db/supabase.ts` (`README.md`, `docs/DATA_PRIVACY_DESIGN.md`).
- **Auth:** Supabase Auth email-code (OTP) with HttpOnly session cookies
  (`src/lib/auth-server.ts`). Every protected route validates the JWT with
  `getAuthUser()` and applies owner/community checks in code; Postgres RLS
  mirrors them as defense in depth (`supabase/migrations/0001_harmonise_core.sql`).
- **Background work:** Vercel Cron invokes two workers daily on Hobby —
  `/api/moderation/process` (triage one queued event) and
  `/api/moderation/facilitate` (answer one unanswered question) — each
  handling one item per run (`vercel.json`, route sources). This is
  explicitly **not** continuous moderation.
- **Rate limiting:** process-memory limiter by default, optional shared
  Upstash Redis backend (`src/lib/rate-limit-upstash.ts`,
  `src/instrumentation.ts`), plus per-user daily model quotas and a global
  kill switch (`src/lib/ops-limits.ts`).

## 4. Meta AI usage — the jury map (where each model is used and why)

Three Meta model lines are integrated. All calls are server-side, all text
calls use structured JSON schemas that are validated before reaching the UI,
and every transfer point carries a point-of-use disclosure.

### 4.1 Muse Spark 1.3 Standard — the proven text model

`muse-spark-1.3` is `DEFAULT_TEXT_MODEL` and the `META_TEXT_MODEL` default in
`src/lib/meta-model.ts`. It is the default for everything and the automatic
fallback for the Wonder-routed surfaces.

| Surface | Route / code | What Spark does | Why Spark |
|---|---|---|---|
| Private chat | `POST /api/chat` → `src/app/api/chat/route.ts` | Short reply + tentative `suggestedThemes` + `supportNeed` + `needSummary` | Short, bounded, structured multi-turn reasoning at lower cost than Wonder (`docs/META_INTEGRATION_PLAN.md`) |
| Reported-post triage (user-triggered) | `POST /api/moderation/triage` → `src/app/api/moderation/triage/route.ts` | Concern / severity / rationale / recommended action | Deterministic-style classification with temperature 0; advisory only |
| Queued triage worker | `processNextEvent()` → `triageEventText()` in `src/lib/db/moderation.ts` | Same classification + uncertainty, scoped per community, attributed to that community's helper | Same model + policy version keeps queue and interactive triage consistent |
| Private community guide | `POST /api/communities/[id]/guide` → `src/app/api/communities/[id]/guide/route.ts` | Scope-grounded answers (`answer` / `out_of_scope`) from approved scope package + public details only | Small context, strict grounding, no post/chat reading |
| Scope stewardship | `POST /api/communities/[id]/scope-proposals` → `src/app/api/communities/[id]/scope-proposals/route.ts` | `clarify` / `expand` / `split` recommendation from one moderator-selected excerpt | Low-temperature (0.1) drafting; human approval required to apply |
| Community facilitator | `facilitateOldestUnansweredAsk()` in `src/lib/db/community.ts` via `/api/moderation/facilitate` | One warm reply to a 24h-unanswered `ask` post, as a labelled AI membership | Short peer-support text; disabled by default (`COMMUNITY_FACILITATOR_ENABLED`) |
| Fallback | `requestMetaChatRouted()` in `src/lib/meta-model.ts` | Automatic retry target when the Wonder-first call fails (except rate-limits) | Keeps advisory surfaces available |

Cross-cutting Spark choices (see `docs/project-knowledge/DECISIONS.md`):

- **Standard mode for sensitive narratives; never Contributor mode.**
- `reasoning_effort: "minimal"` and `max_completion_tokens` caps — the short
  flows need bounded completions, not long-horizon reasoning.
- **Temperature by risk:** 0 for triage, 0.1–0.2 for scope/setup, 0.5–0.7
  for conversational surfaces.
- No zero-retention/confidentiality promise is made about Meta; the UI states
  what is sent, when, and that Harmonise cannot erase provider-side copies.

### 4.2 Muse Wonder 1.0 — Wonder-first on two advisory surfaces, Spark fallback

`muse-wonder-1.0` (`WONDER_MODEL`) is tried **first** for the `setup` and
`advice` routes by default (`META_WONDER_ROUTES ?? "setup,advice"`), with one
automatic retry on Spark if the Wonder call fails **or its output fails
strict validation** (`requestValidatedWithFallback`) — except rate-limits,
which are not retried. Empty `META_WONDER_ROUTES` disables Wonder entirely.

| Surface | Code | What Wonder does | Why Wonder here |
|---|---|---|---|
| `/connect` adviser | `POST /api/advice` → `src/app/api/advice/route.ts` via `requestValidatedWithFallback("advice", …)` | Reflection + 2–4 steps + perspective + 0–2 circle matches from a server-supplied allowlist | Advisory long-form guidance; matches stay hidden until the user asks; Spark fallback preserves availability |
| Community setup copilot | `POST /api/communities/propose/assist` → `src/app/api/communities/propose/assist/route.ts` via `requestValidatedWithFallback("setup", …)` | Editable scope-package draft + fits-existing/distinct/human-review fit check against approved community metadata | Open-ended community-design drafting suits a stronger model; host must review before including; proposal still needs human launch review |

Boundaries (code-enforced):

- `META_SETUP_MODEL`, when set (pinned to `muse-spark-1.3` in
  `.env.example`), overrides the setup route model entirely.
- Safety-adjacent paths — triage, queue worker, guide, scope review,
  facilitator — call `requestMetaChatDetailed()` directly and **never route
  to Wonder** (`src/lib/meta-model.ts` comment: *"Safety-adjacent routes
  stay on the proven text model"*).
- Note for accuracy: `README.md` and the 2026-11-03 decisions/audit text
  describe Spark as the setup/adviser default; the code default as read
  routes those two surfaces to Wonder first with Spark fallback. The code
  is authoritative here.

### 4.3 Muse Voice Transcribe 1.0 — reviewed speech-to-text input

`muse-voice-transcribe-1.0` via `POST https://api.meta.ai/v1/asr/transcribe`
(`src/app/api/voice/transcribe/route.ts`): multipart upload of a reviewed
24 kHz mono PCM WAV (`PUSH_TO_TALK` mode), returning editable text. The
browser records locally, converts with `encodeMonoPcmWav()`, and only sends
on explicit transcribe; the transcript lands in the composer for editing and
is never auto-submitted (`src/components/harmonise-experience.tsx`).

Why this model: it is a dedicated transcription model for an input-only flow
— no speech synthesis, no live conversation, no realtime socket (realtime
was evaluated and deferred because it would break the review-before-transfer
promise; see `docs/META_MODELS_AND_JOURNEY_AUDIT.md`).

### 4.4 Deliberately not used

Per `docs/META_MODELS_AND_JOURNEY_AUDIT.md` and `docs/META_INTEGRATION_PLAN.md`:
no Muse Image, no SAM, no search grounding, no Files API, no tool calling,
no streaming chat — none serves a current product flow, and each would add
unrelated data-transfer and review questions. The audit's rule: add a model
only when it improves a specific user outcome with explicit transfer and
failure behavior.

## 5. Trust, consent, and safety design

- **Deterministic crisis screen first.** `detectCrisis()` in
  `src/lib/connect/catalog.ts` runs before any model call on client and
  server; matches route to safety information and never imply monitoring.
- **Exact-text consent.** Every post/reply writes a `consent_records` row:
  consent version (`2026-11-02.1`), audience, SHA-256 of the approved text,
  timestamp (`src/lib/consent.ts`, `createPost`/`createReply` in
  `src/lib/db/community.ts`).
- **Humans decide.** `POST /api/moderation/decide` requires a human reviewer;
  the model suggestion is stored *next to* the decision with the policy
  version (`2026-11-02.1`), never merged into it (`src/lib/db/moderation.ts`,
  `docs/MODERATION_POLICY.md`). Appeals get a second look; overturn rates are
  measured (`GET /api/moderation/metrics`).
- **Per-community AI helpers.** Each community has one
  `community_moderator_agents` row, provisioned by a database trigger, whose
  public purpose/topics scope advisory triage; the helper is disclosed in the
  UI and attributed in the queue (`supabase/migrations/20261102183300_community_lifecycle.sql`,
  `GET /api/communities/[id]/agent`).
- **Versioned scope governance.** Scope packages are versioned; AI drafts
  clarify/expand/split proposals, moderators approve/reject/roll back, and
  split acceptance creates only a private `pending_review` proposal —
  launch still needs an allowlisted reviewer plus coverage attestation.
- **Operational honesty.** `/api/health`, `/api/ready`, `/api/ops/metrics`
  and `/ops` report booleans, queue depth, latency, and token totals —
  never prompts, completions, keys, or identities (`src/lib/ops-metrics.ts`).

## 6. Evaluation and quality evidence

- **Budgeted live-model eval:** `scripts/meta-eval.mjs` +
  `evals/meta-eval/v1/cases.json` (17 synthetic cases: family pressure,
  work stress, relocation, uncertainty, quiet reading, correction,
  not-enough-context, adversarial diagnosis/legal/coercive/injection,
  adviser, triage). Metadata-only reports; transcripts stay local and
  gitignored. Last recorded keyed run: 17/17 pass
  (`docs/META_INTEGRATION_PLAN.md`).
- **Keyed browser spec:** `tests/ai-live.spec.ts` spends exactly 4 provider
  calls (chat, advice, triage, voice-silence) and skips without
  `MODEL_API_KEY`; ordinary `npm run test:e2e` stays fully stubbed.
- **Gates:** lint, typecheck, unit tests, production build, Playwright
  desktop + mobile (`README.md`, `tests/playwright.config.ts`).

## 7. Honest limits (what the jury should know)

- `/app` and `/connect` sample communities, members, and stories are
  **fictional** and labelled as such; only `/communities` and `/moderation`
  are live multi-user surfaces.
- The Hobby worker triages **one event per daily run**; human coverage is
  **not staffed** — the product never claims monitoring or emergency response.
- No realtime sockets or push notifications, no verified provider directory;
  polling (15 s visible-tab feed poll, 30 s queue refresh) plus manual
  Refresh, in-app 7-day notifications, and explicit empty/loading/error
  states instead.
- Deployment is *unverified* beyond code: Vercel Cron + protected server
  secrets are configured in `vercel.json`/docs, but no live production
  traffic was inspected for this document.

## 8. Repository map

- Product UI: `src/components/harmonise-experience.tsx` (`/app`),
  `src/components/connect/*` (`/connect`), `src/components/community/*`,
  `src/components/moderation/*`, `src/components/account/*`
- Model adapter: `src/lib/meta-model.ts`; guards: `src/lib/api-guard.ts`,
  `src/lib/ops-limits.ts`, `src/lib/ops-metrics.ts`
- Data access: `src/lib/db/{supabase,community,moderation,sessions}.ts`,
  types in `src/lib/db/types.ts`
- Schema: `supabase/migrations/*.sql`, `supabase/seed.sql`
- Design record: `docs/META_INTEGRATION_PLAN.md`,
  `docs/META_MODELS_AND_JOURNEY_AUDIT.md`, `docs/DATA_PRIVACY_DESIGN.md`,
  `docs/MODERATION_POLICY.md`, `docs/project-knowledge/{ARCHITECTURE,DECISIONS}.md`

See `docs/LLD.md` for the low-level design: route-by-route contracts,
schemas, state machines, and failure handling.
