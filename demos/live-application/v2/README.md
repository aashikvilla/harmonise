# Harmonise live application demo · V2

V2 is an exactly three-minute, narrated walkthrough of the deployed application. It opens on the real Next.js homepage with the original “You don't need the right words to begin” headline, Harmonise loop mark, and animated window illustration. It then shows two live Adviser turns, member-controlled community discovery, a live Meta setup draft, one saved private Muse Spark conversation, and an editable Meta Voice Transcribe draft. The recording, captions, audio, and scripts live under `demos/`; `.vercelignore` excludes them from deployment.

## What's in this version

- `knowledge-base.md` — product problem, audience, intended impact, actual feature and AI map, and precise product boundaries.
- `storyboard.md` — timed screen actions, narration, prompts, and review criteria for the three-minute cut.
- `generate-audio-v2.ps1` — synthesizes the narration and a short voice-input fixture, and writes matching SRT captions.
- `capture-v2.mjs` — captures the deployed app through visible Chromium, uses real model/data responses, reserves fixed scene slots with deadlines, and asserts that the directory and voice transcript finish loading.
- `finalize-v2.ps1` — mixes narration, burns legible captions into the live capture, adds a selectable MP4 caption track, and pads the ending to exactly 180 seconds.
- `recording/` — final MP4 with voiceover and burned-in captions, standalone MP3/WAV narration, caption sidecar, and capture manifest.

The archived Motion Revival page was a design study with sample interactions that were not connected to product services. The live React homepage now carries its headline, loop mark, window illustration, and scroll motion while describing only verified product behavior. All visible product actions navigate to the working app; no example conversations or fabricated activity are shown.

## Recording and data boundary

Run against the production alias only after the homepage release is READY:

```powershell
./demos/live-application/v2/generate-audio-v2.ps1
$env:DEMO_BASE_URL = "https://harmonise-weld.vercel.app"
$env:DEMO_VOICE_INPUT = "demos/live-application/v2/recording/voice-input.wav"
node demos/live-application/v2/capture-v2.mjs
```

The shared demo account is persistent. The two Adviser turns call stateless `/api/advice`. The capture resumes the existing saved private chat when present and adds one live Muse Spark turn; if no session exists, it creates one. It does not create duplicate sessions, join, post, react, report, submit a proposal, or change community data. It shows public community names/counts but not members-only stories. It drafts a new community scope privately and leaves the voice transcript unsent. No synthetic community activity or posts are written into production.

The 177-second voiceover track has a 1.2-second pause between cues and is mixed into a 180-second MP4 with a short quiet closing hold. It is also published as a separate MP3/WAV for players whose inline video preview does not play audio. Captions are burned into the MP4, included as a selectable MP4 subtitle track, and supplied as an SRT sidecar. Scene slots are timed to narration cues; missed live-response deadlines stop the capture. To finalize a fresh capture, run `./demos/live-application/v2/finalize-v2.ps1` after `capture-v2.mjs`.

Expected signed-out authentication and reviewer-role HTTP responses are access boundaries; an incomplete AI response, missing community data, or repeated/partial voice transcript fails the capture instead of being replaced with prepared UI.
