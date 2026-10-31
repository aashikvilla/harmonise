# v23 release verification

Artifact reviewed: `demo-iterations/v23/demo.mp4` only. No source, briefs, manifests, prior versions, or other review files were read.

## Results

- **Duration and decode: pass.** `ffprobe` reports 81.567 s, H.264 video at 1920×1080 / 30 fps and AAC stereo audio at 48 kHz; full decode completed without errors. The audio and video streams both start at 0.000 s and have matching durations (81.5667 / 81.5670 s).
- **Static holds: fail.** FFmpeg `freezedetect` at `n=-50dB:d=5` reported near-static spans 14.767–21.600 s (6.833 s), 28.400–35.700 s (7.300 s), and 38.400–43.433 s (5.033 s). The first two are clear holds on the private reflection view; the last is on the prepared-local/no-model disclosure. These exceed the requested 5 s limit.
- **Correction and prepared/model labels: pass.** The recording shows Arjun rejecting the first interpretation (“Not quite”), then correcting the wording to “I want time to decide what I want, without someone choosing stay or leave for me.” The UI says “Prepared local example · no model connected” and “Planned, not connected”; narration also labels the scenario fictional/synthetic.
- **Captions: visual pass, audio sync not assessed.** Captions are legible in sampled 1920×1080 and 960×540 frames and appear in sequence with the visible walkthrough: initial framing, correction, private takeaway, peer comparison, question preview, support limitation, and “Maybe later.” The AAC stream is present and clock-aligned with video, but no audio playback/listening tool was available, so spoken-word synchronization could not be verified by listening.
- **Peer provenance and comparison: pass as presented.** The example visibly attributes Ravi’s experience to `Source: R3` and labels the comparison as grounded in Arjun u3 and Ravi R1/R2/R3. It makes the shared point (space to think before others decide) explicit and also calls out differences: Ravi had an existing trusted friend, which Arjun has not said he has; the outcomes and whether the approach helps Arjun remain unknown. It also says Ravi accepts replies in the group only.
- **Question preview and privacy: pass.** The left-side question and exact audience preview both show “Could I take time to decide before answering?” The preview identifies “Family Expectations group · Ravi may reply in group” and alias “QuietRiver,” says the private conversation and journey are excluded and no direct message is sent, shows the consent checkbox unchecked, and presents “Continue to prepared response” in a disabled-looking muted state.
- **Support limitation and ending: pass.** The support screen says Harmonise does not provide or verify support; it says no listener is available and no qualified provider is verified or bookable. The ending visibly selects “Maybe later” and says the reflection stays private; the takeaway is labeled for the preview session only.

## Evidence

- [ffprobe stream details](ffprobe.json)
- [decode check output](decode.log)
- [freeze detection output](freezedetect.log)
- [960×540 timeline contact sheet](contact_3s_960.jpg)
- [1920×1080 representative frames contact sheet](representative_1920.jpg)
- [960×540 sample frame](frame_40_960.jpg)
- [correction and model disclosure at 1920×1080](frame_40_1920.jpg)
- [question preview, audience, alias, and consent state at 1920×1080](frame_63_1920.jpg)
- [support limitations at 1920×1080](frame_66_1920.jpg)
- [peer provenance and comparison at 1920×1080](frame_55_1920.jpg)
- [Maybe later and session-only takeaway at 1920×1080](frame_78_1920.jpg)
