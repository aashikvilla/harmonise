# Product journey and gap audit

## Goal

Map a simpler end-to-end Harmonise journey from homepage, through private text/voice chat and user-controlled community matching, into real community participation, human moderation, and a potential volunteer pathway. User requested a detailed checkbox plan and no source changes.

## Work

- Read project knowledge, the current Meta plan, demo journey guide, route structure, UI components, Supabase schema, and API handlers.
- Audited `/`, `/app`, `/connect`, `/communities`, `/communities/[id]`, and `/moderation`, plus account/session, voice, safety, community, and moderation flows.
- Confirmed key system boundaries: `/app` is a fictional guided story with optional real saved sessions; `/connect` is a separate Meta-connected demo with local-only membership; `/communities` is persisted; `/moderation` is human-reviewed but lacks configured coverage/schedule.
- Confirmed the voice flow requires several user actions after recording; live communities store posts/replies but do not have live-response notifications or a response-time guarantee.
- Confirmed there is no community-creation API, per-community autonomous moderator agent, live lived-experience discovery model, persisted contribution/reputation system, or volunteer/trainer verification workflow.
- Added `docs/PRODUCT_END_TO_END_JOURNEY_PLAN.md` with page-by-page findings, the integration inventory, phased dependency map, parallelizable work, priority/MVP boundary, open decisions, and end-to-end acceptance checklist.

## Boundaries and follow-up

- No application source, configuration, database, deployment, or existing project plans were changed.
- Phase 0 product/architecture decisions are still open; no decision was recorded as an approved architecture choice.
- The existing `docs/META_INTEGRATION_PLAN.md` contains completed provider work but should be read with this current product boundary audit because demo screens are not live community integrations.
