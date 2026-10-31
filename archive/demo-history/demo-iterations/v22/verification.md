# v22 release verification

**Status:** Finalized after repairing the caption render, adding caption-matched narration, and placing a fade to black at the end. No cold review or score was performed.

## Export and decode

- `demo.mp4` is 178.000 seconds, 1920×1080 H.264 at 30 fps with stereo AAC at 48 kHz.
- Both streams start at 0.000 seconds and report exactly 178.000 seconds. The audio/video start delta is 0.000 seconds.
- Full-file FFmpeg decode completed without errors.
- AAC level scan: mean −27.0 dBFS, peak −4.0 dBFS; no clipping observed.
- Picture fades from 176 to 178 seconds. Captions end at 175.096 seconds.

## Captions and narration

- `captions.srt` contains 17 cues in chronological order, with no overlap, malformed ranges, or cues longer than two lines.
- Each Flite narration segment starts at its caption cue. Captions hold through the measured speech end plus 250 ms; the final speech ends at 174.846 seconds and its cue ends at 175.096 seconds.
- The soundtrack uses FFmpeg's local Flite `kal` voice. It is synthetic narration, not a human performance, model output, or live service. No music is used.

## Source and picture checks

- The continuous browser capture exists at `capture/continuous-take.mp4`. Its evidence metadata records 62.345 seconds, 507 frames, six interaction marks, and the verified changed reflection: “You want time to decide what you want, without someone choosing stay or leave for you.” The capture averages 8.132 sampled frames per second; the final edit holds its last verified state for 9.655 seconds to complete the 72-second interaction beat.
- The final frames show the initial state, entered words, “Not quite,” corrected text, and changed reflection in one uncut source sequence. The correction and resulting text are present in the source frames around marks 05 and 06.
- Inspected the final at 960×540 and 1920×1080 around 0, 14, 28, 38, 50, 55, and 61 seconds, and at 960×540 for the peer comparison (74/83), consent and question (91/98), support availability (110), private takeaway (127/140), and closing choice (157/169/174/176/177). Caption text remains within the top band and clear of the active input, reflection, consent control, and selected result. The peer title clears the progress rule. The final 177-second frame is nearly black as the fade completes.
- `verification/contact-sheet.jpg` and the paired full-size / half-size frame images preserve the inspected frame evidence.

## Limitations

Flite's voice is plainly synthetic and has not received a human listening or performance review. The film has no music, and narration is delivered in 17 caption-matched segments with quiet pauses between beats. This verification establishes stream integrity, timing, and non-clipping levels; it does not assess human voice quality.

## Hashes

- `demo.mp4` SHA-256: `59e71e2f32903a3e366744ac7473eeb0060acd1f8aca369cc269ad7cc3673cab`
- `captions.srt` SHA-256: `920fbd41ac0c384dc60e62636e7011fc49e658bef6ea183338ee73c8379bb229`
- `capture/continuous-take.mp4` SHA-256: `54a0e0338c933fb10ee3ac9e0f3973bae09e8241b156d06570500c66ad1a9039`
