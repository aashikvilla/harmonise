# Current Architecture Notes

## Current runtime boundaries

- Next.js 16 App Router; the public homepage is a static HTML document inside an iframe. Main product flow is `/app/`; the separate adviser journey is `/connect`.
- Browser state drives the fictional community and most journey screens. Arjun visit fixtures are session-scoped. There is no account database or live peer/community store.
- Meta calls are server-side only through `src/lib/meta-model.ts` and `/api/chat`, `/api/advice`, and `/api/moderation/triage`. Voice uses `/api/voice/transcribe` and Muse Voice Transcribe.
- `MODEL_API_KEY` must remain server-only. The local `.env.local` is ignored; `.env.example` is safe to commit.
- Chat/voice/triage input is sent only when the user performs the respective action. Community fixture content remains synthetic.
- Community triage is currently a human-review aid for a reported sample post. No queue, staff identity, real-time listener, or autonomous action is present.

## Trust boundaries to preserve

1. Private narrative must not be copied to a community post without a separate exact-text and audience confirmation.
2. Model output is untrusted data: constrain schemas, validate values, cap lengths, and keep the user in control.
3. Model triage is a signal for a human; it never becomes a publish, hide, ban, contact, or crisis action.
4. User stories and audio are sensitive. Do not claim provider retention or deletion behavior without verified policy and implementation evidence.
5. Static fixtures and simulated responses must stay labeled as fictional.
