# v16 independent release verification

This verification covers the frozen `demo.mp4`, `captions.srt`, `manifest.json`, and sampled/exported visual evidence. It does not assign persuasion scores. Film observations below come from the exported film and its burned captions; source/test status is separated at the end.

## Media integrity and playback

- `demo.mp4` SHA-256 matches the manifest: `3181b539a6b2a6a3a23372e19ca77e025e0a7c4f75f312fecba7ba88f9923dcf` (10,060,241 bytes).
- Probe confirms H.264, 1920×1080, 30 fps, 177.966667 s; AAC mono 48 kHz audio is 177.962000 s. A/V difference is 4.667 ms.
- Full FFmpeg decode to null completed successfully. Black-frame scan reported no black intervals at the configured 100 ms threshold.
- Speech has short pauses between narration lines and a 0.857 s tail after the last detected audio activity. There is no prolonged silent section; narration and final caption finish within the video.

## Captions and sampled readability

- The SRT contains 36 ordered cues with no overlaps. All 36 cue texts match the 36 narration paragraphs exactly. The last cue ends at 177.715 s, 0.252 s before the video ends.
- Sampled frames were inspected at 1920×1080 and 960×540, including the opening, reflection/correction, Day 4/9/16 thread, Ravi preview, and closing choice. Captions occupy the lower safe band and do not cover the key visible controls or content in these samples. Main disclosures and the final privacy controls remain readable at 960×540.

## Film claims and required scenes

- **Opening promise (0–15 s):** The first card identifies a fictional scenario and Arjun’s family-pressure problem. It states the product value, “Private reflection you can correct before exploring peer experiences,” and shows the four-step path. The theme card says it is a prepared local mock-up and not generated. Muse Spark is described as planned, with “No model connected here.”
- **User correction:** The film shows a prepared possible reply, a visible “Not quite” correction, Arjun changing his words, an altered editable reflection, and a later explicit “Arjun confirms” state. The prepared local example and planned model role are separately labeled.
- **Community thread:** The thread is labeled historical, fictional, and prepared. Day 4 shows differing lived experience; Day 9’s host says, “I can listen; I can’t decide for you”; Day 16’s Dev question is marked “No replies yet.” The triage beat says no report is sent.
- **Ravi sharing:** The visible exact preview gives the Family Expectations group, alias QuietRiver, and question “What helped you ask for time?” It says Ravi may reply in group, excludes the private conversation/journey, says no direct message is sent, and shows unchecked review consent. The film does not show sending.
- **Support and return:** The film says no provider is verified or bookable here, then visibly returns to peer stories.
- **Ending:** Arjun keeps a private takeaway and sees an optional local draft for Dev. The final screen identifies the fictional group, exact draft audience/context, private-context exclusion, unchecked consent, disabled post, and no-send state. No reply or resolution is claimed.

## Scope and separate source/test notes

The film presents itself as a prepared preview: its fixtures and community participants are fictional, no model is connected, Muse Spark is planned only, and sharing/report/provider actions are not live. These status findings are based on what the film states and shows.

The existing `verification.md` reports lint, typecheck, unit/e2e tests, and build as passing; those app checks were not independently rerun for this media-only review. The capture timeline’s `18-composed-agency-close` marker is 186.337 s, beyond the exported film’s 177.967 s duration. The MP4’s sampled ending already displays the composed private/optional choice, so this is a capture-timeline/export bookkeeping discrepancy rather than a missing ending in the MP4.
