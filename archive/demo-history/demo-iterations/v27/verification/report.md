# v27 verification report

## Candidate and release integrity

- Candidate: `demo-iterations/v27/demo.mp4`
- SHA-256: `587c27876a43c2b50d11e94fd37c5a16614eff63e68e4cdcbab4cf1a1c04717f`
- Implementation revision: `e7e8cbe3c6b94f41324f030b7bb21aaf96f25af0`
- Duration: 154.567 seconds.
- Release verification confirmed a non-silent mono 48 kHz AAC-LC track and a 154.567-second container/audio duration. Video is H.264 at 1920×1080, 30 fps. Full decode passed; the video/audio duration delta is 0.000333 seconds. Loudness measured −17.9 LUFS integrated and −1.9 dBFS true peak. No freeze event over five seconds or ending silence was detected.
- Release verifier reviewed representative frames and found the captions readable at full 1080p. The candidate remains an explicitly fictional, prepared, frontend-only demonstration.

## Independent review

The independent review was video-only with visible burned captions. The judge could not hear the AAC audio, so voice, mix, and other audio-dependent claims were not assessed. The judge returned **Maybe**, with a fixed weighted score of **71/100** and a separate film-persuasion score of **72/100** (medium confidence for the fixed rubric; medium-low for persuasion). The complete review is preserved at `cold-review/report.md`.

## Test evidence

The implementation evidence records lint, typecheck, unit tests (27 passed), production build, and focused Playwright checks (10 desktop/mobile checks) as passed. These implementation checks are distinct from the independent video-only review and the release-media verification above.

## Evidence boundaries

The release verifier established media integrity and visible content in the inspected frames. The independent judge assessed only the video picture and captions; despite the non-silent AAC track, the judge could not hear it. Neither review establishes live model execution, real participants, live community activity, or real-world outcomes; the film explicitly presents prepared and fictional examples.
