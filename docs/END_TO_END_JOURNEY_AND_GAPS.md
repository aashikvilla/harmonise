# End-to-End Journey, Gaps & UX Overhaul Backlog

**Status:** product backlog refreshed after the 2026-11-02 community lifecycle/progression implementation. Remaining items are still open unless explicitly checked below.
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
- The latest community browser journey uses isolated API fixtures. Migrations
  `0003`/`0004` are not yet applied to the live Supabase project, so that test
  does not claim live database verification.

## 1. Current-state map (what actually exists today)

Seven routes, two community systems, five AI touchpoints. The single most
important fact in this document is the split in the middle row:

| Layer | What exists | Where |
|---|---|---|
| Landing | Homepage with full UX system (palette, serif/scale, motion, storytelling) | `/` |
| Private chat | Talk/unsure/quiet/support entries, Muse Spark replies, theme + need suggestions, correction flow, saved sessions, voice record → review → transcribe | `/app` |
| Discovery (sample) | Fictional communities with "Why it may fit" relevance, stories, quiet reading — browser-session only | `/app` tabs |
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
  It does not post, welcome, answer, or enforce. The worker still has no
  scheduled caller, so this is not continuous monitoring.
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
- [ ] Apply migrations `0003`/`0004` to the Supabase project and verify the
  same flow against the live backend.
- [ ] Configure `COMMUNITY_REVIEWER_USER_IDS`, named human coverage, and the
  moderation worker schedule before calling proposals monitored or launching
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

- [ ] Redesign as a single-column messenger: header (one line), bubbles,
  one composer row (input + voice button + send). Nothing else above the fold.
- [ ] Collapse the account upsell into one quiet inline row after the first
  exchange ("Keep this chat across devices →"), not a full card up front.
- [ ] Fold theme/need confirmation INTO the chat as a compact agent message
  with inline Yes / Not-quite chips — delete the big `inline-understanding`
  panel as a separate block.
- [ ] One-tap voice: single mic button in the composer row; tap to record
  with live timer + waveform, tap to stop, auto-transcribe, transcribed text
  lands in the composer editable. Delete the record → review → transcribe →
  edit → use chain as separate user steps (keep review-before-send as the
  pre-filled composer, which it already is).
- [ ] Recording must be unmistakable: pulsing indicator, elapsed time,
  cancel affordance; handle mic-denied with a typed fallback inline.
- [ ] Streaming or staged loading: typing indicator within 300ms of send;
  never a dead silent wait on a 2–5s model call.
- [ ] Cut the six footer links to one overflow ("More: how your data is
  used · start fresh · explore") — the current link farm reads as clutter.
- [ ] Keep "Your chat is not posted" disclosure, but as a one-line dismissible
  note, not a permanent paragraph.
- [ ] Empty state: 3 gentle starter chips ("Work is overwhelming", "Family
  pressure", "Not sure — just listen") instead of a blank composer.
- [ ] Error state: failed send keeps the draft, offers one-tap retry, and
  names the cause in plain words (no raw error kinds).

### 3.3 `/app` discovery + tabs (two community systems collide here)

Observed: tabs (My Space, Communities, Connections, My Journey, Find Support)
show fictional sample communities with "Why it may fit: open browsing, with no
personal context applied" — while the REAL communities live at
`/communities` with no matching at all.

- [ ] Decide the product truth: sample communities are an onboarding
  illustration, real communities are the destination. Never show both as if
  they are the same thing.
- [ ] Wire "Why it may fit" to the REAL communities: score the 3 seeded
  circles from confirmed themes and render the same explainer cards against
  them, with a Join CTA per card.
- [ ] After confirmation in chat, deep-link to matching: "Hear experiences"
  should open the top-matched REAL community (or its preview), not the
  sample grid.
- [ ] Label honesty pass: every sample/fictional surface carries one
  consistent badge ("Sample — for exploring"), and it must be impossible to
  mistake a fictional transcript for a real member post.
- [ ] My Journey tab: show the confirmed understanding + matched circles as
  a journey timeline (talked → confirmed → joined → contributed), not a
  transcript dump; keep transcripts collapsible per conversation.
- [ ] Connections tab: define what a connection IS (followed journey?
  saved reply? human contact?) or remove the tab — an undefined tab is worse
  than no tab.
- [ ] Find Support tab: merge crisis/safety resources into one always-
  reachable pattern (header link + in-chat escalation) instead of a tab that
  competes with the main flow.

### 3.4 `/communities` directory (good bones, no pull)

Observed: clean cards, honest counts, fixed pill labels — but nothing tells a
newcomer WHY to join, what happens inside, or which circle fits them.

- [ ] Add a "Not sure which fits? Talk for 2 minutes →" entry that starts
  chat and returns with a recommendation (closes the Act 4 loop).
- [ ] Each card: one-line "what happens inside" + activity signal ("3 new
  posts this week" — real counts only, "quiet right now" when empty).
- [ ] Signed-in: show "Joined ✓" state and last-visit/unread hint per card.
- [ ] Empty directory state: honest "no circles yet" + what happens next
  (agent-suggested circle request — see 7.3).

### 3.5 `/communities/[id]` signed-out (a wall with no window)

Observed: description + counts + sign-in card. Correct privacy, zero
motivation: the user must commit (account + join) before seeing any value.

- [ ] Add a value preview above the wall: what members do here, 2–3
  illustrative (clearly-marked sample or consented-public) snippets, typical
  reply time, moderator presence note.
- [ ] Show the join path as 2 steps (1. private account, 2. pick an alias)
  with time estimate ("under a minute").
- [ ] After sign-in, land back HERE with the alias picker open — never dump
  the user at a generic home.

### 3.6 `/communities/[id]` member view (functional, not alive)

Observed: alias bar, "Share with this community" composer with review step,
"Recent posts" + manual Refresh, posts below. Works — but feels like a form
with a list under it, not a place where people are.

- [ ] Restructure as a conversation space: pinned welcome + norms first,
  then the feed, composer sticky at the bottom (chat-like), not a form at
  the top.
- [ ] Replace manual Refresh with live updates (Supabase Realtime) +
  "3 new posts" pill when scrolled; keep Refresh as fallback only.
- [ ] Reply expectations: each post shows reply state ("2 replies · last
  reply 2h ago") and the composer offers "Ask" vs "Share" intent so others
  know a response is wanted.
- [ ] Relevant-journey surfacing: when the agent matched this circle, pin a
  personal strip at top ("Because you talked about X: this thread helped
  people with similar timing pressure") linking to the thread.
- [ ] Presence without surveillance: aggregate only ("5 members here this
  week"), never online dots or read receipts on people.
- [ ] Composer friction: keep review-before-post (privacy promise) but make
  it one expanding step inside the composer, not a separate screen-feeling
  flow; preserve drafts across navigation.
- [ ] Post states: clear visual treatment for held/under-review/removed
  (author sees why + appeal entry; others simply don't see it).
- [ ] Mobile: composer thumb-reachable, feed full-width, no horizontal
  overflow at 360px (verified, not assumed).

### 3.7 `/connect` + `/connect/member` (the stranger)

Observed: a THIRD design language (green/charcoal `cx-` system), shared demo
credentials on screen, session-only semantics — disconnected from real auth
and real communities.

- [ ] Decide: retire `/connect` into the main flow or rebuild it in the
  homepage design system. Two visual languages is a trust bug.
- [ ] Remove shared demo credentials from the UI; replace with one-tap
  "Explore the demo" (no password typing) if a demo must remain.
- [ ] If `/connect` is the "meet people" flow, define its relationship to
  circles: is it 1:1 matching? If yes, spec it (see 7.5); if no, remove it.
- [ ] `/connect/member` gate ("Start at the entrance") must explain in one
  line what the member area IS — currently a button to nowhere.
- [ ] No new auth mechanism: demo entry must reuse the same session model
  as the rest of the app (or be explicitly marked throwaway).

### 3.8 `/moderation` reviewer view (solid, needs ops depth)

Observed: duty banner, community picker, Refresh queue, metrics chips, clear
empty state. "Overturn rate: 100%" with zero cases reads as a bug.

- [ ] Hide or grey-out metrics until n ≥ 1 ("No decisions yet" instead of
  100%).
- [ ] Queue auto-refresh + new-report ping for on-duty reviewers (no
  silent stale queue during staffed hours).
- [ ] Case view: full thread context (post + replies + author history
  counts, never identities), side-by-side AI suggestion with rationale, and
  one-click decision with required rationale for actions.
- [ ] SLA display per case ("waiting 3h · target < 24h") with escalation
  coloring; outside staffed hours show the honest banner users also see.
- [ ] Appeal case view mirrors decision view; second reviewer must differ
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
- [ ] Chat: message send animation, typing indicator ≤300ms, smooth
  scroll-to-latest that respects "user scrolled up to read".
- [ ] Feed: skeleton cards on load, "new posts" pill on live arrival,
  optimistic post insert with "sending…" → confirmed treatment.

### 4.3 Accessibility + mobile baseline (non-negotiable per page)

- [ ] Keyboard: full journey operable (chat, join, post, reply, report,
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

- [ ] Auth: explain email-code flow before asking for email ("we'll email
  a code — no password to remember"); resend with cooldown; code expiry
  stated; deep-link back to the interrupted action after sign-in.
- [ ] Sessions ("Your saved conversations"): rename to human words ("Your
  chats"), show last-topic preview + age, one-tap resume/delete, honest
  90-day expiry note per item.
- [ ] Export/delete: progress + completion states (not fire-and-forget),
  and a "what got deleted / kept 30 days for safety" receipt.
- [ ] Consent timing: ask for review at the moment of sharing (already the
  pattern — keep it), and never re-ask for the same text twice.

## 5. User-flow improvements (fewer steps, clearer promises)

- [ ] First-run: land → first reply in ≤3 taps with zero account friction;
  measure taps-to-first-reply as the core funnel metric.
- [ ] Chat → circle handoff: the agent's recommendation carries context
  ("matched because: family timing pressure") into the community preview
  and the join screen — the user never re-explains themselves.
- [ ] Join funnel: alias picker with gentle availability + tone guidance
  ("aliases can't identify you"), one review screen, and a calm confirm
  ("You're in as QuietRiver. Read quietly as long as you like.").
- [ ] First post: template-free prompt ("What happened, in your words?")
  with Ask/Share intent chips and the review step inline.
- [ ] Quiet readers: first-class path — join → lurk → react (thanks/
  "this helped me") before ever posting; reactions are the on-ramp.
- [ ] Ask-a-question flow: explicit "I want replies" toggle with honest
  expectation text ("members usually reply within a day; a facilitator
  checks unanswered questions daily") — replaces the current black box.
- [ ] Re-entry: returning members land on "what's new since your visit"
  (counts + top threads), not a bare feed.
- [ ] Crisis: in-chat detection already screens — add the visible layer:
  one-tap helpline resources inline, never a dead-end, on every surface
  where free text is entered.

## 6. Workflows to improve (ops + automation behind the scenes)

- [ ] Worker scheduling: cron/trigger to drain `moderation_events`
  continuously (today: manual calls only; 113-deep backlog observed after
  suite runs). Alert when backlog age > threshold.
- [ ] Suite hygiene: E2E runs clean up the events they enqueue (or use a
  sandbox community) so verification never pollutes the pilot queue.
- [ ] Unanswered-question sweeper: daily job surfacing questions with no
  reply in 24h to moderators + the community facilitator (see 7.1).
- [ ] Moderator staffing: on-duty roster with handoff notes; holding queue
  outside staffed hours with honest user-facing copy ("reviews resume 9am").
- [ ] Decision quality loop: sample overturned/appealed cases weekly into
  the eval set as regression cases (metadata only, consented/ synthetic).
- [ ] Rate/quota tuning from real usage: replace single-instance memory
  limiter with the shared (Upstash) backend before any public cohort.
- [ ] Ops dashboard: queue depth/age, worker lag, model error rate, spend
  vs budget, signup→join→post funnel — one screen for the pilot review.

## 7. New feature tracks (the missing middle of the vision)

### 7.1 Community facilitator (the "moderator agent") — NOT BUILT

- [ ] Spec the role: welcomes, answers unanswered questions after N hours,
  summarizes long threads on request, enforces norms visibly ("moved to a
  new thread"), never pretends to be human, never decides reports.
- [ ] Clearly-labelled facilitator identity per community (avatar, "Guide"
  badge, "AI facilitator — reviewed by moderators" disclosure).
- [ ] Human override: moderators can edit/remove/hide any facilitator
  message; all facilitator actions logged for audit.
- [ ] Eval set for facilitator behavior (grounded, non-clinical, admits
  limits) before it posts anywhere members can see.

### 7.2 Relevant-story surfacing ("this helped people like you") — NOT BUILT

- [ ] Opt-in "feature my journey" consent per post (separate from post
  consent; revocable; alias-preserving).
- [ ] Matching v1: theme overlap + recency → top thread shown in chat
  recommendation and pinned atop the matched circle for that user.
- [ ] Display rules: excerpt only, link to full thread, "shared with
  permission" note, author can unfeature in one tap.

### 7.3 Circle lifecycle (creation, dormancy) — NOT BUILT

- [ ] No-match path: when no circle fits, the agent says so honestly and
  offers "request a circle" (topic + why) instead of force-fitting.
- [ ] Circle requests queue for moderators: approve → seed circle with
  norms + facilitator; merge or decline with a kind redirect.
- [ ] User-created circles (phase 2): name, purpose, norms draft, founding
  moderator; agent assists drafting, humans approve.
- [ ] Dormant circles: "quiet right now" state, archive (read-only) vs
  revive decision owned by moderators, never silent deletion.

### 7.4 Profile, standing, volunteer track — NOT BUILT

- [ ] Member profile (private-first): my posts/replies, thanks received,
  circles, standing progress — visible to self; public slice is
  alias + standing badge only.
- [ ] Helpfulness signals: "this helped me" reactions, accepted answers on
  questions, moderator endorsements — no downvotes, no public counts that
  rank people against each other.
- [ ] Standing ladder: New → Contributing → Trusted → Volunteer →
  Verified supporter, with published criteria per rung.
- [ ] Promotion = human-reviewed: eligibility is computed, approval is a
  moderator decision with rationale; appeals allowed.
- [ ] Volunteer role: welcome duty, unanswered-question duty, training
  checklist, term limits, burnout guardrails (max cases/week).
- [ ] Verified supporter: identity-verified (off-platform check), badge,
  scope limits (peer support only — never clinical/legal), revocation path.

### 7.5 People matching (if `/connect` survives) — NOT BUILT

- [ ] Define the promise narrowly first: async "talk to someone who has
  been there" (volunteer), not realtime chat, not dating, not therapy.
- [ ] Request → match (themes + availability) → intro message → async
  exchange inside Harmonise, both pseudonymous, either can end anytime.
- [ ] Safety: all exchanges reportable, facilitator-visible patterns for
  abuse, hard block on moving off-platform for first N exchanges.

## 8. Integrations pending

- [ ] Realtime feed/queue (Supabase Realtime or equivalent) — replaces all
  manual Refresh buttons.
- [ ] Notifications: email for replies/decisions/appeals (user opted-in,
  batched, quiet hours); in-app unread state; push only if a mobile shell
  is built. No notification should ever leak another member's identity.
- [ ] Transactional email delivery for auth codes (provider + templates +
  deliverability check) — auth is email-code, so this is load-bearing.
- [ ] Worker scheduler (cron) + backlog alerting (see 6).
- [ ] Analytics (privacy-preserving, aggregated): funnel taps-to-first-
  reply, join rate, post rate, reply latency, retention — no per-user
  tracking, no third-party pixels without consent review.
- [ ] Speech synthesis (only if validated as a user need — currently
  deferred; transcription-only is the shipped scope).
- [ ] Optional later: calendar/reminder for volunteers, export-to-PDF for
  journals, community health digest for moderators.

## 9. Suggested build order (PM cut — confirm before building)

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
