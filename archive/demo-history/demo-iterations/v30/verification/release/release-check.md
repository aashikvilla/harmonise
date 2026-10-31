# v30 release checks

Candidate: `demo-iterations/v30/demo.mp4`  
SHA-256: `8d8042d7e509af64dda52582f6ec3aa6219dd27faf65940e000131e89c3eaf71`

## Container, streams, and decode

- MP4, 105.021 seconds total; below the 180-second limit.
- Video: H.264 High, progressive 1920×1080, 25 fps, yuv420p, 2,626 frames, 105.000 seconds.
- Audio: AAC-LC, mono, 48 kHz, 105.021 seconds. Audio/video stream duration difference is 0.021 seconds.
- Full FFmpeg decode completed with no errors (`decode.log` is empty).

## Audio

- Integrated loudness: −18.0 LUFS; loudness range: 5.0 LU; true peak: −2.0 dBFS.
- Speech is synthetic Flite narration. Burned captions contain the exact narration; the opening caption adds “Fictional · prepared scenario.” as a clearly editorial qualifier.

## Source continuity and truth boundary

- Correction uses one uninterrupted segment of the recorded v27 session, source 25.011–48.517 seconds. It shows the actual possible reading, “Not quite” action, entered correction, changed reflection, and is immediately followed by the actual confirmation at 48.517–54.521.
- The first three source selections do not replay the opening interaction: opening 0.000–9.000, entry 10.006–18.008, planned-role beat 18.008–25.011.
- The exact real consent screen is held continuously for 9.5 seconds: source 110.559–117.559, then 2.5 seconds on the actual captured frame at source 116.500. No zoom or card covers the screen. Captions call out the real audience, alias, question, excluded private context, unchecked consent, and actual Cancel control.
- Persistent banner: “FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.” Muse Spark is described as planned/not connected. Captured “Prepared local example · no model connected” labels remain visible alongside the prepared response/correction. Prepared peer content is labeled fictional. No message is sent.

## Static-frame scan

FFmpeg `freezedetect=n=-60dB:d=1.5` flags unchanged interface frames during stable states, including long holds at 0.48–5.92, 17.72–23.64, 24.20–28.92, 42.72–47.24, 48.16–53.24, 54.12–60.32, 61.44–67.92, 75.04–79.92, 83.00–87.24, and 95.64–100.52 seconds. These match captured, readable interface states and narration pauses; the 83.00–87.24 consent state and later 2.5-second actual-frame hold are deliberate. No playback stall was observed. Full log: `freezedetect.log`.

## 960×540 review

Nineteen representative frames were exported at 960×540 and assembled into `frames/contact-960.jpg`. Samples cover the opening, source entry and planned-role labels, each correction stage, confirmation, context choice, prepared account, difference, question edit, the held consent state, cancel, private takeaway, and end card. Captions are legible, wrap within frame width, and stay in the lower band. They do not cover the correction field, consent controls, or audience preview.

Supporting evidence: `ffprobe.json`, `decode.log`, `loudness.txt`, `freezedetect.log`, and `frames/`.
