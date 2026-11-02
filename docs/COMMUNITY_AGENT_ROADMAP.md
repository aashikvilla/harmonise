# Community Agents: Product and Delivery Roadmap

**Status:** Implemented on local `develop` through the first moderator-reviewed release slice; Supabase migrations and browser verification remain pending.  
**Updated:** 2026-11-03  
**Related:** [Meta model and journey audit](./META_MODELS_AND_JOURNEY_AUDIT.md), [end-to-end journey and gaps](./END_TO_END_JOURNEY_AND_GAPS.md), [data privacy design](./DATA_PRIVACY_DESIGN.md).

## Implementation state

- Added the proposal setup copilot, editable host-reviewed scope draft, and atomic storage with pending community creation.
- Added an active-member-only private AI guide grounded in the approved scope package and public community details.
- Added moderator-selected excerpt scope recommendations, versioned approval/rollback, and explicit split acceptance that creates a private pending proposal without memberships or notifications.
- Muse Spark remains the default. Muse Wonder is available only through the server-side setup-model switch for controlled non-production evaluation; no Wonder comparison has been run yet.
- Automatic delegated scope changes are disabled. No timeout approves a scope change or launches a community.
- The two scope migrations are applied to the live Supabase project in order. Existing community scope stewardship requires an active moderator; split proposals still need the existing allowlisted launch reviewer and coverage confirmation before launch.
- Typecheck, lint, and production build passed per feature branch. No automated or browser tests were run in this implementation pass.

## Product goal

Give each community an AI guide that understands that community's approved purpose and boundaries. Help a community become more useful as adjacent needs emerge. When a need is too different, help its members propose a separate community with its own scope and guide.

“Self-healing” means **scope stewardship**: detect a possible mismatch, recommend a bounded change or a new community, and recover safely from a bad or unavailable agent. It does not mean the model changes its own policy, moderates members, or expands its remit without authorization.

## Current baseline

- Live communities have a private, per-community helper configuration with purpose and topics.
- Muse Spark 1.3 performs structured advisory triage for queued live-community reports and flags.
- The helper does not currently answer member questions, welcome people, or publish posts.
- New proposals are private and `pending_review`; launch approval requires an allowlisted human reviewer and human-coverage attestation.
- The moderation worker has no scheduled caller and no named on-duty reviewer is configured. The plan must not suggest that an AI helper provides live monitoring or human response coverage.

These are current boundaries from `docs/project-knowledge/ARCHITECTURE.md` and the existing community-lifecycle decision in `docs/project-knowledge/DECISIONS.md`.

## Product design

### 1. A community has a versioned scope

Store a reviewable scope package for each community:

- Purpose and intended audience, stated without promising safety or outcomes
- Topics included, adjacent topics, and topics outside the scope
- Community norms and escalation limits
- Approved reference material and its owner/review date
- Allowed agent tasks and tools
- Scope version, author, reviewer/delegation mode, effective date, and rollback target

Keep a global safety policy above community-specific instructions. A community scope may narrow the agent's role but must not override the global policy. Every request and data/tool access is authorized in application code for the signed-in user and community; prompt instructions alone are not an access boundary.

### 2. Community setup copilot

During proposal creation, the host can ask the model to draft a community package: purpose, in/out scope, topics, norms, welcome text, starter prompts, moderation boundaries, and synthetic examples for checking scope. It can compare the proposal with existing **public community metadata** and explain whether it appears adjacent to an existing community or distinct enough to propose separately.

The host edits the draft. It remains private and pending until the existing launch review and coverage requirements are satisfied. The agent must not import private chat, create public membership, auto-approve a host, or describe the community as guaranteed safe.

### 3. Member-facing guide

After launch, an explicit “Ask this community's guide” action can answer questions from approved community material, clarify norms, and help a member edit a post before they share it. It should:

- Clearly identify itself as AI, separate from peers and human moderators.
- Answer only within the current community scope and cite/link the approved source it used.
- Say when its approved material does not answer the question; do not fill gaps with invented policy.
- Keep draft help private. Never publish, reply, contact a member, or transfer private chat into a community.
- Preserve review and exact-text confirmation before a member shares anything.

### 4. Scope stewardship (“self-healing”)

The agent can identify a potential adjacent need and prepare one of three recommendations:

1. **Clarify:** improve wording or tags without changing the actual remit.
2. **Expand within a delegated boundary:** propose adding a pre-authorized adjacent topic and updating the description, approved resources, and guide instructions together.
3. **Split:** prepare a private proposal for a distinct community, including its scope package and a human-review request. Do not move users, posts, history, or memberships into it.

When uncertain or when the request is outside policy, the agent should leave the current scope unchanged and ask a human to review. A recommendation should explain the evidence category, proposed change, affected conversations, and why a split may be better. It should not label individual members, infer their mental state, or use sensitive disclosures as a growth signal.

Use moderator-selected examples or consented member feedback first. Do not send all community posts or private messages to Meta to discover emerging topics by default. If any member content is sent to a model for a scope review, disclose that transfer and its purpose before the content is submitted, minimize the selected content, and record the scope-review event without storing model chain-of-thought.

## Approval and the 30-minute proposal

**Recommendation:** a 30-minute timeout must not auto-launch a new community. Silence cannot establish that a distinct community is staffed, reviewed, or ready for members. This matches today's pending-review and coverage-attestation design. If a reviewer does not respond, keep the proposal private, notify the host that it is still pending, and escalate or remind the configured reviewer.

Scope changes can have a bounded opt-in delegation mode:

| Change | Default | Optional delegation |
|---|---|---|
| Typo, wording, or tags that do not change the meaning | Auto-fix with version history and notice | Same |
| Adjacent topic already named in a human-approved expansion envelope | Human review by default | Owner/moderator may enable auto-apply for this class, with notice, audit record, and rollback |
| New topic that changes member expectations, norms, sources, or moderation boundaries | Active human review; notify existing members | No timeout-based auto-apply. Require explicit authorization and a member-notice/feedback window defined by the community's governance policy |
| New or materially distinct community | Existing human launch review and confirmed human coverage | Never auto-launch due to silence or model output |
| Enforcement, crisis response, bans, contacting members, or publishing on a member's behalf | Human-controlled / out of agent scope | Not delegable to the agent |

The 30-minute mark can trigger a reminder, raise a queued review, or expire a draft. If a community later opts into delegated low-risk scope stewardship, the opt-in itself is the advance authorization for that narrow class; silence is not being treated as consent. Every applied change needs a visible version diff, actor/authorization record, member notice, and rollback path. Significant scope changes should offer a way for members to raise concerns before or after the change, according to an agreed governance policy.

“Safe space” should be used carefully. The product can say that a community has a clearly scoped AI guide and human-reviewed rules; it must not imply the agent guarantees safety, confidentiality, continuous monitoring, or a human response.

## Model roles to evaluate

| Model | Proposed job | Gate |
|---|---|---|
| Muse Spark 1.3 Standard | Existing chat and triage; likely default for short guide answers and structured routine tasks. | Keep outputs schema-constrained, validate against current scope, and measure grounding, refusal, latency, and cost. |
| Muse Wonder (`muse-wonder-1.0`) | Candidate for a multi-part community setup package or a difficult scope review that must reconcile a long, approved set of policies and resources. | Compare directly with Spark on the same synthetic cases. Use it only if it materially improves scope consistency/completeness enough to justify latency and cost. Do not infer moderation safety from general capability. |
| Muse Voice Transcribe 1.0 | No change proposed; keep reviewed file transcription. | Realtime transcription changes the audio-transfer moment and needs a separate consent/accessibility decision. |

Meta describes Wonder for complex, long-horizon agentic work and Spark for higher-volume, latency- or cost-sensitive workloads such as classification. This is a hypothesis for routing, not a product-quality guarantee. See [Meta's model guide](https://dev.meta.ai/docs/models), [structured output](https://dev.meta.ai/docs/structured-output), and [tool calling](https://dev.meta.ai/docs/tool-calling).

## Delivery sequence

### Phase 0 — Agree on policy and data boundaries

- Define what counts as cosmetic, adjacent, material, or distinct scope change.
- Decide who can approve or delegate: host, community moderator, reviewer, or member input.
- Specify the member notice/feedback process and whether a community can opt into auto-application of pre-authorized adjacent topics.
- Define permitted inputs for scope analysis and the point-of-use Meta disclosure.
- Confirm a real reviewer and human coverage before any proposed community can launch.

**Exit:** written scope-change policy, data-flow update, and approval matrix.

### Phase 1 — Scope package and change history

- Add versioned scope and approved-resource metadata to the community agent configuration.
- Record proposed/applied/rejected changes, actor, source category, authorization, timestamp, and prior version.
- Add explicit pause and rollback behavior; keep global policy out of community-editable fields.
- Do not expose model tools with general database or cross-community access.

**Exit:** authorization and audit tests prove a community guide cannot read or change another community's records.

### Phase 2 — Setup copilot, private draft only

- Build the proposal flow to draft a scope package and near-duplicate/adjacent-community comparison from public metadata.
- Keep the host in control of edits; persist only after explicit proposal submission.
- Evaluate Spark and Wonder on synthetic proposals, including ambiguous overlap, unsafe scope, prompt injection, and “make a new community” cases.

**Exit:** reviewers find drafts useful; no generated proposal can bypass pending status or coverage review.

### Phase 3 — Member guide, read-only and private

- Add a member-invoked guide grounded only in the approved scope/resources for that community.
- Use narrow server-side retrieval and tools; no posting or moderation actions.
- Provide explicit disclosure, citations/source labels, no-answer fallback, pause state, and user feedback.

**Exit:** synthetic and browser journeys cover grounded answers, out-of-scope questions, prompt injection, membership checks, provider failure, and private-draft behavior.

### Phase 4 — Scope stewardship, recommendation mode

- Start with moderator-selected or explicitly consented examples; do not continuously sweep all posts.
- Generate a proposed diff across scope, description, topics, approved resources, and guide instructions.
- Classify the recommendation as clarify, bounded adjacent expansion, material change, or split; require deterministic validation and human review by default.
- Add member notice, version history, rollback, and per-community pause.

**Exit:** a pilot shows appropriate expansion-vs-split suggestions and no unauthorized scope change.

### Phase 5 — Bounded delegated updates and operational pilot

- Only after the community explicitly opts in, permit auto-application of a narrow, pre-approved expansion envelope.
- Notify members, retain a diff and rollback, and automatically pause on repeated invalid/out-of-scope responses or a failed health check.
- Separately schedule and staff the moderation queue. Agent availability must not be presented as human coverage.
- Pilot with one staffed community before broad rollout; review user feedback, scope reversals, inappropriate answers, false assurance, moderator workload, latency, and cost.

**Exit:** named owners, operating alerts, stop switch, review cadence, and agreed quality/rollback thresholds are in place.

## Measures of value

- Host/reviewer editing time and acceptance rate for setup drafts
- Whether proposed adjacent topics are accepted, rejected, or redirected into a new community
- Member understanding of what belongs in the community and what the AI guide does
- Grounded-answer rate, explicit “I don't know” behavior, and user correction/complaint rate
- Moderator time saved without worse triage recall or false-positive burden
- Scope-change reversals, appeals, and cross-community access violations (target: zero)
- Cost and latency by task and model; compare Wonder with Spark instead of assuming Wonder is better

Do not optimize for personal disclosure volume, distress, time spent, or community growth at the expense of member fit and trust.

## Open decisions before implementation

1. Who can authorize a community-specific expansion envelope, and does that authority require member consultation?
2. What exact changes qualify for optional auto-application? The safe starting proposal is typo/metadata cleanup plus only explicitly pre-approved adjacent topics.
3. What content, if any, may be submitted to Meta for emerging-scope analysis, and what consent/notice is required?
4. Which staffed community can pilot the member-facing guide and who owns its operational pause/escalation?

No architecture decision is recorded until these are answered and the existing reviewer/coverage prerequisites are met.
