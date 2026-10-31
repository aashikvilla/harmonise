# v14 candidate verification

The v14 candidate is an edit of a fresh Playwright recording of the existing React preview. The app and its fixtures were not changed. The capture uses actual local UI states and interactions; no live model, Meta, community, moderation, provider, human, or message service is connected. Narration uses synthetic Flite speech, with matching burned-in captions and an SRT sidecar.

## Acceptance checks

- Lint: passed.
- Typecheck: passed.
- Unit tests: 27/27 passed.
- Desktop and mobile E2E: 32/32 passed.
- Production build: passed.
- Capture smoke: 18/18 scene markers reached.
- Full React browser capture: 190.36 seconds, 1600×900; edited to 178 seconds nominal.
- Final video: H.264, 1920×1080, 30 fps, 177.933333 seconds, 5,338 frames.
- Final audio: AAC mono, 48 kHz, 177.920 seconds; audio/video stream delta 0.013333 seconds.
- Full FFmpeg decode: passed.
- Captions: 42 cues, no overlapping cues; last cue ends at 177.58 seconds, 0.35 seconds before video end. Last speech is followed by approximately 0.95 seconds of silence.
- Black-frame scan: no black run of 0.5 seconds or longer.
- The final frame is the actual composed agency-choice screen. Key frames were sampled at full and 960×540 size, including opening, correction, Day 9 host boundary, Ravi audience/consent controls, and ending.
- The Day 9 host statement is visible above its caption band at 1920×1080 and 960×540; the lower role-summary copy remains outside the focused crop.

## Known limitations

This is a fictional, frontend-only preview using prepared local rules and content. The historical thread and moderation example are illustrative; no report is sent and no moderator acts. The support screen states that no provider is verified or bookable. The Ravi preview is group-replies-only with no private-message option; consent stays unchecked and the send action disabled. The final Dev contribution remains a local draft and is not sent.

No app-source changes were made for v14. The capture and render scripts, raw recording, screenshots, captions, narration, and checks are retained with this candidate for review.
