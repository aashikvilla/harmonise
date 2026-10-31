# v15 independent frozen-candidate verification

Scope: inspect the frozen `demo.mp4`, its burned captions and `captions.srt`, `manifest.json`, and rendered contact/frame evidence. This review makes no persuasion score and does not treat source code, tests, or hidden app behavior as film evidence. Candidate files were not changed.

## Technical integrity

- Candidate SHA-256: `8904c00ad231407e2c6045a559c0d6f64b79c61e84275e55036cc8d544d9b7e4`; matches `manifest.json`.
- Captions SHA-256: `75d3351067351f11f87a61d9a3b80b0258736276b9c3113987ab0025066b2e28`; matches manifest. 36 cues; zero overlaps; final cue ends at 177.020 s.
- `ffprobe`: H.264, 1920×1080, 30 fps, 177.966667 s; AAC mono, 48 kHz, 177.962 s. A/V duration delta is 0.004667 s.
- Full decode with `ffmpeg -v error -i demo.mp4 -f null -` completed with no decode errors.
- Burned-in captions are visible in the inspected frames. At both 1920×1080 and 960×540, the opening proposition and key controls/copy in the sampled thread, Ravi preview, support notice, and closing screens remain legible. The lower caption placement does not cover the key text in these samples.

## Visible claims and states

- **Opening, within 15 seconds:** The film labels the scenario fictional, states “Private reflection you can correct before exploring peer experiences,” and depicts Arjun's words → a possibility to check → Arjun can correct it. The adjacent qualification says Muse Spark's role is planned and “Not connected here.” Narration/captions also say no model is connected.
- **Correction and source distinction:** The visible sequence shows the prepared possibility, “Not quite,” Arjun's changed wording, and the changed reflection. The film explicitly says the reply came from prepared local rules, not Muse Spark; the planned role is separately qualified.
- **Community thread:** Visible Day 4 and Day 9 states identify fictional participants/prepared historical content; Ravi's contrasting experience does not settle Arjun's question, and the fictional host says “I can listen; I can’t decide for you.” Day 16 labels Dev's question unanswered/no replies. Prepared/no-report language is present around the moderator-hold example. These shots do not present activity as live.
- **Ravi sharing preview:** The visible exact preview names the Family Expectations group and alias QuietRiver, shows “What helped you ask for time?”, limits replies to the group, excludes the private conversation/journey, shows unchecked consent, and states that no direct message is sent. The video says nothing is sent from the preview.
- **Support and return:** The support view says there is no verified provider and no appointment can be requested. The film then visibly returns to the peer thread before showing the private takeaway.
- **Close / Dev draft:** The selected private takeaway and optional offer are shown. The exact local draft and group audience are visible with private context excluded, consent unchecked, post action disabled, and local/unsent language. Closing narration/captions say nothing is sent without consent and that Arjun can leave it here.
- **Collision/live-claim review:** In the sampled frames, subtitles sit in the whitespace band and do not collide with the key copy listed above. Fictional/prepared labels remain visible in the representative thread views; no sampled claim indicates a live model, live community, sent message, moderation action, or verified provider.

## Source results (reported separately; not independent film evidence)

The manifest reports lint/typecheck/build passed, unit tests 27/27, desktop/mobile E2E 32/32, capture smoke 19/19, and full decode passed. I did not rerun those source-level checks for this video-only review.

## Limits

This verifies the inspected frozen video and artifacts only. It does not assess persuasion, product behavior outside the depicted frames, or whether the fictional examples predict real outcomes.
