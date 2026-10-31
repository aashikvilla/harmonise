# v22 release check

Target: `demo.mp4` (visual/media-only inspection)

## Media integrity

- Duration: 178.000 seconds, within the 180-second limit.
- Video: H.264, 1920×1080, 30 fps; start 0.000 s; duration 178.000 s.
- Audio: AAC, 48 kHz stereo; start 0.000 s; duration 178.000 s.
- Full decode: passed (`ffmpeg -f null -` exited 0).
- Start times and stream durations align. I did not listen to the audio, so narration/audio quality and audible synchronization are unverified.

## Visible-film checks

- Opening promise: visible at the start; the screen says “Private reflection you can correct before exploring peer experiences.”
- Narration captions: sampled at full size and 960×540. White text on dark green remains legible at both sizes and sits in the top margin above the interface controls.
- Correction: the flow shows “Not quite. Tell me what I missed in your own words,” followed by an editable confirmed reflection. A separate label says “Prepared local example · no model connected.”
- Ravi peer comparison: one prepared fictional Ravi example visibly presents both MATCH and DIFFERENCE, and is labeled as prepared, fictional, not real, and not live.
- Ravi preview: the exact-audience preview identifies the Family Expectations group and Ravi; the consent checkbox is visibly empty. The screen says no direct message is sent and labels the flow illustrative. No send outcome is shown.
- Takeaway: “I can ask for time before deciding” is shown as the preview-only choice; “Maybe later” is selected and the private reflection remains private.
- Ending: the last seconds fade down to near black.

## Evidence frames

- `intro0.jpg`, `opening960.jpg`: opening promise and caption at 1920 and 960×540.
- `correction.jpg`, `correction960.jpg`: correction prompt and prepared/no-model label.
- `flow-030.jpg`, `flow-065.jpg`, `ravi70.jpg`, `ravi75.jpg`, `ravi960.jpg`: progression and Ravi match/difference.
- `consent95.jpg`, `consent960.jpg`: preview with unchecked consent and no-send wording.
- `takeaway.jpg`, `takeaway-960.jpg`: private takeaway and Maybe Later outcome.
- `close1778.jpg`: final near-black frame.
- `timeline-contact.jpg`: sampled overview of the film.
