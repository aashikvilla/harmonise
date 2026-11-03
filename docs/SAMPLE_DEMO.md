# Harmonise — Sample Demo Guide

A click-by-click demo you can run against the live pilot. Everything below uses
real accounts, the real database, and the real Meta model — there is no demo
mode left in the product.

App (local): `http://127.0.0.1:3000` · start with
`npx next dev --hostname 127.0.0.1 --port 3000`

---

## 1. Credentials — what to use

There are **no passwords in the product**. Everyone signs in with an email code.

| Demo path | Use | Why |
| --- | --- | --- |
| Member journey | **Your own real email** | A 6-digit code arrives in your inbox (Supabase OTP). This is the real product flow. |
| Reviewer / moderator journey | Seeded staff accounts (below) | Two seeded moderators are already registered as the pilot's reviewers and as moderators of Finding steady ground. |
| API / automation checks | `node scripts/seed-test-users.mjs` | Mints fresh test users and writes session tokens to `C:\tmp\test_jwts.json`. |

Seeded test accounts (created in Supabase Auth by the seed script; each reseed
creates a fresh batch, old ones remain):

- `harmonise-test-a-*@example.com`, `-b-`, `-am-`, `-bm-` — regular members.
- `harmonise-test-mod-*@example.com`, `-modm-` — moderators of Finding steady
  ground **and** the two allowlisted community reviewers
  (`COMMUNITY_REVIEWER_USER_IDS`).

The `*@example.com` inboxes cannot receive mail, so staff accounts cannot use
the email-code form. To click through as staff in a browser today:

1. Run `node scripts/seed-test-users.mjs`.
2. Open the app, then in DevTools → Application → Cookies set
   `sb-access` = the `modm` token from `C:\tmp\test_jwts.json`, reload.

To make **your own** account a reviewer instead: sign in once with your email,
then copy your user ID from Supabase → Authentication → Users and add it to
`COMMUNITY_REVIEWER_USER_IDS` (comma-separated), restart/redeploy.

---

## 2. Demo A — existing community (member journey)

1. Open `/connect` → Member sign-in → enter your email, tick both boxes,
   **Email me a code**, enter the code. You land in your member space.
2. In **Find connection** (the adviser), paste:

   > My family keeps pressuring me about a relationship decision and it is
   > disrupting my routine. I feel anxious and want a calmer way to think.

3. Read the reflection and steps. Choose **"I've read this — show relevant
   communities"**. A match card appears for **Finding steady ground** with real
   counts (50+ members, live post count). The adviser only suggests circles
   that exist in the database right now.
4. Click **Join as alias "…"**, then **Open in My circles**. You see the real
   feed. React with **This helped me** on someone's post, then ask your own
   question with the composer (Share / Ask a question → review → post).
5. Safety path (optional): send `I want to die` to the adviser. The urgent
   support modal opens; no advice or matching is produced.

What this creates: a real membership, a real post, and real reaction rows in
Supabase. Nothing is mocked.

## 3. Demo B — new community (creator + reviewer journey)

1. As a member, open `/communities` → **Suggest a community**
   (`/communities/propose`).
2. Fill in: name `Evening reset walks`, purpose
   *"A gentle circle for people who want a short evening walk routine after
   difficult family days, sharing what helped and what did not."*, topics
   `walking, evening routines, family stress`.
3. Click **Draft with Meta**. The setup copilot drafts description, topics,
   norms, welcome message, starter prompts, and tells you whether an existing
   circle already fits. Edit anything, then submit. Status: `pending_review`.
4. As staff (seeded `modm`, cookie method above), open `/moderation` → the
   proposal appears in the launch-review queue. **Approve** (coverage
   confirmation required) or **Decline** with a kind note — the proposer sees
   the decision and the note on their proposal.
5. On approval, three things happen automatically:
   - the circle appears in `/communities` and members can join;
   - the approving reviewer becomes its first moderator;
   - **an AI community helper is provisioned for it** (next section).

What this creates: a real community row, a moderator membership, and a helper
agent row — no manual agent setup.

## 4. Demo C — moderation and the facilitator

1. As a member, **Report** any post in a circle.
2. As staff, open `/moderation`: the report is in the queue with an advisory AI
   suggestion. Only a human decides (allow / remove). The author can appeal;
   the appeal goes to a **different** reviewer. Every outcome lands in
   `/moderation/decisions` (audit trail, CSV export included).
3. Facilitator: ask a question in a circle and leave it unanswered. After 24
   hours with no human reply, the daily facilitator (cron 09:00 UTC, or
   `POST /api/moderation/facilitate?community=<id>` with the cron/worker
   secret) posts a short, clearly-labelled **Guide · AI** answer. One question
   is already planted in Finding steady ground ("How did you keep a small
   morning routine…") and becomes eligible a day after it was posted.

---

## 5. Your agent questions, answered from the code

**Did we create agents that create a community and moderate them?**
Two different things exist:

- **Setup copilot (creates the draft, not the community):** on the propose
  form, Meta drafts the proposal and checks fit against live circles. A human
  submits; a human reviewer approves. (`/api/communities/propose/assist`)
- **AI community helper (one per community):** offers advisory safety triage
  to human moderators and writes labelled facilitator replies. It **cannot**
  moderate: it takes no actions, hides nothing, and every decision is a
  human's, with appeal to a second human.
  (`community_moderator_agents`, `/api/communities/[id]/agent`)

**Can agents be created on the fly?**
Yes — a Postgres trigger (`communities_provision_moderator_agent`) creates the
helper the moment a community is inserted or renamed, backfilled for all
existing circles, named `harmonize. <Circle> AI community helper`. Its
facilitator membership is also created lazily on first facilitation. No code
deploy or manual step per community.

**Did we use Meta's Wonder API for the orchestrator?**
The app calls the **Meta Model API** (`https://api.meta.ai/v1`) with
`muse-spark-1.3` for the adviser, private chat, moderation triage, the
facilitator, and the setup copilot. There is no separate orchestrator service —
orchestration is the Next.js route layer. `muse-wonder-1.0` on the same API is
now the **primary model for the two advisory paths** — the adviser and the
setup copilot — with automatic Spark fallback on transport errors *and* on
output that fails strict validation (`META_WONDER_ROUTES`, default
`setup,advice`; `x-meta-model` shows which model answered, `x-meta-error-kind`
names failures). Chat, the facilitator, and moderation triage stay on Spark:
triage is safety-adjacent, and the others keep the proven baseline. The
strict output validators accept either model.

---

## 6. What is enabled (and the one switch that stays off)

Enabled locally and verified end-to-end: reactions, featuring, promotions
(volunteer / verified-supporter with human decisions), archive/revive,
community review with notes, role verification in progress levels, the
facilitator, both crons (`/api/moderation/process` 05:00 UTC,
`/api/moderation/facilitate` 09:00 UTC in `vercel.json`).

Deliberately left unset: `HARMONISE_KILL_SWITCH` (only `=1` halts model
routes — absent means the app runs). Rate limiting uses an in-memory store
until Upstash is configured.

### Deployment variables (Vercel → Project → Environment Variables)

Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`MODEL_API_KEY`, `MODERATION_WORKER_SECRET`, `CRON_SECRET`,
`OPS_METRICS_SECRET`, `COMMUNITY_REVIEWER_USER_IDS`,
`COMMUNITY_FACILITATOR_ENABLED=true`, `COMMUNITY_ROLE_VERIFICATION_ENABLED=true`.

Recommended: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (shared
rate limits), `META_TEXT_MODEL=muse-spark-1.3`,
`DAILY_MODEL_CALLS_PER_USER=100`.

Optional in production: `META_WONDER_ROUTES` (defaults to `setup,advice`;
set empty to run everything on Spark). Leave `HARMONISE_KILL_SWITCH` unset
(emergency only).

Note: cron frequency is plan-dependent on Vercel (Hobby allows daily). Moving
`/api/moderation/process` to every-5-minutes needs a Pro plan.
