# Release check: `candidate.mp4`

Inspection scope: candidate media file only. No source material or persuasion assessment was used.

## Media and decode

- Duration: **108.000 s**, within the 180 s limit.
- Video: H.264, 1920×1080, 25/1 fps (25 fps average).
- Audio: AAC, 48 kHz, mono.
- Both streams start at 0.000 s and report 108.000 s duration.
- Full ffmpeg decode to null completed without errors (2,700 video frames).

## Audio and sync

- Audio is present and active across the program: integrated loudness **−17.9 LUFS**, loudness range **7.1 LU**, sample peak and true peak **−1.9 dBFS**.
- Silence detection at −45 dB found several pauses, including about 11 s at 53.78–64.74 s and 11.78 s at 75.41–87.19 s. These are pauses, not missing or truncated audio; audio resumes afterward.
- Stream timestamps and durations match exactly. In sampled frames at 40, 70, and 85 s, the bottom narration captions describe the UI state/content visible at that time. This supports sync at the checked points; no sample-by-sample speech onset measurement was made.

## Freeze scan

`freezedetect` at −50 dB with a 2 s duration threshold flagged long static-image spans: 0.48–7.72, 8.64–14.00, 14.68–21.00, 27.68–32.64, 32.64–36.16, 45.20–49.72, 51.36–57.20, 57.20–64.24, 64.52–83.20, 83.20–86.44, 86.52–94.60, and 95.24–100.16 s. The inspected frames show mostly held browser/UI screens with explanatory narration captions, so these appear to be deliberate screen-recording holds; the detector cannot distinguish an intentional still from an accidental freeze. No black/frozen output interruption was visually apparent in the sampled frames. Treat as a freeze-detector flag, not a clean no-freeze result.

## 960×540 review

Frames were scaled to 960×540 and reviewed at 0, 40, 70, 85, and 100 s, with a 5 s contact sheet across the full runtime.

- Main narration captions and the prominent UI text/actions are readable at this size; small explanatory and fine-print text is marginal.
- Top/bottom dark-green labels stay within their bands and do not overlap each other. At sampled frames the bottom caption band covers the lowest part of the app viewport on long pages, visibly clipping some lower page content (not the central action/caption). This is a minor layout/readability issue.
- Visible labels consistently identify a fictional/prepared scenario, no model connection, and no live community. Example pages also state prepared/local or fictional content. Sampled narration labels match the visible story/UI state; no contradictory “live”, model-generated, or sent-message claim was seen.
