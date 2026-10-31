# Frozen candidate release check — v33b

Decision: **HOLD** for readability of the recorded application UI at 960×540. The narration captions remain readable at that size, but app body copy and controls become marginal at normal viewing scale. Full-resolution samples are readable.

## Identity and media integrity

Candidate: `/workspace/hormonise/demo-iterations/v33b/demo.mp4`
SHA-256: `b180025740cca42ce4a2a8117ae213c7a7f2a8c5856621c7482cdb99751b846b` (matches the requested frozen SHA).

`ffprobe` reports H.264 High, 1920×1080, progressive yuv420p at 25 fps, 2,190 frames, start 0.000 s, video duration 87.600 s. Audio is AAC LC, mono, 48 kHz, start 0.000 s, duration 87.610 s. Stream duration difference is 0.010 s. Full FFmpeg decode (`ffmpeg -v error -i … -f null -`) exited 0 with no reported errors. Audio level scan reports mean −19.5 dBFS and peak −2.0 dBFS; no clipping observed.

## Captions and readability

There is no subtitle stream; captions are burned into the video. At 1920×1080, frame 45 s caption text (“The reflection changes to hold his correction.”) is legible over the screen recording. At 960×540 the same caption remains legible, as does the persistent top disclaimer, while the app body text and controls are small and difficult to read comfortably. Evidence images: `frame44.jpg`, `frame44_960.jpg`, `cap45.jpg`, `frame45_960.jpg`.

Audio and video durations align within 10 ms. Sampled caption wording matches the scene context, but an exact caption-to-speech offset cannot be certified from this MP4 because the captions are burned in and there is no time-coded subtitle track or transcript. This is a measurement limitation, not an observed timing defect.

## Story and claim check

The top banner persists across sampled scenes and reads “FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.” Screen copy also identifies a “Prepared local example · no model connected.” The group request flow is explicitly presented as a prepared example; the consent checkbox remains unchecked, the narration states consent remains unchecked, and the user cancels and keeps the draft. The later screen and end card say the reflection stays private and nothing is sent. No sent/completed confirmation appears. These on-screen claims are consistent with the demonstrated sequence. The scene contact sheets are `contact_5s.jpg` and `end_scenes.jpg`.

## Hold defect

At 960×540, recorded application text and control labels are too small for comfortable reading at normal view size. This fails the requested 960 readability check. Improve the framing or scale of the app recording before release if viewers are expected to read those details at 960×540.

Machine-readable details: `release.json`; stream probe: `ffprobe.json`; decode and audio level logs: `decode.log`, `audio_volumedetect.log`.
