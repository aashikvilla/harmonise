# Release check: candidate.mp4

Inspection used only `/tmp/harmonise-v29-blind/candidate.mp4`.

## Container, streams, and decode

- MP4 container; 100.000 s total runtime, within the 180 s limit.
- Video: H.264/AVC High, progressive 1920×1080, 16:9, 25 fps nominal, 2,500 frames, 99.960 s.
- Audio: AAC-LC, mono, 48 kHz, 117 kb/s, 100.000 s.
- Both streams start at 0.000 s. Audio runs 0.040 s beyond the video stream (about one frame); no material A/V offset is indicated by the stream timestamps.
- Full FFmpeg decode of the file completed without errors.

## Audio

- Audio is present and active. Integrated loudness: **−18.1 LUFS**; loudness range: **5.2 LU**; FFmpeg EBU R128 peak: **−2.0 dBFS**. Peak sample level by `volumedetect`: **−2.0 dBFS**.
- There are pauses between spoken sections, including a longer quiet span around 39.4–47.8 s and pauses near the end; this is not continuous silence. The measured level and clear nonzero audio activity across the program support that the track is active.

## Still-frame / freeze check

A video-only `freezedetect` pass at −60 dB with a 1.5 s minimum flagged long unchanged-frame holds at 9.96–12.16, 12.28–16.64, 17.60–23.92, 24.16–27.92, 28.20–29.88, 31.32–34.88, 36.20–42.56, 43.80–47.36, 48.20–49.84, 49.84–52.04, 52.08–53.84, 54.04–56.24, 64.12–66.32, 72.20–75.32, 80.64–83.92, 87.00–89.52, 90.44–93.52, and 94.72–99.04 s. These holds correspond to static interface or comparison panels held for reading/narration; scene content changes between panels. I did not observe an anomalous playback stall separate from those intentional still holds. The detector is sensitive to this still-panel format, so the intervals should be read as unchanged frames rather than proof of a delivery fault.

## Captions and visible framing at 960×540

Representative frames were downscaled to 960×540. The recurring spoken-word captions sit in a dark green, high-contrast box along the lower edge with large white lettering. Caption text was legible in sampled frames, with no apparent clipping or overlap with the interface. Fine body copy inside the simulated UI becomes small at this display size, but the captions remain easy to read.

The visible top banner states **“FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.”** Other visible labels reinforce that framing, including **“PREPARED EXAMPLE,” “NO LIVE ACTIVITY,”** and a comparison panel labeled **“EDITORIAL COMPARISON · COPIED FROM RECORDED UI.”** Sampled screens show a prepared private-chat example, a comparison of a broad topic with confirmed context, fictional community-post examples, and an exact-audience preview that says no message is sent. This is clear on-screen framing as a fictional, prepared demonstration rather than a live service or connected model.
