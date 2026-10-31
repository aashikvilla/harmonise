# v26 verification

- Candidate runtime: 144.133 seconds; within the 140–175 second target.
- Full video/audio decode: passed; see `decode.log`.
- Stream metadata: H.264 1920×1080, 30 fps; AAC 48 kHz mono; matched 144.133-second durations; see `ffprobe.json`.
- Audio: −18.0 LUFS integrated, −1.9 dBFS true peak. The longest detected silence is 2.411 seconds; the final silence is 2.352 seconds. See `audio-levels.txt` and `silence-detection.txt`.
- Freeze detection: no freeze interval of five seconds or longer; see `freezedetect.log`.
- Burned captions: 27 cues, separate from the product controls in the lower band; the planned model role and no-model disclosure are visible before/during the prepared result.
- Critical frame review: 15 moments checked at 1920×1080 and 960×540; see `contact-1920.jpg` and `contact-960.jpg` and individual frame pairs.
- Product assertions: all passed during actual Playwright interaction; see `capture/capture-marks.json`.
- Final state: local preview only; optional contribution consent is unchecked and post remains disabled. No live send, recipients, model output, or reply is represented.
