# Live application demo audit and recording plan

> **Historical snapshot:** This 2026-11-04 review predates the live-app cleanup. Its `/app` and blocker descriptions are superseded. Use [the 2026-11-05 audit](LIVE_APPLICATION_DEMO_AUDIT-2026-11-05.md) and [the live recording V1 plan](../demos/live-application/v1/storyboard.md) for current routes, claims, and capture steps.

**Updated:** 2026-11-04 after reviewing the corrected targets
**Reviewed:** `demos/cinematic/v1`, `demos/cinematic/v2`, and the current `/`, `/connect`, `/connect/member`, `/communities`, `/profile`, `/moderation`, and `/app` implementations.
**Goal:** Record the real application as a convincing, full-product journey. This document is source review and shot planning; no new HTML mock or video has been made.

## Executive recommendation

Record a chaptered, roughly 12–15 minute walkthrough from real browser screens, with a new member, an established member, and a moderator in an isolated synthetic staging environment. The most compelling story is:

> A person arrives with a private, specific need. Meta AI helps them reflect and offers one small next step. The person decides whether an existing peer circle fits. When no circle fits, the setup copilot helps the person draft a bounded proposal; a human still decides whether it can open. In an existing circle, members contribute and moderators handle reports. Supportive roles require human review, and professional care remains a separate path.

This is more persuasive than claiming an autonomous AI community creator. The built product keeps the member as author and the human community/reviewer as decision maker. Show the actual join, posts, replies, proposal state, triage, and reviewer decision from the database.

## Corrected review of the two latest demo versions

The latest two runnable artifacts are `demos/cinematic/v1/index.html` and `demos/cinematic/v2/index.html`. They are standalone HTML storyboards with browser speech synthesis, not recordings of the current application. `demos/cinematic/README.md` correctly says that the UI is illustrative and makes no API calls.

| | V1 | V2 |
|---|---|---|
| Purpose | First interactive cinematic story treatment | Reviewed successor to V1 |
| Runtime | Chapter cues total 7:20, while the hero calls it 8 minutes | Correctly labels the runtime 7:20 |
| Improvements | Problem → sign-in → advice → match → community → proposal → moderation → technology | Keeps the same story; adds keyboard chapter navigation, screen-reader status, pause/stop states, reduced-motion support, and a persistent “illustrative, not a live product recording” label |
| Still out of date | Describes the old email one-time-code flow | Still describes an email code and verification; current `/connect` uses email/password, with email confirmation disabled |
| Authenticity limits | Synthetic response, members, posts, moderation, and decisions | Same; the voiceover nevertheless says “the circle is a real Supabase-backed community” while the visible post and reply are static and the page is explicitly standalone |
| Voiceover | Per-chapter browser speech, not a mastered voice track | Same; wording and delivery vary by installed browser voice |

Both versions are useful as storyboards and as a list of intended product beats. They should not be shown to judges as evidence that sign-in, model calls, member activity, or moderation happened. The next deliverable should be a screen recording of the running app, with an authored voiceover mixed over real captures. No new HTML version is needed for that.

## What the code actually supports

| Surface | Working capability | Meta AI and data boundary | Demo treatment |
|---|---|---|---|
| `/` homepage | Brand story and navigation to the member entrance | Illustrations and sample community scene are explicitly fictional | Use briefly for the problem/value setup, not as proof of live communities |
| `/connect` | Supabase email/password signup and sign-in; signup includes adult and Meta-processing checkboxes; shared demo-account button | The shared demo account is a persistent, shared production identity | Prefer a fresh synthetic staging account. Never create film activity on the shared production account |
| `/connect/member` adviser | Live `/api/advice`; returns validated reflection, steps, perspective, and zero to two candidate community matches. Matches stay hidden until the member asks to reveal them; join uses the live community route | Production config recorded in project notes is Muse Wonder first for advice, Muse Spark fallback. This route sends the submitted message and limited chat history to Meta. A deterministic phrase screen runs before the model for urgent language | Strongest first live AI scene. Let the actual response appear; exact text can vary. Show its model route accurately |
| `/communities` and `/communities/[id]` | Live community list and member-gated circle feed; join/leave, posts, replies, reactions, report, block, delete own post, featured journeys with permission, community guide, and appeals | Supabase Auth/Postgres; server routes enforce membership/ownership. A guide call uses the question plus approved community scope/public metadata, not the feed posts or private conversations | The strongest proof that Harmonise connects reflection to a real community. Use only synthetic staged content |
| `/communities/propose` | Authenticated member proposes a community; optional setup copilot compares against approved circles and drafts a structured scope package. Member can edit it before sending | Production config recorded in project notes is Muse Wonder first for setup, Muse Spark fallback. The AI gets proposal fields plus approved community metadata only after the user asks to draft | Show a specific missing niche, the editable output, and the resulting “Waiting for human review” state. It is a proposal, not a newly public group |
| Community helper / guide | Each community gets helper configuration; the member can ask a bounded, private guide question | Muse Spark/default text model. Scope-limited answer; it cannot publish, contact, invent rules, diagnose, or act as a moderator | Useful to show “AI for orientation, people for decisions,” after the main adviser and setup copilot |
| `/moderation` and decisions | Reviewer queue, assignments, reports, triage suggestions, human decisions with rationale, appeals, scope stewardship, proposal review, promotion review, and audit trail | Triage uses Muse Spark/default text model. It is advisory; a human decides and a different reviewer is required for an appeal. The worker processes one event per invocation; production schedule is daily, not continuous coverage | Use a designated staging reviewer and separate synthetic report. Do not suggest an always-staffed response or automated enforcement |
| `/profile` and Support Coaches | Member sees own contributions/notifications, exports their account, requests volunteer or verified-supporter review, and can delete their account after typed confirmation | Promotion is a human-reviewed request with written rationale. Verified supporter identity check is off-platform | Show a returning member's journey/application, then moderator decision if staging reviewer is prepared. Do not execute account deletion during the take |
| `/app` “My Space” and story | Separate fictional scenario UI: live Meta chat and optional Voice Transcribe, editable understanding, sessions (persisted when signed in), life chapters, sample experiences, sample profiles, connection requests, mock moderation controls, help path | Chat is Muse Spark. Voice uses Muse Voice Transcribe 1.0 only after explicit “Transcribe with Meta”; transcript is editable before sending. Many community/person/moderation actions here are browser/session examples, not real member actions | Treat as a separately labeled prototype appendix. It has valuable interaction concepts, but don't present its fictional community, person profiles, questions, moderator, or decisions as live |
| Professional-care pathway | Preview copy only | No clinician directory, credential check, referral, booking, payment, or therapist messaging exists | Say plainly that qualified care is not currently integrated. The shipped product is peer support/navigation, not therapy |
| `/ops` | Operational aggregate metrics and readiness surfaces, restricted to operators | Metadata such as funnel counts, latency, token use/errors; not a user-facing impact study | Optional technical appendix only; avoid private/user-level data |

### Meta AI inventory

- **Private adviser (`/api/advice`):** Muse Wonder → Muse Spark fallback for structured reflection, steps, perspective, and optional candidate matches. The candidate IDs are constrained to approved circles; the live names/counts come from the database. A deterministic urgent-language screen can short-circuit the call.
- **Proposal setup (`/api/communities/propose/assist`):** Muse Wonder → Muse Spark fallback for an editable community scope and fit assessment. The output can distinguish an existing fit, a distinct proposal, or a human-review case. It cannot approve or publish.
- **Prototype chat (`/api/chat`):** Muse Spark/default text model; separate from the live `/connect` adviser and embedded in the fictional `/app` scenario.
- **Scoped community guide (`/api/communities/[id]/guide`):** Muse Spark/default text model. The question and approved scope/public details go to Meta; posts/replies are not guide context.
- **Moderation triage and worker:** Muse Spark/default text model. A report or eligible event is triaged for human attention; the model never hides, bans, publishes, contacts, or decides an appeal.
- **Scope stewardship (`/api/communities/[id]/scope-proposals`):** Muse Spark/default text model after an active moderator selects an excerpt and sees the transfer notice. Raw excerpt is not persisted in the resulting proposal; a person must approve any scope change or private split proposal.
- **Voice (`/api/voice/transcribe`):** Muse Voice Transcribe 1.0. The user deliberately submits an audio recording, reviews/edits the transcript, then chooses whether to put that text into chat. This is the `/app` prototype path, not `/connect` adviser voice chat.
- **Not a live feature:** the facilitator route/worker is disabled by default. Do not claim that a bot watches or responds to unanswered posts.

The code sends model calls from server routes to Meta's API with a server-only key, input/response validation, timeouts, rate limits, and route-level telemetry. For advice/setup, the actual model may fall back; narrate the configured route, and don't claim a specific response came from Wonder unless the request metadata proves that. No outcome/efficacy study or causal impact metric was found in this source review. Describe the impact as the product's aim, not a measured result.

## Critical blockers before filming real screens

1. **Wrong model disclosure in the live adviser.** `src/components/connect/adviser.tsx` says “Meta Muse Spark,” while production advice is configured Wonder-first with Spark fallback. Correct the point-of-use text before filming and explain that fallback can change which model serves a request.
2. **Unsupported retention copy.** `src/components/connect/onboarding.tsx` says `/connect` conversations are stored for the member and expire after 90 days. The `/connect` adviser stores exchanges in component state; it does not call the private-session API. The separate `/app` session table has a 90-day `expires_at` default, but the reviewed session list/write paths do not enforce or refresh expiry and no cleanup job was found. Do not claim 90-day deletion until implemented and verified; align the disclosure first.
3. **Signup consent is not recorded by its API.** The create-account UI requires the adult and Meta-processing checkboxes, but `/api/auth/password` sends email/password to Supabase and calls `ensureProfile`; it does not persist those checkbox choices. Do not describe this as a durable consent record.
4. **“Alias mode” isn't user-controlled yet.** `/connect` derives the displayed name/alias from the email local-part. There is no first-use alias picker in that path. For real community footage, this risks exposing a chosen email name as the public alias. Add a user-selected alias step, or use a purpose-made synthetic email handle and disclose this limit before filming.
5. **Misleading shell badge.** The authenticated persisted member/community UI still labels itself “Prototype.” Resolve the product label before asking judges to trust the live screens.
6. **No complete staging fixture set.** `supabase/seed.sql` only inserts the three approved community records. It does not provide member activity, replies, reports, reviewer outcomes, or supporter requests. The existing test seeder provisions test identities/memberships for automation; it is not a complete demo-content seed pack.
7. **Production reviewer readiness.** Project notes say the production reviewer allowlist is unset and the moderation worker runs daily, one event per invocation. Use staging for a human decision/appeal scene; don't imply production has rapid or continuous staffed coverage.
8. **No therapist/peer contact feature.** There is no public member profile directory or direct message to a volunteer. The clinical pathway is preview-only; don't stage a “reach out to therapist” or “open volunteer profile” as though it works.

The connected Supabase project has no development branches. A staging branch was quoted at **$0.01344/hour** while active; no branch has been created. The earlier cost approval question is still unanswered, so there have been no staging or production data writes.

## Recommended real-app narrative (12–15 minutes)

Use real browser capture of the deployed/preview application with three staged roles and a separate clean browser profile for each role. Narrate over the actual response; keep slow screens, scrolling, and result holds. Show only fixture-tagged content.

### Chapter 1 — Why a different kind of support (0:00–0:50)

**Picture:** Actual homepage. Pause on its private-first promise. State that the sample community artwork is illustrative.
**Narration:** “When a personal decision is tangled in pressure, a person can be surrounded by advice and still feel alone. Harmonise starts with a private reflection, lets the person choose whether a peer circle helps, and keeps the consequential decisions with people.”

### Chapter 2 — A real member enters (0:50–1:45)

**Picture:** On staging, create a synthetic email/password account, show the current adult/AI disclosure, then the actual member shell. Show the chosen alias before any public post.
**Narration:** “This is the live member path: email and password, then a community identity the member controls. Email confirmation is disabled in this environment, so this address is only a sign-in identifier.”
**Gate:** First fix or route around the alias, consent-record, retention-copy, and Prototype-badge issues above. Never show the shared production demo account during write actions.

### Chapter 3 — Private reflection, live Meta response (1:45–3:30)

**Prompt:** “My family keeps pressuring me about a relationship decision. I want time to understand what I want, and one small step I can try this week.”
**Picture:** Type the prompt, submit once, let the real thinking/result states complete, hold the reflection, steps, and perspective. Show the Meta disclosure and accurate route provenance. Do not splice in a prepared answer.
**Narration:** “The request goes from the server-side advice route to Meta. In production, Muse Wonder is tried first and Muse Spark is the fallback. The response may vary. The model offers a reflection and small options; it does not make the relationship decision.”

### Chapter 4 — Choose an existing peer circle (3:30–5:00)

**Picture:** Leave matches hidden during advice. Click the explicit reveal control. Review a live database-backed match and its reason. Join one staged circle as the member's chosen alias; open the real feed with its member-only marker.
**Narration:** “No circle is shown until the member asks. The adviser can suggest only approved community IDs; actual community details come from Supabase. Joining is a separate member choice.”

### Chapter 5 — Find the missing niche, draft a safe proposal (5:00–7:15)

**Use case to preflight in staging:** “Adults coordinating support for an aging parent across siblings and different cities.” Scope the space to lived experience, communication, and routines; explicitly exclude medical/legal advice and clinical services. Run the actual setup copilot against the three approved communities and retain its real fit result. If it says an existing group fits, show that honestly or choose a genuinely distinct niche after testing; never dictate a made-up model classification.
**Picture:** Go to Suggest a community; enter name/purpose/topics; click Draft with Meta; show fit assessment and editable scope (in/out-of-scope topics, norms, welcome message and prompts); edit one line; submit. Hold “Waiting for human review.”
**Narration:** “When no approved space covers the need, the setup copilot can help the member shape a bounded proposal. It compares existing public community details and drafts an editable scope. This does not create a live group on the spot: the proposal is private until a human reviews purpose and coverage.”

### Chapter 6 — An established member supports peers (7:15–8:45)

**Picture:** Switch to a second synthetic member with staged contributions, show a post/reply/reaction, then the private contribution summary and a volunteer application. Use a moderator-approved volunteer fixture only if its status is real and its review rationale is visible.
**Narration:** “A returning member's visible contributions can support an application to volunteer. Activity isn't expertise, and a model doesn't grant trust. A moderator reviews the application and records a rationale. Harmonise currently has no public volunteer roster, direct messages, paid coaching, or booking.”

### Chapter 7 — The community guide stays in scope (8:45–9:40)

**Picture:** Ask one short question in an approved staged circle; show the scope notice and answer.
**Narration:** “The circle's AI guide answers from approved scope and public circle details, not member posts or private conversation. It can say a question is outside scope; it cannot contact the group or make a decision.”

### Chapter 8 — AI suggestion, human moderation, appeal (9:40–11:45)

**Picture:** Submit a report on a designated synthetic post; show advisory triage in the reviewer queue, then a human's separate decision and rationale. Switch back to the reporter role and show the appeal path; use a second reviewer for the appeal. Show audit trail briefly.
**Narration:** “Muse Spark can add a triage signal to help a human prioritize a report. It does not hide content or decide an outcome. A reviewer records a decision; an appeal is handled separately. This demo uses a staged reviewer. In production, moderation is not continuous monitoring and the scheduled worker is daily.”

### Chapter 9 — Boundaries, account controls, close (11:45–13:00, extend to 15:00 if useful)

**Picture:** Show the actual member notifications/export controls and supporter-status page. Open the professional-care preview and state what does not exist. If showing the fictional `/app` story or Voice Transcribe, label it clearly and keep it as a separate prototype appendix. Close with a route map.
**Narration:** “Members can see their contribution history, notifications, and data controls. The supporter pathway is peer support, not clinical care. Harmonise does not yet connect people to therapists or enable direct contact with volunteers. Across the product, Meta helps reflect, draft, orient, transcribe, and triage; people choose, review, publish, and decide. Our aim is to make the next step easier without taking ownership of it away.”

## Staging content required

1. Dedicated staging project/branch with migrations matching the commit and a reset procedure. Use an environment guard that refuses all non-staging project refs. No production seed writes.
2. Three synthetic Auth accounts: new member, established contributing member, and assigned reviewer/moderator. Do not share credentials on screen; sign-in with purpose-made synthetic values.
3. Apply existing community seed; add a few obvious fixture-tagged memberships/posts/replies to the target circle and at least one alternate circle. Keep the feed visually active but not theatrical; no fabricated testimonials or outcomes.
4. A distinct pending proposal, one separate report + triage event, one separately reviewed decision + appeal, and a volunteer request with a real staged human rationale. Reset between takes.
5. Preserve a no-write “practice” take and a write-enabled staging take. Use idempotent seed/reset scripts and capture branch ref/commit/fixture version in the recording notes. `scripts/seed-test-users.mjs` is not sufficient for content and must not be run without its dedicated test variables and exact project confirmation.
6. If the team doesn't approve the staging hourly cost, record only read-only production pages or wait; don't turn the shared production account into a fixture.

## Recording and review standard

- Capture the running app at 1920×1080/30fps in a clean browser profile; use 110–125% zoom and crop to the active panel.
- Keep the cursor still during narration; pause 1–2 seconds after actions and 2–3 seconds on live AI/community states. Let the real model latency show; use a brief chapter bridge if it takes time.
- Record human narration separately with room tone; captions must match the approved script. Audition the full export on headphones and speakers.
- Check every spoken product claim against the observed UI and actual state, including which model responded, whether data persisted, and who can see each record.
- Cold-review for clarity, persuasion, technical proof, accessibility/readability, emotional arc, and trust. No sensitive production content or secrets in the frame.
