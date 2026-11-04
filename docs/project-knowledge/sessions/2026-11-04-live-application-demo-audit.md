# Session Journal — Live application demo code audit

**Date:** 2026-11-04
**Branch:** `codex/live-application-demo-audit`
**Goal:** Review the actual V1/V2 cinematic artifacts and application code before recording the running product.

## Findings and completed work

- Corrected the demo targets: the two latest interactive storyboards are `demos/cinematic/v1` and `v2`; archived v41/v42 are older capture iterations, not the user's intended two. The current V1/V2 are HTML storyboards, not recorded application footage.
- Reviewed product routes, feature components, AI call paths, auth/session handling, community proposal/lifecycle, guide, moderation, account controls, support roles, and prototype boundaries.
- Documented the full feature inventory and a multi-role 12–15 minute actual-app storyline in `docs/LIVE_APPLICATION_DEMO_AUDIT.md`.
- Found material recording blockers: stale Spark provenance in the live adviser UI despite Wonder-first advice configuration; signup claims conversation retention and 90-day expiry although the `/connect` adviser is in-memory and reviewed session expiry is not enforced; signup checkbox consent is not persisted by the auth API; community alias derives from the email local-part; authenticated live member UI says “Prototype.”
- Confirmed that AI-assisted community setup drafts an editable private proposal requiring human review; it does not autonomously create/publish an approved community. Moderator triage is advisory. Verified-supporter identity review is off-platform.
- Confirmed no public member directory, volunteer DM, therapist directory, referral, or booking flow. The separate `/app` story has live Meta chat/voice paths but many fictional community/profile/moderation interactions; don't present those as live community evidence.
- Confirmed repository seed SQL only inserts three community records. No Supabase dev branch exists. The quote for a branch was $0.01344/hour while active; the user did not approve creation, so no branch or data writes were made.
- No new HTML, application code, tests, production mutations, or pushes were made in this task.

## Next steps

1. Fix/correct the model label, retention copy/behavior, consent persistence, member alias choice, and Prototype badge before public footage.
2. Obtain explicit approval for staging cost or choose an existing approved isolated environment.
3. Create/reset a versioned fixture pack with member, contributor, and reviewer roles and synthetic community/moderation data.
4. Capture the actual app, voice it over, then cold-review the full export before publication.
