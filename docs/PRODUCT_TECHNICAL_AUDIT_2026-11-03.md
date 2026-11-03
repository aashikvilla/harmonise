# Product, design, integration and Meta audit

Reviewed 3 November 2026 against baseline `7207d5b`. This is a living execution backlog. Source findings, browser observations and hypotheses have different evidence levels. Three parallel agents reviewed visitor UX, community operations and model integration. Their browser runs were interrupted by the agent usage limit. Their source findings were checked in the primary session. This document does not claim exhaustive live coverage.

## Release and evidence

- The earlier cron deployment failure came from `*/5 * * * *` on Vercel Hobby. The fixed daily schedule passed GitHub verification and Vercel preview, and PR #5 was merged. Latest observed production deployment `dpl_BpYBJbZMEcNAQpuzvwQJLasGbN9t` is READY for `7207d5b`.
- The production migration ledger contains engagement/reviewer migrations `20261102204240` and `20261102204243` (the repository's `0005` and `0006` changes). Live tables, archive status and reviewer-note column are present.
- Isolated production build (including TypeScript) and lint passed. Targeted desktop/mobile journeys passed 10/10 after fixing navigation waits and an outdated audit-trail expectation. The full 102-case run passed 73, skipped 26 and failed three. The failures exposed an unstubbed live directory dependency and a keyboard setup race. After correcting the fixtures/setup, all four affected desktop/mobile cases passed on rerun. The original moving-checkout run was interrupted and is excluded from release evidence.
- Production authorization review found direct `anon` and `authenticated` grants on the new engagement tables. A follow-up migration `20261103164619` revoked those grants and removed the unused direct-API policies. SQL privilege checks now return false for both API roles and true for `service_role`; the app routes use only the server-side service-role client. No production rows were added, changed or deleted.
- Six synthetic provider requests were made against production: benign triage and silent-audio transcription passed; Muse Spark chat and advice each returned HTTP 504, then returned HTTP 504 again on one retry. Initial/retry timings were about 14.1s/0.8s for chat and 13.1s/0.9s for advice. App request IDs were `9278b520-be2a-48f5-983a-a568dcb06dbe`, `be3fe39d-10ae-41d8-a6b4-71f429fbf4d9`, `317d361a-d46b-4e42-98cf-de81606422c6`, and `56163846-2588-4c28-a2cd-96b0c1dc7ab9`. The route preserves upstream 5xx statuses, while its own timeout/network errors map to 503, so these 504s indicate the Meta endpoint returned an upstream 504. The upstream error body was not recorded; the Hobby runtime-log query could not provide provider diagnostics. The cause is localized to the Meta request path, with the exact provider failure reason still unknown.
- No production community/auth data was mutated. Authenticated live feature behavior, direct JWT API denial requests, real email delivery, provider quality and concurrent writes remain verification gaps.
- Preview readiness previously reported missing database/model configuration. A green preview cannot establish production integration correctness.

## Fixes in this review

| ID | Defect and effect | Change | Verification still needed |
|---|---|---|---|
| F1 | Reaction GET used service-role queries on an arbitrary post ID after merely authenticating the caller. A nonmember could obtain private post reaction counts. `src/app/api/communities/[id]/posts/[postId]/reactions/route.ts` | Check community read access, post/community binding, visibility and blocked authors before returning a summary. | Live two-account cross-community and held/removed/blocked cases. |
| F2 | Archive/revive could set a pending/rejected community to approved through the moderator endpoint. `src/lib/db/community.ts`, `setCommunityArchived` | Restrict archive to approved rows and revival to archived rows in the update predicate. | Assert failed transitions return an explicit conflict and leave rows unchanged. |
| F3 | A 500 JSON body on Ops rendered as zero metrics. Network errors could leave previous metrics visible. `src/app/ops/page.tsx`, `load` | Clear old results before fetching and reject unsuccessful HTTP status codes. | Delayed-response ordering, malformed success body and partial database failure rendering. |
| F4 | Facilitator creates a random profile ID whose FK requires an Auth user. Alias lookup can adopt a human member as the bot. `src/lib/db/community.ts`, `ensureFacilitatorMembership`; core migration profile FK | Remove facilitator cron and default its route to disabled through `COMMUNITY_FACILITATOR_ENABLED`. | Trusted bot identity, explicit Meta transfer consent, concurrency/idempotence, human review and successful synthetic journey before enabling. |
| F5 | Supabase granted `anon` and `authenticated` full privileges on reactions/promotions. The reaction SELECT policy included hidden posts in public circles, and the INSERT policy did not bind the member's circle to the post. | Production check confirmed the grants. The app uses server-only `service_role`, so migration `20261103164619` revoked direct grants and dropped the unused policies. Post-migration privilege checks show no `anon`/`authenticated` access and retained `service_role` access. | Exercise anonymous and member JWT requests through PostgREST and verify denial; exercise matching server routes with dedicated accounts. |

## Elephant view — product coherence and operating model

| Priority / ID | Specific gap and likely user/judge reaction | Evidence | Next action and completion condition |
|---|---|---|---|
| P0 / E1 | The fictional adviser and real community account remain separate. A visitor may expect demo joins and chat history to carry over. | Architecture notes, `/connect` local state and Supabase-backed `/communities`. | Show one clear transition with an explicit save/sign-in decision. Test visitor to real member without silently importing private text. |
| P0 / E2 | Daily triage processes one item, allowing a queue with several reports to accumulate for days. | `/api/moderation/process` calls `processNextEvent` once. | Define staffed hours and a queue-age objective. Add bounded draining, recovery and alerts on a supported scheduler. Demonstrate backlog recovery under provider failure. |
| P0 / E3 | No named coverage, escalation owner or configured launch reviewer is established in project knowledge. | Architecture and release journals. | Assign real owners and rehearse report → human decision → appeal → receipt. Publish only response expectations backed by operation. |
| P1 / E4 | Ask copy promises members usually reply within a day without measured cohort evidence. | `real-community-detail.tsx`, composer expectation copy. | Use measured response data or factual availability wording. Show the AI facilitator's current availability accurately after F4. |
| P1 / E5 | Progress, trusted, volunteer and verified roles can feel like an expertise score in a sensitive peer-support product. | Profile ladder and contribution rules. | Separate activity from reviewed responsibilities visually and in copy. Require role scope, expiry and evidence. Test interpretation with users. |
| P1 / E6 | Several surfaces compete for the core story: chat, circles, Connect, profile, private guide and scope tools. | App route inventory. | Prioritize one first-use path and place moderator tools behind role navigation. Measure steps to first useful interaction. |
| P1 / E7 | Shared demo credentials and source fixtures can make a judge confuse prototype success with persistence. | Demo onboarding and architecture. | Provide a visible demo badge and a separate prepared live test account walkthrough. Label every fixture and show persisted state after reload. |

## Goldfish view — detailed user journeys and integration seams

| Priority / ID | Specific gap | Evidence / confidence | Action and acceptance scenario |
|---|---|---|---|
| P0 / G1 | Promotion decision and role grant are separate writes. Failure can approve a request without granting the role, and simultaneous decisions can overwrite each other. | Source, `decidePromotionRequest`. | Service-only transaction with moderator checks and compare-and-set on open status. Two concurrent opposite decisions produce one consistent outcome. |
| P0 / G2 | Direct PostgREST access is now closed for reactions/promotions, but grant revocation has only been verified through Postgres privileges, not member/anonymous JWT requests. | Production `has_table_privilege` checks return false for `anon` and `authenticated`; server `service_role` remains granted. | Add a staging JWT matrix: direct table GET/POST/PATCH/DELETE must fail, while authorized server routes succeed and deny outsider, cross-community and hidden-post access. |
| P1 / G3 | Profile converts auth errors, database failures and network failures to empty membership/notification arrays. | Source, `profile/page.tsx`, `getJson`. | Explicit signed-out, loading, error, empty and success states with retry. An injected 500 must show an error, while a valid empty response shows no circles. |
| P1 / G4 | Notification seen cursor is shared across accounts and advances even when fetching fails. | Source, `harmonise-notif-seen`. | Scope cursor by verified user ID and advance only after successful display. Switch accounts and simulate failed fetch without losing unread items. |
| P1 / G5 | Archive update has a guarded predicate after F2 but a no-match response still needs a distinct conflict result. | Source, PATCH community route. | Return 409 for invalid transition. Replay archive/revive and attempt pending/rejected revival. |
| P1 / G6 | Reaction toggle is a read followed by a write, so concurrent clicks/retries can produce surprising toggle state. | Source, `toggleReaction`. | Prefer desired state PUT/DELETE with a unique DB key. Repeated identical requests retain the requested state. |
| P1 / G7 | Held/removed posts, blocked authors and archived circles need consistent reaction/write policy across read and mutation endpoints. | Source paths differ between toggle and read. | One authorization matrix for owner/member/moderator/outsider. Assert status and database effects for each combination. |
| P1 / G8 | Decline status and reviewer note use separate writes with a swallowed note failure. | Source, `declinePendingCommunity`. | Store decision and note atomically. Simulated DB failure must leave the proposal pending or return a recoverable failed decision. |
| P1 / G9 | Profile enrichment issues per-membership and per-post requests. Some counts use fixed 25/100 row limits. | Source, `getMyContributions` and notifications. | Batch aggregates in SQL and paginate lists. Verify counts and latency with 100+ contributions and multiple circles. |
| P1 / G10 | Preview and production differ in backend configuration. | Readiness evidence in saved-chat release journal. | Dedicated staging project with synthetic accounts and equivalent flags. Readiness should explain which flows are usable. |
| P1 / G11 | Ops queue/funnel failures become null while total counters can appear valid. | Source, `/api/ops/metrics`. | Display partial-data status and capture timestamp. Simulate DB outage without showing a healthy empty queue. |
| P1 / G12 | OTP email delivery, expired code, resend throttling, refresh and multi-tab sign-out need live evidence. | Credential-gated coverage in historical journals. | Dedicated inboxes and accounts. Verify recovery without exposing credentials or creating duplicate membership. |
| P1 / G13 | Hardcoded demo and real communities need a single understandable recommendation handoff. | Existing live-circle recommendations and labeled sample grid. | Test no-match, one match, many matches, rejected proposals and empty directory. Keep the confirmed reason visible into joining. |
| P2 / G14 | Feed uses a bounded latest window; older useful conversations may be difficult to find. | Source, `listPosts` limit 50 and replies limit 100. | Cursor pagination and visible older-content affordance. Test more than 50 posts and 100 replies. |
| P2 / G15 | Global process counters and memory rate limits can differ across server instances. | Architecture and Ops implementation. | Shared bounded metrics/rate-limit store before public scaling. Verify quotas across two instances. |
| P1 / G16 | Archived circles are described as readable, but `checkPostsAccess` rejects every launch status except approved, including archived. | Source, `community.ts`, `checkPostsAccess`, called by posts GET. | Separate read permission from write permission. Active members can read archived feeds and prior replies, while post/reply/reaction mutations remain forbidden. |
| P1 / G17 | Live circle recommendations use the hardcoded `COMMUNITY_THEMES[id]` map, so newly approved communities have no overlap and disappear from recommendations regardless of their approved topics. | Source, `CircleRecommendation` in `harmonise-experience.tsx`. | Derive normalized themes from approved scope metadata. Test a newly approved community, unknown themes, zero members and tied scores. |
| P0 / G18 | Production Muse Spark chat and advice both return HTTP 504 on repeated synthetic calls, so a person cannot get the expected AI response. | Four production attempts: chat 504 twice, advice 504 twice. Initial responses carried application request IDs and took 13–14s; retries took under 1s. Chat returned a friendly failure message, kept the text in the composer and exposed Retry. | Obtain upstream diagnostics for the recorded request IDs or repeat in staging with provider request metadata. Require successful chat/advice, bounded latency and no duplicate turn before closing. |

## Design, accessibility and emotional friction

These items require fresh visual/manual validation. They are review hypotheses unless a source reference is supplied.

| Priority / ID | User experience to inspect | Specific acceptance criterion |
|---|---|---|
| P1 / D1 | Error states resemble empty states on profile and some operational views. | Every loading/error/empty/success state has distinct copy, action and announcement. Preserve entered text on retry. |
| P1 / D2 | Ask/Share, permission review, featuring consent and AI transfer notices create several decisions near composition. | Group purpose, audience and exact text in one readable review. Explain the transfer before sending to Meta. Verify revocation remains discoverable. |
| P1 / D3 | Longer forms and moderation queues may overload mobile screens. | Keyboard-only and 390px flows preserve focus, labels, errors and 44px targets. Sticky elements must not hide the focused control. |
| P1 / D4 | New profile/Ops/queues need a visual comparison to the Motion Revival homepage. | Check milk/plum/coral palette, serif hierarchy, wordmark/loop geometry, whitespace and calm tone in screenshots of all states. Record actual contrast ratios. |
| P1 / D5 | Voice permission, recording, stop, review, cancel and retry can become ambiguous. | Clear recording state, editable transcript, no automatic send, accessible permission recovery and reduced-motion behavior. |
| P2 / D6 | Long dashboards expose implementation concepts to members. | Members see their next useful action. Secrets, worker terms and queue diagnostics belong in operator surfaces. |
| P2 / D7 | Motion can delay first interaction and produce discomfort. | All entrance/reveal paths remain readable with reduced motion, keyboard navigation and slow devices. |
| P2 / D8 | Role badges can crowd alias/content and imply clinical authority. | Clearly readable role scope and AI label, without badge volume dominating the discussion. Test with a screen reader. |

## Meta integration and hackathon judging

| Integration | Implemented evidence | Claim supported today | Missing proof / next experiment |
|---|---|---|---|
| Spark | `meta-model.ts` defaults text to `muse-spark-1.3`, uses Chat Completions, minimal reasoning, 30s timeout and token/latency parsing. Chat, adviser, triage, setup and guide call server routes. | Production benign triage passed. Chat and advice returned repeatable upstream 504s in four attempts. Setup/guide have implementation but no current live success evidence. | Diagnose the provider 504s; then measure each flow with a per-flow quality rubric, sensitive-content/prompt-injection cases, p50/p95 latency, token cost and failure rate. |
| Wonder | `configuredSetupModel` allowlists `muse-wonder-1.0` for controlled non-production setup evaluation and rejects it in production. | A controlled model switch exists. | A successful Wonder completion and paired Spark/Wonder comparison are unverified. Avoid claiming Wonder-powered production behavior. |
| Voice | `/api/voice/transcribe` uses `muse-voice-transcribe-1.0`, WAV push-to-talk and 45s timeout. | Reviewed speech input has implementation and historical synthetic smoke. | Accents, background noise, corrections, multilingual samples, real microphone mobile behavior and cancellation. |
| Community guide | Private member question with approved scope/public metadata. | Scope-aware private assistance is implemented. | Verify scope grounding and refusal with adversarial synthetic questions. Display relevant scope boundaries without reading private peer posts. |
| Scope stewardship | Moderator-selected excerpt, structured proposal and human approval/rollback. | A distinctive human-governed agent workflow exists. | End-to-end demonstration of recommendation → human edit → versioned apply → rollback → split pending launch, with audit evidence. |
| Facilitator | Source implements unanswered Ask replies but identity provisioning is defective. | Experimental code only, default disabled in this review. | Provisioned bot identity, consent, duplicate protection, pending human reply race and report/removal flow. |

Judge-facing priority should be a coherent three-minute demonstration of a corrected understanding, an editable scoped recommendation and a human-governed scope change with rollback. Show the actual model ID, synthetic input, validated output, latency and token use. Breadth alone does not establish the value of each model.

High-value experiments, pending product choice and evaluation

1. Compare Spark and Wonder on the same synthetic setup/scope cases, with blind human ratings for specificity, fit, safety and edit effort. Adopt Wonder only where the measured improvement justifies latency/cost.
2. Demonstrate the host correcting an AI-drafted boundary and show that later private-guide answers use the approved version.
3. Use voice as an accessibility entry point, then show correction and explicit review before any community contribution.
4. Add a small operator evaluation view with aggregate quality, failure and cost evidence. Keep private narratives out of evaluation artifacts.

## Execution order and scenario ledger

1. Release safeguards F1–F4, then prove private-data isolation and invalid lifecycle transitions with dedicated member/moderator accounts.
2. Make promotions and decline notes transactional. Fix profile state/cursor handling and Ops partial-data rendering.
3. Establish isolated staging, live Auth accounts, test community and synthetic provider cases. Record cleanup IDs and test outcomes.
4. Complete the core member journey, keyboard/mobile visual review and failure recovery before adding new model surfaces.
5. Run paired model evaluation and prepare the evidence-backed judge walkthrough.

| Journey | Required variants | Current evidence / gap |
|---|---|---|
| Visitor/demo | first visit, one-tap/manual entry, refresh, saved chat, offline retry | Current isolated full-suite coverage plus passing targeted reruns. Live persistence remains separate. |
| Auth | OTP success/expiry/wrong code/resend/rate-limit/refresh/sign-out | Existing code and fixture tests; live mailbox verification pending. |
| Proposal | validation, setup failure, edit/confirm, pending owner/outsider, approve/decline | Local fixture proposal/approval journeys passed desktop and mobile. Live authorization remains pending. |
| Member | join/leave/rejoin, private feed, Ask/Share, edit review, reply/report/block | Existing live tests gated by credentials; current multi-account live run pending. |
| Engagement | react/unreact/retry, feature/revoke, deleted/held/blocked posts | Source review identifies authorization gaps; post-fix live matrix pending. |
| Moderator | outsider denial, assignment, report decision, conflict appeal, export, archive/revive | Source review and historic tests; concurrency and direct Data API checks pending. |
| Roles | request/duplicate/decline/approve/self-review/concurrent decision/failed grant | Transaction gap confirmed in source; real scenario pending. |
| Provider | success/timeout/429/malformed output/empty output/injection/voice cancel | Current production smoke: triage and silent WAV transcription passed; chat and advice returned 504 twice each. Synthetic only, no user data. Staging quality and recovery matrix pending. |
| Data lifecycle | export, delete, expired session, revoked consent, account switching | Existing handlers; full retained-data and deletion audit pending. |
| Operations | unavailable DB, missing config, quota, kill switch, backlog, retry/dead queue | READY production observed; scheduled execution and recovery proof pending. |

Each execution item should record exact commit, viewport/account role, synthetic fixture IDs, input, visible outcome, API status, database effect, cleanup and artifact path. A passing fixture UI test cannot close the corresponding live authorization or provider-quality item.
