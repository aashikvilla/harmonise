# Live product audit · 2026-11-05

## Why voice was missing

The production alias was still serving commit `93fa5ce` (“Update demo guidance for password sign-in”). Its `/app` page rendered a fictional Arjun story, not the authenticated live private chat, so it had no voice control. In the new implementation, the voice control appears inside `/app` only after `/api/auth/me` confirms a session. The local checkout has no usable Supabase credentials, so local `/api/auth/demo` returned 503 and left the screen in the signed-out gate. Production `/api/auth/config` and `/api/auth/demo` both returned 200, confirming the production backend was available; the deployed frontend simply had not received the new route yet.

The live chat now shows **Record a voice message** after sign-in. It records in the browser, converts captured audio to 24 kHz WAV, calls `/api/voice/transcribe` with Meta Muse Voice Transcribe, and places the transcript into an editable draft. It does not send that transcript to the text adviser until the member chooses Send. The UI explains this flow next to the control. A browser E2E check confirms the control appears after authentication on desktop and mobile.

## What is live and demonstrable

| Surface | Live behavior | Provider/data boundary |
|---|---|---|
| `/` | Real landing page and routes into the product | No mock community cards or fictional member story |
| `/connect` | Email/password auth and shared production demo account | Authenticated through Supabase; demo account is shared and persistent |
| `/connect/member` | Private in-memory adviser exchange; member must ask before matches appear | `/api/advice` returns schema-validated Meta advice; Wonder first and Spark fallback. Response now includes the actual serving model identifier for accurate UI attribution. Live community names/counts are fetched from Supabase. Joining is a separate write and requires a member-chosen alias. |
| `/communities` and `/communities/[id]` | Live directory and privacy-gated community detail | Production has one active community with 58 active memberships and 15 visible posts; two other approved communities are empty. Posts are member-only, so the film must not capture member story text or identities without consent. The public community API no longer exposes moderator headcount. |
| `/communities/propose` | Member-entered proposal and optional editable AI scope/fit draft | Setup request sends proposal fields and approved public community context to Meta. Draft remains unsaved until the member explicitly submits it. A submitted proposal stays private pending human review. |
| `/app` | Authenticated private Meta conversation with saved sessions, reviewable themes, and voice transcription | Meta text response is live and the actual serving model is shown. Sessions/turns save to the signed-in account. Voice uses Muse Voice Transcribe and remains editable before send. Crisis screen bypasses Meta. |
| Community guide, reports, appeals, supporter requests | Backend routes have explicit scope/consent and human review boundaries | Avoid staged production writes. No continuous monitoring or autonomous moderation. No therapist directory, booking, volunteer DM, or direct member messaging. |
| `/profile`, `/ops`, reviewer queue | Real account controls and role-gated operational/review surfaces | Do not show private identifiers or the shared account's exported/deleted data. Production reviewer coverage is not configured, so do not stage reviewer approval on production. |

## Data and seed decision

- A Supabase project for Harmonise is available in production only. Supabase branching returned a plan limitation; Docker is unavailable in this workspace. There is no isolated staging database to seed safely.
- Existing production data is enough to show that the community directory is populated. It is real member activity, not demo seed data. The member-only post text is personal, so the recording should show names/counts and the access boundary without displaying post bodies or member aliases.
- No synthetic production posts, accounts, reviewer decisions, or proposals were added. The shared demo account is not currently a member of the populated community and has no contributions.
- The recording should be read-only except for authentication, live Meta calls, and optionally an unsent speech-to-text draft. Do not join, post, react, report, submit a proposal, or approve anything on production.

## Product-story recommendation

The highest-value story is a specific private need → live Meta reflection/options → member-controlled community match → real Supabase community counts/privacy boundary → Meta setup draft for a missing niche → human launch review → voice transcription as an input option. It shows the core value plus the Meta AI integration and preserves trust by demonstrating actual output and its limits.

Do not claim the agent autonomously creates a public group. It drafts an editable proposal that requires a human launch decision. Do not portray community activity as AI output: people write posts; Supabase serves them. Do not imply that Meta has improved outcomes; no efficacy study was found. Describe the intended impact only.

## Verification performed in this revision

- `npm run build`, `npm run typecheck`, and `npm run lint` pass on the final application source.
- `npm run test:e2e`: 51 passed, 18 environment-gated/live-data tests skipped, and one desktop community-detail timeout under parallel load. That desktop community journey passed when rerun alone.
- Focused desktop/mobile connect suite: 14/14 passed serially, including crisis cutoff, signup disclosure checks, and actual model attribution rendering.
- Focused desktop/mobile community + voice suite: public community guard passed on both device profiles; authenticated voice control passed on both; Meta model label test passed on both.
- Hosted production checks confirmed auth config and shared-demo sign-in return 200. No production community mutation was made.
- Live Meta model calls were not executed in local test runs because the local checkout has no configured `MODEL_API_KEY`; actual advice/setup/voice response evidence is still required during the production recording.

Capture details and voiceover are in [`demos/live-application/v1/storyboard.md`](../demos/live-application/v1/storyboard.md).
