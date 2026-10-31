# v20 media verification

Scope: exported media integrity, caption timing, and sampled brief requirements. This records checks only; it is not a video review or score.

## Media integrity

- `demo.mp4` fully decodes as H.264 at 1920×1080 with AAC mono audio at 48 kHz. Both streams and the container are 177.500 seconds; A/V duration delta is 0 ms.
- Candidate SHA-256: `6b8a07b8c6235757144576dc2d24c7ee5557d9dfb322efa032b73565c391a0a4`.
- AAC decode passed. Mean level is -19.3 dBFS and peak is -3.1 dBFS.
- `captions.srt` has 44 cues, ordered cue IDs, and no overlaps. The final cue ends at 175.530 seconds, 1.970 seconds before picture end. Its SHA-256 is recorded in `manifest.json`.
- Captions are burned into the video. Verification frames were extracted and checked at both 1920×1080 and 960×540 for the opening at 5 and 12.2 seconds, correction, prepared thread, final Ravi preview, private choice, and composed close.

## Brief checks

- At five seconds, the opening shows the adult audience, Arjun’s existing family-pressure line, and the complete private/correctable/optional-peer promise. At 12.2 seconds, the actual React landing state is visible and names the audience and promise.
- The correction sequence shows “Not quite,” Arjun’s rewritten words, the changed editable reflection, “Prepared local example · no model connected,” and the planned Muse role as a separate captioned statement.
- Thread crops show the Day 4 example, Day 9 host boundary, and Day 16 unanswered status with the prepared historical-example label.
- One final Ravi form appears, with group audience, alias, exact edited question, excluded private context, unchecked consent, disabled continuation, and a “Nothing is sent” caption.
- The closing frame pairs “I can ask for time before deciding” with “Preview session only · nothing sent.”
- The planned cut reports 141.0 seconds of React UI out of 177.5 seconds (79.4%). No UI shot exceeds five seconds.

The render emitted a nonfatal Fontconfig cache-directory warning in this environment; fonts and captions rendered in the candidate. Application tests and production build were not rerun because v20 changes only demo iteration assets and no application code.
