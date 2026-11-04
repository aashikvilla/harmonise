# 2026-11-05 — Live application demo V2

## Goal

Answer the missing-audio and static-homepage feedback with a three-minute,
narrated capture of the actual deployed Harmonise app. Open on the animated
homepage, establish the problem, audience, intended impact, and technology,
then show live product flows.

## Work completed

- Reworked `/` as the live server-rendered React homepage with the intended
  “You don't need the right words to begin” headline, Harmonise loop mark,
  animated window/person illustration, scroll reveals, product journey, Meta
  roles, and impact language that is explicitly an intention rather than an
  outcome claim.
- Created V2 story, product knowledge base, narration generator, and Playwright
  capture under `demos/live-application/v2/`, outside the Vercel deployment.
- Shortened the synthetic Microsoft Hazel voiceover to 2:04 and generated a
  matching 15-cue SRT plus an MP3 sidecar. The video will include AAC audio and
  burned-in captions.
- Capture journey: animated homepage → shared demo sign-in → live Meta advice
  with model attribution → member-controlled discovery → live Supabase public
  community directory → private Meta scope draft (not submitted) → live Meta
  Voice Transcribe in an editable, unsent draft → homepage impact close.
- No synthetic community data or production community writes are part of the
  recording. Member-only community stories remain private. The `/api/advice`
  route is stateless; it does not persist the filmed adviser exchange.

## Verification

- `npm run typecheck`, `npm run lint`, and `npm run build` passed for the
  homepage work.
- The V1 MP4 was inspected: it includes AAC audio and fully decodes. This does
  not explain why the user's playback path was silent, so V2 supplies MP3 and
  captions as additional access paths.
- The original homepage reference was recovered from Git history. A local
  desktop review now matches its headline line breaks, loop mark, and
  window/person illustration; mobile stayed within a 390px viewport.
- An initial live capture stopped at an incorrect assertion that `/api/advice`
  creates a saved private session. Route review confirmed it is stateless; no
  session was created. The guard was removed before the final take.
- V2 production capture and final MP4 verification remain pending.

## Open work

Push and merge homepage/story assets; verify Vercel production READY; record a
full live pass, then mux video + narration + captions and review the final
runtime, audio, caption legibility, and capture manifest before publishing the
demo assets.
