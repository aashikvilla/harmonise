# v16 verification

## Scope and provenance

This candidate is a frontend-only preview using fictional local fixtures and prepared rules. The narration is synthetic Flite speech, and the captions are burned into the picture with an SRT sidecar. No live model, Meta integration, community, moderation service, provider, or sending action is connected. The visible Muse Spark reference is explicitly planned and not connected. The “possible themes” are a prepared local mock-up, not generated output.

The film was recorded from the running React app with Playwright. It captures the actual entry, private start, local prepared response, “Not quite” correction, edited reflection, explicit confirmation, optional peer-experience choice, Day 4/9/16 thread tabs, Ravi share-question editing and exact preview, support caveat/return, and the selected takeaway/unsent draft. Capture screenshots and the raw WebM are retained under `capture/`; `verification/frames960/` contains sampled frames at 1920×1080 and 960×540.

## App checks

- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 27/27 tests.
- `CI=1 PORT=3033 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3033 npm run test:e2e -- --workers=1` — passed, 32/32 desktop/mobile tests.
- `npm run build` — passed.
- `PLAYWRIGHT_BROWSERS_PATH=/tmp FAST_CAPTURE=1 ...` capture smoke — passed, 21/21 scene checkpoints; full React capture completed with all 21 timeline markers.

## Media checks

- `demo.mp4`: H.264, 1920×1080, 30 fps; video stream 177.966667 s; AAC mono 48 kHz audio stream 177.962000 s. Difference: 4.667 ms.
- Container duration: 177.966667 s; 10,060,241 bytes.
- Full FFmpeg decode to a null sink passed. Black-frame scan found no black interval. The final detected audio silence is 0.862 s, with the last narration/caption ending at 177.715 s.
- `captions.srt`: 36 cues, ordered, no overlaps; final cue ends at 177.715 s.
- Sampled opening frames at 0/4.9/9.9/14.9 s and correction, community, sharing, and ending frames were inspected at 1920×1080 and 960×540. The opening promise, local/prepared disclosure, four-step mechanism, and planned/not-connected Muse Spark role remain legible. The 960×540 ending shows the private takeaway, optional bounded Dev draft, excluded private context, unchecked consent, disabled post, and no-send disclosure.

## Known scope limits

The historical thread and all participants are fictional prepared examples. The moderator/triage language illustrates a workflow only; no report or moderation action occurs. Ravi is a fictional group-replies-only example; no private message is sent. The support screen states that no provider is verified or bookable. The closing Dev contribution remains a local draft; consent is unchecked and posting is disabled.
