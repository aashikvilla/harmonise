# Harmonise v39 verification report

**Status: HOLD.** The review export is `candidate.mp4`, not a frozen release master. Its SHA-256 is `64ce4ee005347da552b84f41bd26b5db816aacc74a257506f19fcb70c4f70c34`.

The candidate is 1920×1080 at 30 fps, 2,819 frames, and 93.967 seconds. FFmpeg completed a full decode. Captions contain 21 cues, and each cue text matches a caption from v13 exactly. The final cue uses the correct v13 audio source interval, 173.600–176.980 seconds; the prior v38 map had selected a window ten seconds early. Silence detection places the last spoken word at 89.975 seconds, leaving 3.992 seconds to the final picture. The audio stream itself extends only as the intended silent final hold.

I inspected paired 1920 and 960 frames at the opening, every scene boundary, the complete correction sequence, the share-preview states, the selected choice, the final hold, and the former v38 failure positions at 18 and 27 seconds. Captions sit in the reserved blank lower margin with no band; disclosures use the blank upper margin or truthful app copy. App crops retain the relevant words and controls without a status strip or caption overlay. No source-text clipping or caption collision appeared in those reviewed frames. The final state remains selected from the actual local frontend through the last frame.

The correction is the original uninterrupted v37 local frontend capture, preserved byte-for-byte (SHA-256 `9022cc2be2f1abdc84e947254da1ac2ee0d5c3abb394571d9b7d3dacd5b2a1c5`). The actual “Maybe later” Playwright click was performed against the current local frontend and is evidenced by the trace plus before/after screenshots. Playwright’s video recorder could not initialize because its bundled ffmpeg executable is missing. A local Chrome CDP screencast emitted only three damage frames and no pointer. Therefore the candidate shows the actual selected state, but does not show a visible cursor choosing it. This required interaction-visibility gate is **not met**.

The original v13, v35, v36, and v37 master hashes all match their protected values. No application source was changed. No external API, network service, model, or real user was used. No audience study was conducted. The full film was not subjectively listened to in this environment; source windows, caption text, decode, and audio tail were checked mechanically. These two review gaps keep release on hold.

## Review files

- `contact-sheet-1920.jpg` and `contact-sheet-960.jpg`
- Paired `frame-*-1920.png` and `frame-*-960.png`, including `v38-18s-equivalent-*`, `v38-27s-equivalent-*`, `final-hold-*`, and `last-frame-*`
- `media-checks.json`, `sha256.txt`, and `../release-check/report.json`
- `../capture/edit-map.json`, `../capture/captions.srt`, `../narration.txt`, and source-capture index under `../capture/source/`
