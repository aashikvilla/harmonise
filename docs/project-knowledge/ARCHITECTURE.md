# Current Architecture Notes

## Current runtime boundaries

- Next.js 16 App Router. The public homepage is static HTML in an iframe; `/app` and `/connect` remain fictional demonstration journeys.
- `/communities` and `/moderation` are the live surfaces. Supabase Auth and PostgreSQL back sessions, memberships, posts, replies, reports, moderation events, decisions, appeals, and blocks. Migrations `0001` and `0002` are applied to the `harmonise` project; the seed creates three communities.
- Meta requests stay server-side in `src/lib/meta-model.ts` and the chat, adviser, moderation triage, and voice routes. Muse Spark handles text; Muse Voice Transcribe handles speech input. `MODEL_API_KEY` must never use a public prefix.
- User identity is verified against Supabase Auth. Database access uses server-only service-role credentials and explicit owner/community checks in route code; RLS is enabled on exposed tables as defense in depth.
- The moderation event queue, advisory model triage, reviewer queue, decisions, and appeals exist. `/api/moderation/process` needs a shared worker secret, but no scheduled invocation or named on-duty moderator is configured.
- Shared Upstash rate limiting is optional. Without its variables, the runtime falls back to process-local limits; replace this before scaling a public cohort.
- `.env.local` is ignored. `.env.example` documents variable names only; never copy real secret values into source or logs.

## Trust boundaries to preserve

1. Private narrative must not be copied to a community post without a separate exact-text and audience confirmation.
2. Model output is untrusted data: constrain schemas, validate values, cap lengths, and keep the user in control.
3. Model triage is a signal for a human; it never becomes a publish, hide, ban, contact, or crisis action.
4. User stories and audio are sensitive. Do not claim provider retention or deletion behavior without verified policy and implementation evidence.
5. Static demo fixtures and simulated responses must stay labeled as fictional; live community surfaces must use the authorized Supabase APIs.
