# Decision Notes

## 2026-11-03 — Hold automated facilitator replies until identity is verified

- Remove the facilitator cron and default its endpoint to disabled with `COMMUNITY_FACILITATOR_ENABLED`.
- The current alias lookup and random profile ID cannot safely establish a bot identity.
- Re-enable after an Auth-backed automated actor, explicit content-transfer consent, idempotent writes and a synthetic end-to-end run are verified. Daily advisory triage remains scheduled.

## 2026-11-02 — Use Meta Model API directly from server routes

- **Decision:** Use Muse Spark 1.3 Standard for text chat, adviser output, and structured moderation triage; use Muse Voice Transcribe 1.0 for voice input.
- **Reason:** These models directly fit the current text and speech-to-text use cases. The product does not need image generation, visual segmentation, or a long-horizon coding model at runtime.
- **Implementation:** Raw server-side HTTP calls to Meta endpoints; `MODEL_API_KEY` is never exposed in browser code. `META_TEXT_MODEL` defaults to `muse-spark-1.3`.
- **Privacy:** Use Standard mode for sensitive narratives. Do not use Contributor mode for user content. Do not claim zero retention or confidentiality without verifying the applicable provider terms.
- **Revisit when:** evaluations show a material quality/cost reason to change model or API surface.

## 2026-11-02 — Bound Muse Spark reasoning and output for short flows

- **Decision:** Use the documented `max_completion_tokens` parameter and `reasoning_effort: "minimal"` for the current short structured chat, adviser, and triage requests; allow up to 700 completion tokens for triage.
- **Reason:** Local synthetic calls initially returned no visible completion under the previous settings. The documented parameter and minimal reasoning made chat/adviser succeed; a larger triage cap allowed structured classification to complete.
- **Revisit when:** Evaluations compare quality, latency, and measured token cost across representative synthetic cases.

## 2026-11-02 — Keep moderation human-led

- **Decision:** Model output may classify and prioritize reported content, but cannot enforce a moderation action.
- **Reason:** A live database, queue, reviewer UI, and appeal path now exist, but there is no staffed moderator rota and automated enforcement is not validated. A model result alone cannot safely hide or remove content.
- **Revisit when:** Human staffing and support sign-offs, production authorization checks, appeals, representative evaluation data, and an approved policy are in place. Human decisions remain required unless separately approved.

## 2026-11-02 — Serialize releases to `main`

- **Decision:** Parallel coding agents work in isolated branches/worktrees; one integrator merges and pushes each accepted phase to `main`, then starts the next phase from updated `main`.
- **Reason:** Multiple agents pushing directly to `main` can race and integrate incompatible changes without a shared merge gate.
- **Revisit when:** CI, branch protection, and an explicitly approved merge queue provide equivalent serialized guarantees.

## 2026-11-02 — Keep community activity levels separate from verified roles

- **Decision:** Derive community-scoped activity levels from currently visible member-authored posts and replies of at least 20 trimmed characters. Count normalized identical text once across posts and replies, with distinct UTC active-day thresholds. Keep human-verified role labels in a separate moderator-reviewed table, behind the server-only `COMMUNITY_ROLE_VERIFICATION_ENABLED` flag.
- **Reason:** Activity volume is not evidence of trust, expertise, or skill. Deriving counts avoids persistent profile scores and excluding held/removed content, short text, and duplicate bodies limits trivial inflation without automated text judgment.
- **Implementation:** A SQL aggregate counts eligible rows; the authenticated API only returns the caller's aggregate for an active membership. Verification changes require an active community moderator, are unavailable while the flag is off, and cannot self-verify.
- **Revisit when:** Cohort feedback requires different labels or thresholds, or privacy review calls for a retention window or explicit timezone policy.

## 2026-11-02 — Gate new communities on human coverage and bind advisory helpers per community

- **Decision:** Existing communities remain approved; new communities begin in `pending_review`. A service-role-only transaction creates the community and owner membership, while a database trigger provisions one scoped AI helper row. A reviewer allowlist and explicit coverage confirmation are required to approve launch; approval assigns that reviewer as a human moderator.
- **Reason:** Community creation must not imply public access or staffed moderation. Helper identity and per-community context must remain auditable without granting the model enforcement powers.
- **Implementation:** Migration `20261102183300_community_lifecycle.sql` adds lifecycle metadata, default-deny helper storage, provisioning trigger, and RPCs; API routes validate ownership and reviewer authorization; triage records the helper ID/display name alongside advisory output.
- **Revisit when:** The pilot has a staffed moderation schedule and launch review workflow backed by an operational source of coverage assignments.

## 2026-11-02 — Keep the shared demo login local to the prototype

- **Decision:** `/connect` accepts one public demo credential pair and stores only a fictional alias/profile in browser session state. Demo circle joins stay local and never create Supabase Auth users, conversations, memberships, or posts.
- **Reason:** The hackathon walkthrough needs a zero-setup entry point, while the real `/communities` and `/moderation` product surfaces already use Supabase-backed identity and authorization. Mixing these paths would imply security and persistence that the demo does not provide.
- **Revisit when:** The `/connect` journey is migrated to authenticated, persisted community APIs; remove the shared demo credentials then.

## 2026-11-03 — Keep community scope changes versioned and human-reviewed

- **Decision:** Bind each community guide to a versioned scope package. Use AI to draft proposal packages and recommend clarify/expand/split changes, but require an active human moderator to apply an existing-community scope change. Explicitly accepting a split may create one private `pending_review` proposal; it never publishes the new community or moves members/posts.
- **Reason:** A scope change affects member expectations. Model confidence or reviewer silence cannot establish community consent, launch readiness, or human coverage.
- **Implementation:** The setup copilot uses Muse Spark by default; `META_SETUP_MODEL` is server-only and restricted to Spark/Wonder for non-production evaluation. The member guide receives only approved scope/public metadata and the current question. Scope recommendations use a moderator-selected excerpt, disclosed before submission; raw excerpt text is not stored. Split creation is transactional and idempotent, and launch still requires the allowlisted reviewer and coverage attestation.
- **Not enabled:** Timeout-based approval, background post scanning, automatic scope expansion, automated moderation enforcement, member invites, or agent-authored public posts/replies.
- **Revisit when:** A staffed pilot has member-governance rules, representative scope-quality evaluations, clear ownership, notices/appeals, and explicit approval for any delegated low-risk changes.

## 2026-11-03 — Keep engagement tables server-only

- **Decision:** Reactions and promotion requests are accessed through authenticated server routes using `service_role`. Revoke `anon` and `authenticated` table privileges and keep RLS enabled with no direct-API policies.
- **Reason:** The app already performs member, post-visibility and moderator checks at the route boundary. The initial table policies did not fully bind a reaction to the author's community and allowed reads of hidden-post reactions in public circles.
- **Implementation:** Production migration `20261103164619_lock_engagement_tables_to_server.sql` revokes the direct grants and removes the unused policies. SQL privilege checks confirm API roles are denied and `service_role` retains route access.
- **Revisit when:** A product feature requires direct PostgREST access; first design and verify an owner/member/moderator JWT policy matrix for cross-community, hidden, blocked and lifecycle states.
