# Candidate release check

Reviewed only `/tmp/harmonise-v28-blind/candidate.mp4` with ffprobe/ffmpeg and representative decoded frames. No source code or iteration reports were inspected.

## Media integrity and format

- Runtime: **93.36 s** (video 93.360 s; audio 93.340 s), within the 180 s limit. Both streams start at 0.000 s; duration offset is **0.020 s**.
- Video: H.264/AVC High, progressive, yuv420p, **1920×1080**, **25 fps** (average and nominal), 16:9.
- Audio: AAC-LC, **48 kHz mono**.
- Full decode with `ffmpeg -v error -i candidate.mp4 -f null -` completed without decode errors.

## Audio

An audio stream is present and active: ffmpeg decoded 4,477,952 samples; `volumedetect` reports mean **−19.3 dBFS** and max **−2.0 dBFS**. EBU R128 reports integrated loudness **−18.0 LUFS**, LRA **6.0 LU**, and true peak **−1.9 dBFS**. These measurements support audible non-silence and leave about 2 dB peak headroom. A/V stream durations are aligned within 20 ms. I did not independently assess speech intelligibility or verify narrated wording.

## Freeze scan

`freezedetect=n=-50dB:d=2` flagged 12 unchanged-image holds, each about 2.2–3.0 s: eleven between 1.04–49.60 s and one at 87.00–89.32 s. Representative frames show static web-app/demo screens held while captions remain on screen; the flags appear consistent with deliberate reading pauses. They are worth distinguishing from motion, but the detector alone cannot establish authorial intent. Decode was clean and no corruption was apparent in sampled frames.

## 960×540 caption and content-truth review

Extracted 960×540 frames at 0.5, 6, 14, 25, 35, 48, 62, 80, 86.5, 88.5, 90.5, and 92 s. The bottom captions use large white text on a dark teal block with strong contrast; the sampled lines were legible at 960×540, including the longer two-line caption at 6 s. Page body copy is substantially smaller and some lower-page content is cropped by the viewport, while the overlaid narration captions remain readable. The persistent top banner is legible and says **“FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.”**

Other sampled screen details reinforce the fictional/prepared framing: a “Prepared local example · no model connected” label (14 s); a story prompt described as a “possible reading” and a “prepared example” (25 s); “fictional” member labels and a side-thread marked “no replies yet” (62–80 s); and at 80 s an exact-audience preview where consent is visibly unchecked, with the caption “Private conversation is excluded. Consent remains unchecked.” At 86.5–90.5 s the screen says “Nothing is sent.” These are useful on-screen truth indicators. The video alone cannot independently prove backend state or validate every scenario/caption against an external source; no such claims were independently fact-checked.

## Overall result

The file meets the requested runtime, format, decode, audio-presence, and stream-sync checks. Captions remain readable in the sampled 960×540 output, and prominent visual labels frame the material as fictional and prepared. Freeze detection reports several short static holds, which look appropriate to the recorded interface/demo but cannot be conclusively classified by automated detection alone.
