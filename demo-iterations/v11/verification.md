# v11 independent release verification

**Result:** The frozen MP4 and SRT pass the requested media and film-visible checks. The manifest has one packaging gap: it references a narration transcript that is absent. No candidate or manifest files were changed. No persuasion score was assigned; technical depth is judged from video-visible evidence only.

## Media and captions

- MP4 duration is 178.013 seconds (video 177.967 seconds; audio 178.013 seconds), within 176–179 seconds. Audio/video delta is 0.046333 seconds.
- Full FFmpeg decode exits 0. Candidate and caption SHA-256 values match the manifest.
- The SRT contains 39 sequential, non-overlapping cues. The final cue ends at 177.388 seconds; final speech ends at 176.772 seconds, with 1.254 seconds of audio silence to the end and 0.625 seconds from the final cue to the end.
- Opening and final active-caption frames were inspected at 1920×1080 and 960×540. Captions remain readable below the focused content and do not obscure the final consent/no-send disclosure.

## Film-visible checks

- Within the opening 15 seconds, the video presents a human first-person uncertainty, the `FICTIONAL SCENARIO · ARJUN` label, the private-first audience promise, and three stages: “What Arjun said” → “A possibility to check” → “Arjun can correct it.” The planned Muse Spark disclosure runs from 4.600 to 11.090 seconds, alongside visible “prepared examples · no model connected” labeling.
- The correction sequence shows a prepared local reply, “Not quite,” Arjun's edited words, and a changed editable reflection. Captions distinguish the planned Muse Spark concept from the local no-model example.
- The edited historical thread moves through Day 4, Day 9, and Day 16. Fictional peer perspectives, the host's boundary, the prepared/no-report state, and Dev's unanswered question are visible.
- Ravi's changed exact question, alias, and group audience appear together in the preview. Private context is excluded; the consent box is unchecked and continuation is disabled.
- The support screen states that no provider is verified or bookable, then returns to peer perspectives.
- The final view pairs the selected private takeaway with the selected optional local Dev draft. It shows private context excluded, consent unchecked, post disabled, and “Nothing is sent without consent.” Local app markup confirms the post control is disabled while consent is false; no send action is connected.
- Fictional/prepared/not-live labels are visible throughout. The film presents edited local UI states and does not claim a live community, moderator, provider, model, or message send.

## Manifest gap

`manifest.json` references `demo-iterations/v11/narration.txt`, but that file is absent from the v11 directory. The MP4, SRT, and their hashes are present and match the manifest. This report records the gap without changing the frozen candidate or manifest.
