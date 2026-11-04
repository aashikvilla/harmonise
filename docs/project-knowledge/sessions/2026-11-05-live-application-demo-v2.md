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

## Extended three-minute cut update (2026-11-05)

The first production capture was reviewed and rejected before publication. The footage showed provider scratch text in a Wonder response, a community directory still loading, and large narration captions that obscured the application. It was an old 161-second capture, not proof of the planned full three-minute story.

Changed the capture so advice, setup, saved chat, directory load, and voice transcription must return real completed outcomes before the scene is accepted. The advice/setup validators now reject known provider scratch artifacts and use their existing Spark fallback; private chat rejects invalid model text rather than displaying it. The script checks response status, actual model labels, real community card rendering, and the full non-repeating voice transcript. It records unexpected HTTP/JS errors, while marking only the signed-out pre-login `/api/auth/me` check as expected.

Expanded the live story to two Adviser prompts, member-selected matches, the populated live directory, a private unsent Meta setup draft, one saved private Spark exchange, and a complete editable Voice Transcribe draft. It now includes the exact 20-cue voiceover and cue schedule in the storyboard. Audio is 177 seconds with 1.2 seconds between narration cues; final encode pads to exactly 180 seconds with a short quiet close. The late AI/technology scene now holds on the homepage model cards through 2:48 before moving to the impact close.

The intended production data effect is one neutral private conversation in the shared demo account. Adviser turns remain stateless. No post, reaction, join, report, or community proposal is submitted; the member-only feed is not captured. Existing aggregate directory activity is production data, not synthetic seed data. No therapist directory is implemented; the narration describes volunteer and verified-supporter roles as human-reviewed peer support, not clinical care.

At this checkpoint, the refreshed voice track and SRT are regenerated, timing reports 177.01 seconds, the capture script parses, and the working diff passes `git diff --check`. The new live capture, caption rendering review, final media validation, PR/CI, deployment check, and closing journal evidence are still pending.

## Final iteration review (2026-11-05)

The stale MP4 was the reason the previous playback did not show the latest homepage work. Re-captured the live production application and ran the finalizer on that new WebM. The final MP4 now opens on the real homepage: the exact “You don't need the right words to begin” hero, loop logo, and window/person illustration are on screen at the start; the opening scroll also shows the problem statement and AI role cards. This is live React UI, not an HTML mock.

The final cut is exactly 180 seconds at 1920×1080/25fps, with H.264 video, AAC voiceover, burned captions, an embedded selectable subtitle track, MP3/WAV sidecars, and SRT. Audio inspection measured -18.8 dB mean and -1.1 dB peak. The capture manifest reports no unexpected HTTP or browser errors, two live Adviser Wonder responses, a Wonder setup draft, a Spark private chat response, completed Voice Transcribe, reuse of the existing shared demo conversation, and no community writes.

Visual review confirms the homepage, two different Adviser prompts, editable community scope draft, private chat, editable unsent voice transcript, Meta model-role cards, and impact close. Review also found two imperfections that remain in this submitted iteration: the live community directory is visibly loading during part of its short scene, and the saved private chat repeats the same follow-up once because this final take reused a thread from an earlier capture. The script now positively waits for a named rendered community card, but the scene hold is short; do not describe the shot as continuously showing loaded cards. The duplicate is confined to the shared demo account's private conversation; public community data was unchanged.
