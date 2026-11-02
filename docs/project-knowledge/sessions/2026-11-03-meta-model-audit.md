# Session Journal — Meta model inventory and journey fit

**Date:** 2026-11-03  
**Branch:** `codex/community-flow-polish`  
**Goal:** Inventory current Meta model/API integrations, compare available model families with the end-to-end journey, and identify high-value next uses.

## Completed

- Read the current architecture, decisions, past mistakes, latest session journal, Meta integration plan, and end-to-end journey audit.
- Mapped the current code: Muse Spark 1.3 Standard via Chat Completions for chat, the demo adviser, and two advisory moderation paths; Muse Voice Transcribe 1.0 via the WAV file endpoint for reviewed speech input.
- Compared repository usage with Meta's current official model/API catalog. Other documented model lines and surfaces are not integrated; team-specific model availability and production usage counts remain unverified.
- Added `docs/META_MODELS_AND_JOURNEY_AUDIT.md` with journey fit, prioritized opportunities, and boundaries.
- Prioritized evaluation of the existing Spark chat flow and, next, a synthetic prototype for ranking live communities from confirmed theme IDs plus public metadata. Kept AI community replies as a product/operations decision because the existing helper is advisory-only.

## Verification and limits

- Reviewed source files and official Meta docs; no provider calls, production logs, deployment secrets, or user narratives were inspected.
- No implementation or tests were run. Existing workspace modifications were present before this audit and were left untouched.
- No architecture decision changed. A future real-community ranking call requires an explicit point-of-use Meta disclosure, data minimization, synthetic evaluation, and deterministic fallback.
