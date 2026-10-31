# Independent v10 release verification

Scope: frozen MP4, burned captions and SRT, supplied evidence frames, release manifest, capture timeline, and source statements needed to assess disclosed behavior. This is a release-evidence review, not a persuasion score. Technical depth below is judged from visible interactions in the film; code and test reports are not treated as proof that a filmed interaction occurred.

## Media integrity

- The MP4 SHA-256 is `1a2cffd3268c741d37779b00e4dc3afeae8e1a94f220d4a17f5f346187de73fe`, matching the manifest. The caption SHA-256 also matches: `f6abcde0b1294756fca8759ffdf217a3105d1263c0c8e8bad367e8ff04cb6eac`.
- `ffprobe` reports a 176.448-second container, 1920×1080 H.264 at 30 fps (176.433 seconds), and mono 48 kHz AAC (176.448 seconds). The A/V duration delta is 0.015 seconds. Full FFmpeg decode completed successfully.
- The SRT has 39 sequential cues, starts at 0.000 seconds, ends at 175.725 seconds, and contains no overlaps or backward timestamps. Supplied full-size and 960×540 frames show burned captions aligned with the visible scene and readable at both sizes, including the opening, correction, Ravi preview, and close.
- Final audible narration ends at about 175.012 seconds, leaving 1.436 seconds to container end. This is a short composed close, not an extended silent tail. Sampled black-frame detection found no black segment; the final supplied frame shows the composed choice screen.

## Film-visible release assertions

- **Opening and mechanism:** At the opening, Arjun's first-person family-pressure hook appears with a fictional scenario label. The screen identifies an interactive product preview, prepared examples, and no connected model; states the private-first audience promise; and shows the three-step “What Arjun said → A possibility to check → Arjun can correct it” mechanism. Muse Spark is explicitly planned and not connected. The filmed Start privately action occurs at about 9.4 seconds, inside the first 15 seconds.
- **Corrected understanding:** The film shows the initial possible reading, Arjun choosing “Not quite,” his typed correction, and a changed editable reflection that names his parents and family pressure. The UI calls the reading a possibility, says it is not confirmed yet, and permits editing or setting it aside. The changed state is visible in the supplied film frames; this is observable local interaction evidence, not evidence of a live model.
- **Community:** The film shows the historical fictional thread labeled Day 4, Day 9, and Day 16, including different peer perspectives, a host boundary (“I can listen; I can’t decide for you”), Dev's unanswered side question, and a prepared moderation example. It explicitly says no report was sent and no response is promised. No report submission is shown.
- **Ravi preview and consent:** The film shows Arjun editing the group question and the exact audience preview changing. The preview identifies the group and alias, excludes the private conversation, and states that Ravi accepts group replies only. The consent box remains unchecked and Continue remains disabled; the narration says nothing is sent to Ravi in this preview.
- **Support recovery:** The screen and narration say that no professional provider is verified or bookable. The filmed path returns to peer perspectives without sending the conversation.
- **Takeaway, optional draft, and ending:** Arjun selects a private takeaway and later chooses the optional Dev contribution path. The close displays the exact edited local draft, group and alias, private-context exclusion, unchecked consent, disabled posting, and “Nothing is sent without consent.” The film ends on this composed choice, with the final spoken line “Arjun can leave the draft here.”
- **Truthfulness:** Fictional people and prepared examples are labeled in the film. The film and source disclose that no model, live community, report handling, provider verification/booking, or message sending is connected. The close describes the contribution as a local draft and makes consent and posting state visible.

## Technical depth and evidence boundary

The film demonstrates a modest but concrete interactive state flow: a correction changes an editable reflection; editing a question changes its audience preview; and consent state governs whether the visible continuation/post action is enabled. The thread, support caveat, takeaway, and optional draft are also shown in their actual UI states. These are interactions shown in the captured product flow, rather than a static mockup sequence.

The film does not demonstrate persistence, a backend, a live model, speech transcription, real moderation/report routing, provider lookup, authentication, or successful posting. Manifest-reported lint, typecheck, unit, browser, and build results are code/test evidence only; they are not counted as video-visible technical behavior. No score is assigned for persuasion.

## Result

The inspected release assertions pass on the supplied frozen media and evidence. No media-integrity or caption-overlap issue was found. Claims about live services remain appropriately disclosed as unavailable or fictional.
