# Decision Notes

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
