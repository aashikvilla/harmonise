# V08 release verification

**Result: candidate media checks pass; release metadata needs a hash correction.** This review covers the frozen `demo.mp4`, `captions.srt`, the React capture and visible screen evidence. It does not grade persuasion. Technical-depth judgments below are limited to what the video shows.

`demo.mp4` probes as 1920×1080 H.264 at 30 fps, 5,303 frames. The video stream is 176.766667 seconds; mono 48 kHz AAC and the MP4 container are 176.788 seconds, a 21 ms difference. FFmpeg decodes the complete file successfully. The final spoken/captioned line ends near the stream end; the final caption ends at 176.224 seconds, 0.564 seconds before audio ends. Audio is silent for about 1.28 seconds at the very end, so there is no long silent tail.

The 19 SRT cues are sequential and non-overlapping. They use up to three short lines, with observed reading rates of about 12–16 characters per second. Burned-in captions are legible at both 1920×1080 and 960×540 in the inspected opening, correction, Ravi preview and closing frames. Captions sit below the app content in those views; they do not cover the visible edit controls, consent checkbox or disabled post control. The correction screen keeps the original wording beside the changed, editable reflection, and labels it as a prepared preview with no model connected. The planned Meta role is stated briefly as organizing a reflection Arjun can correct; the video shows no model result or connection.

The video visibly includes the fictional Day 4, Day 9 and Day 16 discussion, a host boundary, an unanswered Dev side question, and a prepared moderator example with no report or reviewer contacted. The Ravi screen shows the edited group-only question, alias and exact audience preview; private conversation context is excluded, consent remains unchecked, and no message is sent. The support screen says no provider is verified or bookable and provides a return to peer perspectives. The closing scene shows Arjun's privately kept takeaway and a selected, editable local draft to Dev. Private context is excluded, consent is unchecked, posting is disabled, and the draft remains unsent.

The 178-second React capture derivative hash matches the manifest and the capture timeline names all 13 scenes. The candidate also matches the MP4 committed at `candidate_commit_sha`. However, the manifest's `candidate_sha256` is incorrect: it records `eee121a0784d0b4128d54663940ce053efd6f74ab3e7091b47fd49f7b02e1dd`, while the candidate file and committed MP4 hash to `eee121a07844d0b4128d54663940ce053efd6f74ab3e7091b47fd49f7b02e1dd`. The SRT hash matches. Treat `manifest.json` as stale on this one digest field and correct that metadata before release; the video and captions themselves are intact.

The video-visible disclosures support that this is a prepared fictional preview with no connected model, live community, moderation or provider action. This statement describes the displayed scenario; it does not infer application implementation beyond the video.


## Verification addendum — 2026-10-29

After commit `322292b693700aeaec1c8ef4966b5dbd0e25f673` corrected the manifest digest, I rechecked the MP4 and caption hashes. Both now match `manifest.json`; the MP4 is unchanged. The digest mismatch recorded above was resolved by that metadata correction.
