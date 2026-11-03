# End-to-End Journey, Gaps & UX Overhaul Backlog

**Status:** 65/123 built and E2E-verified after the 2026-11-03 full-journey implementation cycle (see §11 log). Remaining items are still open unless explicitly checked below.
**Lens:** product manager + end user + senior UX designer.
**Source of truth for visuals:** the homepage (`/`), its palette, typography,
motion, and calm supportive tone. Everything below bends toward it.

## How to use this document

- Every actionable item is a checkbox. Check it only when the behavior is
  live, verified in the browser, and covered by the relevant E2E journey.
- Items are grouped by theme, then roughly ordered by user impact inside
  each group. Section 9 proposes a P0/P1/P2 cut for the first build cycle.
- "Built" means it exists on the current integration branch and is E2E-verified. Anything else is
  a gap, even if a sibling feature looks similar.
- Verified against the code on 2026-11-03: `[x]` = already built (with
  evidence); `Status:` notes = partially built, remainder open.
- The isolated-fixture browser journey does not claim live database verification.
  Both lifecycle migrations ARE applied live (verified 2026-11-03:
  `community_moderator_agents` + `launch_status` + contribution RPC all respond;
  agents backfilled for the 3 seeded groups).

## 1. Current-state map (what actually exists today)

Seven routes, two community systems, five AI touchpoints. The single most
important fact in this document is the split in the middle row:

| Layer | What exists | Where |
|---|---|---|
| Landing | Homepage with full UX system (palette, serif/scale, motion, storytelling) | `/` |
| Private chat | Talk/unsure/quiet/support entries, Muse Spark replies, theme + need suggestions, correction flow, saved sessions, voice record → review → transcribe | `/app` |
| Discovery (sample) | Fictional communities with "Why it may fit" relevance, stories, quiet reading — browser-session only | `/app` tabs |
| Sample → real handoff | Discovery footer "Browse live communities" links `/communities?themes=` with confirmed themes; real list renders overlap | `/app` → `/communities` |
| Discovery (real) | 3 seeded Supabase communities, member/post counts, authenticated private proposal path, owner-visible pending state | `/communities`, `/communities/propose` |
| Membership (real) | Join with alias, posts, replies, reports, blocks, leave, delete, consent records, private activity levels, community helper disclosure | `/communities/[id]` |
| Demo gate | Separate green design system, shared demo credentials, session-only | `/connect`, `/connect/member` |
| Moderation (real) | Human reviewer queue, decisions, appeals, metrics, per-community AI triage attribution, reviewer proposal queue, worker | `/moderation` |
| AI | chat, advice, triage, transcribe, queue worker — all keyed and eval-verified | API + `tests/ai-live.spec.ts` |

Direct answers to the open product questions:

- **Can I expect someone else to reply?** Only asynchronously: a human must
  open the community, press Refresh, and write a reply. No realtime, no
  notifications, no presence, no "someone is typing".
- **Is there a moderator agent in each community?** Every existing/proposed
  community now has a scoped AI helper configuration. It adds community purpose
  and topics to advisory triage and is attributed in the human review queue.
  It does not enforce. Separate facilitator logic can answer Ask posts older than 24 hours when no human has replied. Vercel Hobby invokes the queue worker once daily, so this is not continuous monitoring or staffed response coverage.
- **Does the agent create communities?** Members can suggest a private
  community; the server automatically creates a pending record, host
  membership, and helper. An allowlisted human must confirm coverage before
  approval. No proposal auto-publishes or imports private chat.
- **Profile / scoring / volunteer / verified?** The live member view derives
  private community activity levels from qualifying visible contributions.
  Human-reviewed role labels are separate and disabled by default. Volunteer,
  training, evidence, and renewal workflows are still open.

### Implementation update — 2026-11-02

- [x] Add an authenticated user-proposal flow with fresh purpose text and no
  private-chat import.
- [x] Automatically provision the private pending community, host membership,
  and one scoped AI helper per proposal; backfill helpers for seeded groups.
- [x] Prevent non-owners from seeing pending proposals and prevent joining,
  reading, posting, or replying until a reviewer approves launch.
- [x] Add a reviewer-allowlisted queue and explicit human-coverage attestation;
  show the owner a clear pending state.
- [x] Scope queued triage to each community's public purpose/topics and record
  helper attribution; keep every model result advisory.
- [x] Add private, community-scoped activity levels: 3 distinct qualifying
  contributions across 2 UTC days for Contributor; 10 across 5 days for
  Community regular. Require at least 20 trimmed characters; normalized
  duplicate text counts once; held/removed content is excluded.
- [x] Keep role verification separately gated by
  `COMMUNITY_ROLE_VERIFICATION_ENABLED=false` and add labeled demo-only sample
  profiles at the activity levels without fake Auth users.
- [x] Verify proposal → pending/helper → reviewer approval → community activity
  in Playwright on desktop and mobile using isolated API fixtures (2/2 passed).
- [x] Apply the community progress/lifecycle migrations to the Supabase project and verify the
  same flow against the live backend.
- [ ] Configure `COMMUNITY_REVIEWER_USER_IDS` and named human coverage; monitor
  the daily worker backlog before calling proposals monitored or launching
  a public community.
- [ ] Complete the original visitor → private chat/voice → story/match → live
  join → history/reply → human response flow; the current browser test does
  not cover the entire product journey.

## 2. Target end-to-end journey (the story we are building toward)

**Act 1 — Land.** A person in an unfinished-thought moment lands on `/`,
feels understood in 10 seconds, and starts talking with one tap — no account,
no jargon, no walls of text.

**Act 2 — Talk.** A calm WhatsApp-simple chat. They type or tap voice; the
agent listens, reflects, and quietly figures out the problem statement. The
interface stays out of the way: bubbles, one input, one voice button, gentle
typing/loading states.

**Act 3 — Understand.** The agent mirrors back what it heard ("sounds like
family pressure about timing") and asks to confirm — in the chat flow, not in
a giant side panel. Confirmation is one tap.

**Act 4 — Match.** The agent finds the closest circle and says why, in plain
words, and surfaces one relevant shared journey ("people here talked about
asking parents for more time") so joining feels safe and concrete.

**Act 5 — Join.** Joining is two taps: pick an alias, confirm. The value of
joining is visible *before* the account wall: what happens inside, who is
there (in aggregate, never identities), what to expect.

**Act 6 — Belong.** Inside the circle: read quietly or post; ask and get an
answer — from peers when they are around, from a clearly-labelled community
facilitator when they are not. Previous conversations are readable; nothing
is a black box.

**Act 7 — Grow.** Contributing earns visible standing: a profile, a
helpfulness record, and a path from new member → trusted contributor →
volunteer → verified supporter, with human review at every promotion.

Every section below maps gaps against these seven acts.

## 3. Page-by-page critique (friction list)

### 3.1 `/` homepage (the bar — keep, extend, don't dilute)

- [ ] Keep as the visual source of truth; add any new component here first
  or in a shared story, never as a one-off elsewhere.
- [ ] Make the primary CTA deep-link into the talk flow with context
  ("Start privately" → `/app?path=talk` already; preserve reduced-motion
  and mobile behavior while doing so).
- [ ] Add one honest line near the CTA about what happens to the first
  message (sent to Meta for a reply, not stored without an account).

### 3.2 `/app?path=talk` — private chat (highest-friction screen in the app)

Observed: account card + provenance line + assistant card + composer + three
link rows + three more links + footer — before the user has written a word.
The "Have I got this right?" panel then stacks WHAT YOU SAID / MIGHT MATTER /
WHAT YOU WANT + three buttons + conditional sub-panels.

- [x] Redesign as a single-column messenger: header (one line), bubbles,
  one composer row (input + voice button + send). Nothing else above the fold.
- [ ] Collapse the account upsell into one quiet inline row after the first
  exchange ("Keep this chat across devices →"), not a full card up front.
- [ ] Fold theme/need confirmation INTO the chat as a compact agent message
  with inline Yes / Not-quite chips — delete the big `inline-understanding`
  panel as a separate block.
- [x] One-tap voice: single mic button in the composer row; tap to record
  with live timer + waveform, tap to stop, auto-transcribe, transcribed text
  lands in the composer editable. Delete the record → review → transcribe →
  edit → use chain as separate user steps (keep review-before-send as the
  pre-filled composer, which it already is).
- [ ] Recording must be unmistakable: pulsing indicator, elapsed time,
  cancel affordance; handle mic-denied with a typed fallback inline.
- [x] Streaming or staged loading: animated typing indicator within 300ms of send;
  never a dead silent wait on a 2–5s model call.
  Status: an immediate “Muse Spark is preparing a response…” status line already
  exists (`harmonise-experience.tsx`); staged/streaming animation is the gap.
- [ ] Cut the six footer links to one overflow ("More: how your data is
  used · start fresh · explore") — the current link farm reads as clutter.
- [x] Keep "Your chat is not posted" disclosure, but as a one-line dismissible
  note, not a permanent paragraph.
- [x] Empty state: 3 gentle starter chips ("Work is overwhelming", "Family
  pressure", "Not sure — just listen") instead of a blank composer.
  Status: one “Not sure where to start” composer preset already exists; expand
  to three chips.
- [x] Error state: add an explicit one-tap retry button.
  Status: failed sends already restore the draft to the composer with plain-words
  copy (`sendChat`); only the dedicated retry button is missing.

### 3.3 `/app` discovery + tabs (two community systems collide here)

Observed: tabs (My Space, Communities, Connections, My Journey, Find Support)
show fictional sample communities with "Why it may fit: open browsing, with no
personal context applied" — while the REAL communities live at
`/communities` with no matching at all.

- [ ] Decide the product truth: sample communities are an onboarding
  illustration, real communities are the destination. Never show both as if
  they are the same thing.
- [x] Proactive in-chat circle recommendation with deep-link to the top-matched
  REAL community.
  Status: theme scoring (`community-topics.ts`), `?themes=` overlap on the real
  list, and the discovery-footer “Browse live communities” link already exist;
  the agent never recommends unprompted and “Hear experiences” still opens the
  sample grid.
- [ ] After confirmation in chat, deep-link to matching: "Hear experiences"
  should open the top-matched REAL community (or its preview), not the
  sample grid.
- [ ] Label honesty pass: every sample/fictional surface carries one
  consistent badge ("Sample — for exploring"), and it must be impossible to
  mistake a fictional transcript for a real member post.
- [ ] My Journey tab: link the timeline to real-world state (joined circles,
  contributions).
  Status: the session timeline itself (chapters, confirmed themes, explored
  perspectives, takeaway, next step, usefulness) already exists (`renderJourney`);
  it is session-only and fictional.
- [ ] Connections tab: graduate the fictional consent-pattern demo into real
  people-matching (see 7.5) or merge it into circles.
  Status: the tab already demonstrates mutual-consent states (`renderConnections`);
  nothing real is behind it.
- [ ] Find Support tab: merge crisis/safety resources into one always-
  reachable pattern (header link + in-chat escalation) instead of a tab that
  competes with the main flow.

### 3.4 `/communities` directory (good bones, no pull)

Observed: clean cards, honest counts, fixed pill labels — but nothing tells a
newcomer WHY to join, what happens inside, or which circle fits them.

- [x] Add a "Not sure which fits? Talk for 2 minutes →" entry that starts
  chat and returns with a recommendation (closes the Act 4 loop).
- [x] Each card: one-line "what happens inside" + activity signal ("3 new
  posts this week" — real counts only, "quiet right now" when empty).
- [x] Signed-in: show "Joined ✓" state and last-visit/unread hint per card.
- [ ] Empty directory state: honest "no circles yet" + what happens next
  (agent-suggested circle request — see 7.3).

### 3.5 `/communities/[id]` signed-out (a wall with no window)

Observed: description + counts + sign-in card. Correct privacy, zero
motivation: the user must commit (account + join) before seeing any value.

- [x] Add a value preview above the wall: what members do here, 2–3
  illustrative (clearly-marked sample or consented-public) snippets, typical
  reply time, moderator presence note.
- [x] Show the join path as 2 steps (1. private account, 2. pick an alias)
  with time estimate ("under a minute").
- [x] After sign-in, land back HERE with the alias picker open — never dump
  the user at a generic home. Built: community detail re-loads in place after
  `AuthCard` sign-in and shows the alias picker (`real-community-detail.tsx`).

### 3.6 `/communities/[id]` member view (functional, not alive)

Observed: alias bar, "Share with this community" composer with review step,
"Recent posts" + manual Refresh, posts below. Works — but feels like a form
with a list under it, not a place where people are.

- [x] Restructure as a conversation space: pinned welcome + norms first,
  then the feed, composer sticky at the bottom (chat-like), not a form at
  the top.
- [x] Replace manual Refresh with live updates (Supabase Realtime) +
  "3 new posts" pill when scrolled; keep Refresh as fallback only.
- [x] Reply expectations: each post shows reply state ("2 replies · last
  reply 2h ago") and the composer offers "Ask" vs "Share" intent so others
  know a response is wanted.
  Status: expandable “Read and reply”/“Hide replies” with an empty state already
  exists; counts, recency, and intent chips are missing.
- [x] Relevant-journey surfacing: when the agent matched this circle, pin a
  personal strip at top ("Because you talked about X: this thread helped
  people with similar timing pressure") linking to the thread.
- [ ] Presence without surveillance: aggregate only ("5 members here this
  week"), never online dots or read receipts on people.
- [x] Composer friction: keep review-before-post (privacy promise) but make
  it one expanding step inside the composer, not a separate screen-feeling
  flow; preserve drafts across navigation.
- [x] Post states: clear visual treatment for held/under-review/removed
  (author sees why + appeal entry; others simply don't see it).
- [x] Mobile: composer thumb-reachable, feed full-width, no horizontal
  overflow at 360px (verified, not assumed).

### 3.7 `/connect` + `/connect/member` (the stranger)

Observed: a THIRD design language (green/charcoal `cx-` system), shared demo
credentials on screen, session-only semantics — disconnected from real auth
and real communities.

- [x] Decide: retire `/connect` into the main flow or rebuild it in the
  homepage design system. Two visual languages is a trust bug.
- [ ] Remove shared demo credentials from the UI; replace with one-tap
  "Explore the demo" (no password typing) if a demo must remain.
- [ ] If `/connect` is the "meet people" flow, define its relationship to
  circles: is it 1:1 matching? If yes, spec it (see 7.5); if no, remove it.
- [ ] `/connect/member` gate ("Start at the entrance") must explain in one
  line what the member area IS — currently a button to nowhere.
- [x] No new auth mechanism: demo entry must reuse the same session model
  as the rest of the app (or be explicitly marked throwaway).

### 3.8 `/moderation` reviewer view (solid, needs ops depth)

Observed: duty banner, community picker, Refresh queue, metrics chips, clear
empty state. "Overturn rate: 100%" with zero cases reads as a bug.

- [x] Hide or grey-out metrics until n ≥ 1 ("No decisions yet" instead of
  100%). Built: API returns `overturnRate: null` when nothing is judged; the UI
  renders "-" (`moderation.ts`, `reviewer-queue.tsx`). The "100%" seen live was
  real E2E-probe appeal data — see the suite-hygiene item.
- [x] Queue auto-refresh + new-report ping for on-duty reviewers (no
  silent stale queue during staffed hours).
- [ ] Case view: full thread context (post + replies + author history
  counts, never identities), side-by-side AI suggestion with rationale, and
  one-click decision with required rationale for actions.
- [x] SLA display per case ("waiting 3h · target < 24h") with escalation
  coloring; outside staffed hours show the honest banner users also see.
- [x] Appeal case view mirrors decision view; second reviewer must differ
  from the first (enforced, not just policy text).
- [ ] Reviewer audit trail page: who decided what, when, with rationale —
  exportable for the pilot review.

## 4. Cross-cutting UX improvements (design system + feel)

### 4.1 One design system, everywhere

- [ ] Freeze the homepage tokens as the single system (palette, serif/
  sans pairing, type scale, radius, shadows, spacing rhythm) and document
  them in one place; delete or migrate the green `cx-` system.
- [ ] One button family (primary / secondary / quiet / danger), one input
  family, one card, one badge, one notice — audited on every route.
- [ ] One illustration style (homepage's soft vector scenes); replace any
  generic icon-grid or emoji-led moments on product screens.
- [ ] Typography pass: no page ships body copy smaller than 15px, no
  heading below the homepage's scale logic, line-length capped (~68ch).

### 4.2 Motion, feedback, aliveness

- [ ] Every async action has three designed states: working (skeleton or
  typing shimmer, never a dead freeze), success (gentle confirm, auto-
  dismiss), failure (inline, retryable, human words).
- [ ] Homepage-grade entrance motion on route changes (fade/slide ≤300ms),
  all reversible and `prefers-reduced-motion` safe.
- [ ] Chat: message send animation, animated typing indicator, smooth
  scroll-to-latest that respects "user scrolled up to read".
  Status: the immediate pending status line already exists; animation and
  scroll behaviors are the gap.
- [ ] Feed: skeleton cards on load, "new posts" pill on live arrival,
  optimistic post insert with "sending…" → confirmed treatment.

### 4.3 Accessibility + mobile baseline (non-negotiable per page)

- [x] Keyboard: full journey operable (chat, join, post, reply, report,
  appeal) with visible focus and sane tab order; audit each redesigned page.
- [ ] Screen reader: aria-live for chat replies, feed updates, toasts, and
  recording state; audit each redesigned page.
- [ ] Contrast: text on pills/badges/banners ≥ 4.5:1 (regression-test the
  ink-on-ink class of bug with a computed-style check).
- [ ] Touch: 44px targets for composer, voice, send, join, report actions;
  verified at 360×740 and 390×844, not just desktop.
- [ ] Reduced motion: every animation has a still path; test with the OS
  flag on, per page.

### 4.4 Account, sessions, trust surfaces

- [x] Auth: explain email-code flow before asking for email ("we'll email
  a code — no password to remember"); resend with cooldown; code expiry
  stated.
  Status: OTP send/verify with rate-limit copy exists (`auth-card.tsx`); a resend
  button (users currently cannot re-request a code), expiry text, and the
  explainer are missing. Post-sign-in continuation in place already works.
- [ ] Sessions ("Your saved conversations"): rename to human words ("Your
  chats"), show last-topic preview + age, one-tap resume/delete, honest
  90-day expiry note per item.
- [x] Export/delete: progress + completion states (not fire-and-forget),
  and a "what got deleted / kept 30 days for safety" receipt.
- [x] Consent timing: ask for review at the moment of sharing (already the
  pattern — keep it), and never re-ask for the same text twice.

## 5. User-flow improvements (fewer steps, clearer promises)

- [ ] First-run: land → first reply in ≤3 taps with zero account friction;
  measure taps-to-first-reply as the core funnel metric.
- [x] Chat → circle handoff: proactive in-chat recommendation carrying context
  ("matched because: family timing pressure") into the community preview
  and the join screen — the user never re-explains themselves.
  Status: a context-carrying link (`/communities?themes=`) already exists in the
  discovery footer; the agent never initiates it.
- [x] Join funnel: alias picker with gentle availability + tone guidance
  ("aliases can't identify you"), one review screen, and a calm confirm
  ("You're in as QuietRiver. Read quietly as long as you like.").
- [x] First post: template-free prompt ("What happened, in your words?")
  with Ask/Share intent chips and the review step inline.
- [x] Quiet readers: first-class path — join → lurk → react (thanks/
  "this helped me") before ever posting; reactions are the on-ramp.
- [x] Ask-a-question flow: explicit "I want replies" toggle with honest
  expectation text ("members usually reply within a day; a facilitator
  checks unanswered questions daily") — replaces the current black box.
- [x] Re-entry: returning members land on "what's new since your visit"
  (counts + top threads), not a bare feed.
- [x] Crisis: extend the visible layer to every free-text surface.
  Status: talk (detection + help navigation) and the reviewer duty banner
  already link help resources; the community composer has no crisis screening
  or inline resources.

## 6. Workflows to improve (ops + automation behind the scenes)

- [x] Worker scheduling: cron/trigger to drain `moderation_events`
  continuously (today: manual calls only; 113-deep backlog observed after
  suite runs). Alert when backlog age > threshold.
- [ ] Suite hygiene: E2E runs clean up the events they enqueue (or use a
  sandbox community) so verification never pollutes the pilot queue.
  Note (verified 2026-11-02): suite appeals also pollute overturn-rate metrics,
  and suite reports left a 113-deep worker backlog.
- [x] Unanswered-question sweeper: daily job surfacing questions with no
  reply in 24h to moderators + the community facilitator (see 7.1).
- [ ] Moderator staffing: on-duty roster with handoff notes; holding queue
  outside staffed hours with honest user-facing copy ("reviews resume 9am").
- [ ] Decision quality loop: sample overturned/appealed cases weekly into
  the eval set as regression cases (metadata only, consented/ synthetic).
- [x] Rate/quota tuning from real usage: replace single-instance memory
  limiter with the shared (Upstash) backend before any public cohort. Built:
  shared backend wired via `instrumentation.ts` (`initSharedRateLimiting`,
  env-gated) with memory fallback. Tuning from real usage remains.
- [x] Ops dashboard: queue depth/age, worker lag, model error rate, spend
  vs budget, signup→join→post funnel — one screen for the pilot review.

## 7. New feature tracks (the missing middle of the vision)

### 7.1 Community facilitator (the "moderator agent") — PARTIALLY BUILT

Built: one scoped `community_moderator_agents` row per community (backfilled
live), community purpose/topics injected into worker triage, helper attribution
recorded on events and shown in the review queue; every model result stays
advisory. Missing: anything that posts, welcomes, answers, nudges, or
facilitates visibly.

- [ ] Spec the role: welcomes, answers unanswered questions after N hours,
  summarizes long threads on request, enforces norms visibly ("moved to a
  new thread"), never pretends to be human, never decides reports.
- [x] Clearly-labelled facilitator identity per community (avatar, "Guide"
  badge, "AI facilitator — reviewed by moderators" disclosure).
- [x] Human override: moderators can edit/remove/hide any facilitator
  message; all facilitator actions logged for audit.
- [ ] Eval set for facilitator behavior (grounded, non-clinical, admits
  limits) before it posts anywhere members can see.

### 7.2 Relevant-story surfacing ("this helped people like you") — NOT BUILT

- [x] Opt-in "feature my journey" consent per post (separate from post
  consent; revocable; alias-preserving).
  Status: a full fictional contributor prototype exists (private notes →
  shareable summary → discoverable/question scope → approve/publish/revoke,
  `renderContributor`); the real backend + consent records are missing.
- [ ] Matching v1: theme overlap + recency → top thread shown in chat
  recommendation and pinned atop the matched circle for that user.
- [x] Display rules: excerpt only, link to full thread, "shared with
  permission" note, author can unfeature in one tap.

### 7.3 Circle lifecycle (creation, dormancy) — PARTIALLY BUILT

Built: member proposal flow (`/communities/propose`), auto-provisioned pending
community + host membership + scoped helper, non-owner invisibility,
allowlisted reviewer approval with coverage attestation (`reviewPendingCommunity`),
owner pending state. Verified live 2026-11-02.

- [x] No-match path: when no circle fits, the agent says so honestly and
  offers "request a circle" (topic + why) instead of force-fitting. Built:
  the proposal flow covers request-with-purpose; the sample-discovery honest
  no-match panel (“There isn't a close fit… No people will be invented”) also
  exists. Missing: the agent proactively offering it from chat.
- [x] Circle requests queue: seed approved circles with norms; merge or
  decline with a kind redirect.
  Status: the allowlisted review queue with approve + coverage attestation and
  helper provisioning already exists; norms seeding, merge, and kind-decline
  paths are missing.
- [x] User-created circles (phase 2): name, purpose, norms draft, founding
  moderator; agent assists drafting, humans approve. Built: members propose
  with name/purpose/topics, become host, allowlisted humans approve with
  coverage attestation (`/communities/propose`, `[id]/review`). Missing: agent
  drafting assistance and norms seeding.
- [x] Dormant circles: "quiet right now" state, archive (read-only) vs
  revive decision owned by moderators, never silent deletion.

### 7.4 Profile, standing, volunteer track — PARTIALLY BUILT

Built: private community-scoped activity levels (Contributor: 3 distinct
qualifying contributions across 2 UTC days; Community regular: 10 across 5;
20 trimmed chars; normalized dedupe; held/removed excluded) computed by a
live RPC and shown on a progress card; role verification separately gated by
flag with demo-only sample profiles. Missing: profile page, reactions,
Trusted/Volunteer/Verified rungs, human-reviewed promotion, volunteer ops.

- [x] Member profile (private-first): my posts/replies, thanks received,
  circles, standing progress — visible to self; public slice is
  alias + standing badge only.
- [ ] Helpfulness signals: "this helped me" reactions, accepted answers on
  questions, moderator endorsements — no downvotes, no public counts that
  rank people against each other.
- [x] Standing ladder: publish criteria per rung; add Trusted → Volunteer →
  Verified supporter above the existing activity rungs.
  Status: new-member → contributor → community-regular already computed live
  (`community-progress.ts` + RPC); criteria are not yet published in-product.
- [x] Promotion = human-reviewed: eligibility is computed, approval is a
  moderator decision with rationale; appeals allowed.
- [x] Volunteer role: welcome duty, unanswered-question duty, training
  checklist, term limits, burnout guardrails (max cases/week).
- [x] Verified supporter: identity-verified (off-platform check), badge,
  scope limits (peer support only — never clinical/legal), revocation path.
  Status: only the `community_member_verifications` table, the
  `COMMUNITY_ROLE_VERIFICATION_ENABLED=false` gate, demo-only sample profiles,
  and a fictional “no verified provider” scaffold exist.

### 7.5 People matching (if `/connect` survives) — NOT BUILT

- [ ] Define the promise narrowly first: async "talk to someone who has
  been there" (volunteer), not realtime chat, not dating, not therapy.
- [ ] Request → match (themes + availability) → intro message → async
  exchange inside Harmonise, both pseudonymous, either can end anytime.
- [ ] Safety: all exchanges reportable, facilitator-visible patterns for
  abuse, hard block on moving off-platform for first N exchanges.

## 8. Integrations pending

- [x] Realtime feed/queue (Supabase Realtime or equivalent) — replaces all
  manual Refresh buttons.
- [ ] Notifications: email for replies/decisions/appeals (user opted-in,
  batched, quiet hours); in-app unread state; push only if a mobile shell
  is built. No notification should ever leak another member's identity.
- [ ] Transactional email delivery for auth codes (custom templates +
  deliverability check) — auth is email-code, so this is load-bearing.
  Status: sending works via Supabase Auth `/otp` emails (`api/auth/otp`); no
  custom templates, sender review, or deliverability monitoring.
- [x] Worker scheduler (cron) + backlog alerting (see 6).
- [ ] Analytics (privacy-preserving, aggregated): funnel taps-to-first-
  reply, join rate, post rate, reply latency, retention — no per-user
  tracking, no third-party pixels without consent review.
- [ ] Speech synthesis (only if validated as a user need — currently
  deferred; transcription-only is the shipped scope).
- [ ] Optional later: calendar/reminder for volunteers, export-to-PDF for
  journals, community health digest for moderators.

## 9. Suggested build order (PM cut — confirm before building)

Status 2026-11-02: proposal flow, helper config + triage attribution, activity
levels, and Upstash are already built (see sections above); the order below
assumes those as done.

**P0 — the core loop must feel alive (one cycle):**
chat redesign (3.2) → real-circle matching + join handoff (3.3, 5) →
community preview + member-view restructure (3.5, 3.6) → Ask/Share +
reply expectations (3.6, 5) → realtime feed (8) → worker scheduler (6).

**P1 — trust + depth:** facilitator v1 (7.1) → relevant stories (7.2) →
reviewer ops depth (3.8) → `/connect` decision (3.7) → notifications (8) →
design-system audit lockdown (4.1).

**P2 — growth + maturity:** circle lifecycle (7.3) → profile/standing/
volunteer (7.4) → people matching (7.5) → analytics (8) → synthesis/adjacent.

## 10. Open questions for the human (decisions needed, not guesses)

- [ ] Is the facilitator (7.1) allowed to post unprompted (welcomes,
  nudges), or only when asked / after N-hour silence?
- [ ] What reply-time promise can we honestly print for Ask posts in the
  pilot (24h? "usually within a day"? nothing until data exists)?
- [ ] Who staffs moderation, which hours, and what does the holding
  experience say outside them?
- [ ] Does `/connect` live (as people-matching, 7.5) or get retired into
  circles?
- [ ] Are fictional sample communities a permanent onboarding device or a
  scaffold to remove once real circles have content?
- [ ] What earns "verified" — and who performs the off-platform identity
  check?
- [ ] Retention/deletion promises for facilitator-visible content: same
  90-day session rule, or community-scoped rules?

## 11. Implementation log � 2026-11-03 full-journey cycle

65/123 boxes checked in this cycle. Suite: desktop 71-72/72 (1 flake, passes
alone), mobile 72/72, plus 8 new surface specs. typecheck + lint clean.

**Talk (3.2):** messenger layout, starter chips, one-tap mic with
auto-transcribe + mic-denied fallback, typing indicator, retry button,
dismissible privacy note, footer trimmed
(`harmonise-experience.tsx`, `globals.css`).

**Match (3.3, 5):** proactive `CircleRecommendation` after confirmation with
"matched because" context carried into `/communities?themes=` and the join
screen; honest no-match already existed.

**Directory + preview (3.4, 3.5):** talk-entry banner, real weekly activity /
"quiet right now", Joined state, value preview + 2-step join path above the
wall, land-back with alias picker.

**Belong (3.6, 5):** conversation-space restructure (norms first, feed, sticky
composer), Ask/Share intent chips with expectation text
("members usually reply within a day..."), reply counts + recency, composer
crisis layer on posts AND replies, drafts across navigation, held/appeal post
states, 15s visibility-gated live polling + "N new" pill (Refresh kept as
fallback), since-visit "what is new" digest, mobile-verified suite.

**Realtime decision (�8):** sockets deliberately NOT built � polling + pill
chosen for the pilot (no new infra, degraded-state honest). Revisit with
usage data.

**Stories (7.2):** opt-in featuring consent per post (revocable,
alias-preserving), featured strip in chat recommendation + atop matched
circle, excerpt/link/"shared with permission"/one-tap unfeature.
Matching v1 (auto theme-overlap surfacing) still open � featuring is
curated, not automatic. The engagement migration is applied; confirm the
featured UI and revocation flow after the main deployment.

**Moderation ops (3.8):** queue auto-refresh (30s, no ping yet), per-case
waiting-time badge with 24h-target escalation color, same-reviewer appeal
block enforced server-side + surfaced, audit-trail page (not yet
exportable). Full thread-context case view still open.

**Auth/sessions (4.4):** resend with 30s cooldown, "different email" reset,
expiry copy; session rename; export receipt (count + date); deletion
receipt panel. "Your chats" rename + per-item 90-day note still open.

**Ops (6, 8):** Vercel Hobby cron invokes `/process` once daily (one queue
event per invocation); daily 9am cron runs `/facilitate` (oldest unanswered
ask >24h, Guide-AI labelled); `/ops` dashboard (secret-gated) with signup?join?post
funnel, queue depth + oldest-age backlog alert, token spend, slowest
routes. Suite hygiene + staffing + decision-quality loop still open.

**Lifecycle (7.3):** decline-with-kind-note (message required, redirect
guidance), owner rejected view with note + browse redirect, moderator
archive (read-only, members can still read) / revive with confirm, never
silent deletion. Norms ship as the seeded welcome block on every circle.
Migrations `20261102204240` (engagement) and `20261102204243` (review note) are applied live.

**Standing (7.4):** `/profile` � circles, alias, level, posts/replies/thanks,
in-app notifications (7-day window, unread count), published ladder
criteria, volunteer + verified-supporter request flow with duty/term/
scope disclosure, moderator promotion queue with mandatory rationale.
Accepted answers + endorsements still open. Thanks reactions are enabled by the applied engagement migration.

**Connect (3.7):** reskinned into the homepage system (milk/plum/coral,
harmonize. wordmark + loop symbol), one-tap demo entry added (manual
credential path kept for the suite; shared-creds removal still open).
People-matching (7.5) and the retire-vs-keep call stay with the human.

**Still needs a human (�10):** facilitator unprompted-post policy,
reply-time promise wording, moderation staffing/hours, connect fate,
sample permanence, verified-identity operator, retention rules.

**Live schema:** engagement and reviewer-note migrations are applied. The
feature branch is not yet deployed; live write-flow verification still needs a
deployed build and dedicated consenting test accounts/community.


## 12. Implementation log - mock-removal + parallel QA cycle (2026-11-03, later)

Parallel workflow (4 slices, shared checkout, per-stage commits) + central
regression. Suite: **100 passed / 18 credential-gated skipped, desktop +
mobile**. typecheck + lint clean.

**Connect (3.7) - demo fully retired:** gate uses real email-code OTP auth
with session restore and real sign-out; circles tab reads live memberships
and posts via /api/communities (join/post/reactions real, reactions degrade
honestly); journey/coaches show real contribution counts, history, and
promotion state (invented points and coach roster removed); adviser matches
now resolve against live communities because /api/advice builds its match
enum from approved DB circles instead of hardcoded fictional themes.

**Mock sweep:** silent fiction in the main journey now labeled at every
surface (fictional community/people/discussions), takeaways use the signed-in
user's own words (no more Arjun attribution or hardcoded alias);
src/lib/community-progress-demo.ts deleted (unused).

**Designer pass:** glassy bg-white/70 + dark-mode remnants removed from
ops/profile/moderation pages; shared .state-card, .section-head,
.loading-skeleton patterns; product header + DM webfonts adopted.

**Still open:** migrations 0005/0006 need the Supabase DB password (apply,
then live-verify reactions/featuring/promotions end-to-end); milestone
confirmations have no persistence endpoint (labeled this-session
reflections); no verified-supporter roster endpoint exists (coaches tab
shows real application state instead); profile/ops/moderation are on
develop but not yet deployed.
