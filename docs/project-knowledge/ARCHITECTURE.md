# Current Architecture Notes

## Current runtime boundaries

- Next.js 16 App Router. The public homepage is static HTML in an iframe; `/app` and `/connect` remain fictional demonstration journeys. `/connect` now has a shared demo sign-in and a private Meta adviser flow, but its profile, chat, community matching, and memberships are local session state; do not represent it as Supabase Auth or persisted community access.
- `/communities` and `/moderation` are the live surfaces. Supabase Auth and PostgreSQL back sessions, memberships, posts, replies, reports, moderation events, decisions, appeals, and blocks. Migrations `0001` and `0002` were already applied to `harmonise`; the community progress, lifecycle, and built-in topic backfill migrations are applied as remote versions `20261102183254`, `20261102183300`, and `20261102185148`. The lifecycle migration backfills one helper per community, and the topic backfill refreshes each helper's seeded community context.
- Meta requests stay server-side in `src/lib/meta-model.ts` and the chat, adviser, moderation triage, and voice routes. Muse Spark handles text; Muse Voice Transcribe handles speech input. `MODEL_API_KEY` must never use a public prefix.
- User identity is verified against Supabase Auth. Database access uses server-only service-role credentials and explicit owner/community checks in route code; RLS is enabled on exposed tables as defense in depth.
- The moderation event queue, advisory model triage, reviewer queue, decisions, and appeals exist. `/api/moderation/process` needs a shared worker secret, but no scheduled invocation or named on-duty moderator is configured.
- Authenticated community proposals create private `pending_review` communities and a host membership in one server-only RPC. A trigger provisions a unique helper configuration; helper triage uses that community's purpose/topics and stores helper attribution. An allowlisted reviewer queue requires human-coverage attestation before approval; production leaves `COMMUNITY_REVIEWER_USER_IDS` unset until a real reviewer account is confirmed. This flow does not schedule or staff human coverage.
- Per-community contribution levels derive from visible post/reply text of at least 20 trimmed characters, deduplicate normalized identical bodies, and count UTC active days. Human-reviewed role labels are separate and hidden unless `COMMUNITY_ROLE_VERIFICATION_ENABLED=true`; default is false. Demo sample profiles are not Auth users or live memberships.
- Shared Upstash rate limiting is optional. Without its variables, the runtime falls back to process-local limits; replace this before scaling a public cohort.
- `.env.local` is ignored. `.env.example` documents variable names only; never copy real secret values into source or logs.

## Trust boundaries to preserve

1. Private narrative must not be copied to a community post without a separate exact-text and audience confirmation.
2. Model output is untrusted data: constrain schemas, validate values, cap lengths, and keep the user in control.
3. Model triage is a signal for a human; it never becomes a publish, hide, ban, contact, or crisis action.
4. User stories and audio are sensitive. Do not claim provider retention or deletion behavior without verified policy and implementation evidence.
5. Static demo fixtures and simulated responses must stay labeled as fictional; live community surfaces must use the authorized Supabase APIs.
