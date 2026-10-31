# v25 release checks

Candidate: `demo-iterations/v25/demo.mp4`  
Product source: `5fd3c7062b4287af3eebd65b7a24cd0304613f08` (no application source edits)  
Candidate SHA-256: `e68563c689848f21b5bc92618f19a1891d987f38c2bc58a4ce04fb4bd28acd96`  
Source capture SHA-256: `41b5369e6fe778b49da4dc2949820b8f50cf4cd01b94c718f1faf117e998dd23`

## Media

- H.264, 1920×1080, 30 fps, 160.033 seconds (4801 frames).
- AAC mono, 48 kHz, 160.033 seconds; audio/video delta 0.000333 seconds.
- Full FFmpeg decode passed. `ffprobe.json` records both streams.
- Audio: integrated loudness −18.1 LUFS, true peak −2.0 dBFS. `audio-levels.txt` contains the FFmpeg EBU R128 record.
- 25 timestamped caption cues are burned in. Captions are also delivered in SRT and spoken in the narration. No product controls or text are covered: the lower 192 pixels are reserved for captions.
- FFmpeg `freezedetect` with a five-second threshold reported no freezes (`freezedetect.log`).

## Product interaction checks

The capture script checked the actual changed editable reflection, the confirmed theme reaching discovery, the prepared comparison changing after the user's rejection, Ravi's fictional provenance and contrasting support, the exact group question preview, unchecked/disabled consent, the private takeaway, the optional Dev group draft remaining unconsented and disabled, and the final selected state. These values are recorded in `capture-marks.json`.

The film ends on the actual local end state: Arjun's takeaway is private for the preview session, the optional group contribution is an unsent draft, consent is unchecked, and no send action exists. Every participant, story, reply, and thread is labeled as fictional/prepared; no model or live service is connected.

## Visual review

All 25 scene midpoints were inspected in 1920×1080 and 960×540 contact sheets. The changed reflection is visible at 960×540 in `frame-08-960.png`; the exact recipient, alias, question, exclusions, and unchecked consent are visible at `frame-19-960.png`; the final private/unsent choice appears at `frame-25-960.png`.

The film is 160 seconds because the captured journey supports that duration with distinct actions and consequences. Each scene is 5–8 seconds, captions vary with scene lengths, and the narrative follows a private correction into changed discovery, peer contrast, controlled outreach, unresolved reply, and a selected close.
