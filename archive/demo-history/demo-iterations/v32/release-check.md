# v32 release checks

Status: one candidate rendered and frozen; technical release checks passed and the independent blind review is complete. The fixed-score target was not met.

- Candidate SHA-256: `ff146927bf2ab553352f5dabd9d24704bbd9dbb3157ef806a1000befed64fa3d`.
- Runtime: 100.000 seconds; 1920×1080 H.264 at 25 fps, 2499 video frames; AAC mono soundtrack at 48 kHz, 100.000 seconds. Full-file decode completed successfully.
- The v29 master also has 2499 video frames. Decoded video frame hashes match outside frames 600–1187 (24.000–47.480) and 1800–2000 (72.000–80.000). There are 789 changed frames, all within the two requested windows. Fractional edit-map boundaries quantize to the nearest 25 fps frames.
- Correction picture is one continuous captured source interval 25.011–48.517 with a moderate continuous reframe. Samples show the typing cue during typing; the caption “The reflection changes to hold his correction.” begins at 44.750 as the captured reflection appears around 45.0.
- Timing reconciliation: v29’s edit map places the corrected-reflection shot at source 40.014, but sampled source frames at 40 and 43 still show typing; the changed reflection is visible around source 44.5–45.0. v32 corrects this within-window cue timing and documents the discrepancy in `capture/edit-map.json`.
- Consent picture uses source 109.500–110.500 for context, then 110.500–117.500 for one enlarged crop. 960×540 review frames show Family Expectations group, QuietRiver, the exact question, exclusion, unchecked checkbox, and “Cancel · keep my draft” together with the editorial label “Recorded preview · prepared example.”
- All 22 cue texts match v29 verbatim. One cue is retimed within the correction window; other narration and caption timings are unchanged. Consent cues remain at v29 timings.
- 960×540 samples and `contact-v32.png` are in `verification/release/frames/`.
- v29 received a film-persuasion score of 84 from a different single judge; v32 received a fixed weighted score of 75 and a separate film-persuasion score of 74 from one judge. The target of 85 was not met. These separate single-judge results do not establish that any particular edit caused a score change.
# Release check: candidate.mp4

Inspected `/tmp/harmonise-v32-blind/candidate.mp4` only.

- **Runtime and media:** 100.00 s; H.264 video at 1920×1080, progressive, 25 fps; AAC-LC mono audio at 48 kHz. Both streams start at 0.000 s. Video stream duration is 99.96 s and audio is 100.00 s (40 ms difference).
- **Decode:** Full FFmpeg decode completed without reported errors (2,499 video frames decoded).
- **Audio:** Audio is active over the program. Integrated loudness is −18.2 LUFS, loudness range 5.5 LU, and true peak −2.0 dBFS; sample peak is −2.0 dBFS. There is a short quiet pause around 78.7–80.3 s, with no clipping indicated.
- **A/V sync:** No stream start offset or meaningful duration mismatch is present. This is screen narration rather than on-camera speech; sampled subtitle text follows the narrated screen changes, with no obvious sync fault. Acoustic word-to-caption alignment was not independently measured.
- **Freezes:** FFmpeg's strict freeze detector (`n=-60dB`, `d=2s`) flagged ten 2.0–3.3 s holds at approximately 9.96–23.92 s, 49.84–52.04 s, 54.04–56.24 s, 64.12–66.32 s, and 73.00–79.04 s. These coincide with static prepared UI screens while narration continues, so they read as deliberate screen holds; no accidental full-program freeze was found.
- **960×540 legibility:** At 960×540, main headings, form text, status banners, and subtitles are readable in sampled frames. Secondary navigation and fine-print UI labels are small.
- **Prepared/no-model/no-live/no-send:** A persistent top banner states “FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.” Prepared-example labels remain visible on relevant screens. The final private-choice card says “Kept privately for this preview” and “Private reflection stays private. Nothing is sent.” Community content is labeled as prepared/historical with “No live activity.” Send controls appear within the mock UI, but the video does not show a completed send.

**Assessment:** Technical checks pass. The content visibly identifies itself as a prepared fictional demo and ends with a clear privacy/no-send statement. Static holds are noticeable but consistent with narrated UI walkthrough pacing.
