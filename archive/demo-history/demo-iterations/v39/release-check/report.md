# v39 candidate release verification

**Decision: READY**

Reviewed only `/workspace/hormonise/demo-iterations/v39/candidate.mp4`.

- SHA-256 matches the expected `64ce4ee005347da552b84f41bd26b5db816aacc74a257506f19fcb70c4f70c34`.
- Full decode completed without FFmpeg errors. H.264 video is 1920×1080, progressive, 30 fps, 93.9667 s. AAC mono audio is 48 kHz, 93.952 s. The audio ends with about 3.98 s of silence (silence detector: 89.969–93.952 s); the video image remains on the closing choice screen through the final sampled frame.
- Captions and screen text are legible in the 1920×1080 render and in 960×540 downscales. The centered top/bottom caption bands stay within frame and do not overlap the main interface. One screen crop around 20 s shows the top of a prompt card clipped at the viewport edge (the fragment “feeling lately?”); this is minor and does not hide the displayed safety or consent controls. No other material crop or band occlusion was seen in the inspected sequence.
- On-screen disclosures consistently identify the scenario and participants as fictional; label the content as prepared local text with no model/service connected; say the private conversation is excluded; show the review checkbox unchecked and continuation disabled; and state that nothing is sent from the preview / no real person or group receives it. The provider panel also says no provider is verified or bookable.
- No cursor or pointer action is visible in sampled frames; visible UI state changes communicate the steps. This is a separate demonstration-evidence limitation and does not by itself block technical release.
- Audio stream decodes, but speech could not be heard or transcribed in this environment. Spoken claims therefore remain unverified; the claim review above is limited to visible text.

Visual checks included a 3-second contact sheet, 960×540 samples through the timeline including the final frame, and native-resolution samples around the upper-band crop and later disclosure screens.
