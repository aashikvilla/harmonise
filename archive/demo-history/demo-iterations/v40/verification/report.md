# Harmonise v40 verification report

**Candidate:** `candidate.mp4`  
**SHA-256:** `889060565ca987216376f5d649f2eb83da290aafe2dcc540649aebf51415fd2f`  
**Duration:** 91.800 seconds, 1920×1080, 30 fps.  
**Technical assessment:** READY for independent review. **Builder subjective release:** HOLD.

The MP4 fully decodes without errors. Video and audio streams are both 91.8 seconds. Paired frames were extracted at all 11 picture boundaries at 1920×1080 and 960×540. I reviewed the 960 contact sheet and the opening, correction, consent, and final-state frames at working size; the app crops retain the relevant text, captions stay in the lower blank margin, and no overlay collision appears in the reviewed frames. No still screen is held for more than 4 seconds: longer product, community, consent, and choice passages use continuous reframing. The consent preview remains fully framed for 3.5 seconds before a slow continuous reframe. At 960×540 it shows the prepared statement, group-only audience, QuietRiver alias, excluded private context, unchecked consent, disabled continuation, and no-send copy.

The 24 retained caption strings exactly match v13, and each source audio interval overlaps its corresponding v13 caption cue; see `cue-source-audit.json`. The final caption ends at 90.98 seconds. Decoded AAC has its last 20 ms RMS window above −48 dBFS at 90.38 seconds, 1.42 seconds before picture end. I attempted local playback with ffplay, which could not open ALSA/Pulse output because the environment exposes no audio device. I could not subjectively listen through the soundtrack; source intervals, full decode, caption strings, and audio tail were checked mechanically.

The correction passage uses the original continuous frontend take copied from v39/v37 byte-for-byte (SHA-256 `9022cc2be2f1abdc84e947254da1ac2ee0d5c3abb394571d9b7d3dacd5b2a1c5`). The film shows one prepared Ravi Day 4 perspective and one prepared host boundary. The cue “Arjun edits one question; the exact preview changes” and its caption were removed because the actual captured preview contains a statement rather than a question; no replacement dialogue was created. The actual local “Maybe later” selected state appears through the end, but the film does not show a cursor or click. Existing Playwright trace and before/after captures document a local state change; the raw attempted WebM is only 0.1 seconds and cannot show the action. Cursor visibility and subjective audio remain **HOLD**.

The v13, v35, v36, v37, and v39 master hashes match their protected values. No application source changed; no external service, model, or real user was used. An independent cold review is pending.

## Review assets

- `cut-contact-960.jpg` and paired `cut-*-1920.png` / `cut-*-960.png` frames
- `cue-contact-960.jpg` and correction checkpoints under `cue-*-960.png`
- `ffprobe.json`, `full-decode.log`, `media-checks.json`, `audio-tail-measurement.json`, and `cue-source-audit.json`
- `../capture/edit-map.json`, `../capture/captions.srt`, and copied sources under `../capture/source/`
