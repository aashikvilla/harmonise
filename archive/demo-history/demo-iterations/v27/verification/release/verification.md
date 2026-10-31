# v27 release verification

- Candidate: `demo-iterations/v27/demo.mp4`
- Duration: 154.567 seconds; 1920×1080; H.264 at 30 fps; AAC mono at 48 kHz.
- Full FFmpeg decode: passed.
- A/V duration difference: 0.000333 seconds.
- Integrated loudness: −18.0 LUFS; true peak: −1.9 dBFS.
- Freeze detection: no interval of five seconds or more after the crop motion adjustment.
- Silence detection: no ending silence; longest narration gap is 3.64 seconds.
- Captions: 26 burned cues in the reserved 130-pixel lower strip. The same cues are in `capture/captions.srt`.
- Release review: opening, Muse Spark role, corrected reflection, Ravi context, question review, no-reply state, and final local confirmation captured at 1920px and 960px wide. Independent judge review was video-only with visible captions; the judge could not hear AAC audio. The release verifier confirmed a non-silent AAC track.
- Local contribution: captured assertions confirm the button is disabled before consent, enabled after exact text and audience review, and visibly confirms only a fictional local preview. Editing after consent clears the confirmation and requires review again.
- Candidate behavior remains frontend-only: no API request, server record, real identity, real recipient, or reply.

- Test evidence: lint, typecheck, unit tests (27 passed), production build, and focused Playwright checks (10 desktop/mobile checks) passed.
- Independent scores: Maybe; fixed weighted rubric 71/100; separate film-persuasion score 72/100.
