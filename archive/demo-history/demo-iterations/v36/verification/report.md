# v36 verification report

Candidate: `demo-iterations/v36/demo.mp4`  
SHA-256: `808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c`  
Runtime: 126.000s (3780 frames at 30 fps)

## Media integrity

- Full FFmpeg decode: **PASS** (exit 0).
- Video: h264 1920×1080 at 30/1; audio: aac 48000 Hz, 1 channel(s).
- Video/audio duration delta: 15.0 ms; allowed maximum 50 ms.
- Runtime gate 120–145 seconds and candidate cap 180 seconds: **PASS**.

## Caption and voice cue audit

The retained original v13 caption cues were audited in integer milliseconds against the edit map. **29 complete cues are retained or intentionally realigned; 0 retained cues are clipped.** Every other source cue is omitted as a whole. Day 4 uses the original 42.000–45.425s and 46.500–50.200s cues; Day 9 uses 50.500–54.800s; Day 16 uses 59.200–62.800s. Each is paired with its exact captured selected screen and its complete original narration segment. The private-takeaway still pairs the 118.000–121.360s original narration with its exact original SRT #29 caption. The subsequent original video begins at 121.400s, after the provider-page hold, and retains only complete cues.

The sidecar captions correspond to these cue timings. Captions burned into retained v13 clips remain paired with their original audio windows. No original cue intersects a retained audio interval partially.

## Visual review

Critical moments were sampled at 1920×1080 and 960×540: the opening and correction, both Day 4 narration lines, Day 9, Day 16, exact consent preview, the return/provider transition, private takeaway, optional draft, paired close, and final choice. Evidence is in `verification/*-1920.png`, `verification/*-960.png`, and `verification/contact-sheet-960.jpg`.

The Day 4/9/16 screenshots use the supplied intact captured UI states. Their captions sit in one dedicated band below the fitted screenshot. The private-takeaway opening frame now uses the captured private-choice screen; the provider page is not repeated there. Retained video has no reframe, crop, duplicated header, control band, or caption band. The consent and post controls remain on original intact frames: the checkbox is unchecked, the action disabled, and the no-send/private-context copy remains visible. The final captured pair shows a private takeaway and an optional local fictional-group draft, with unchecked consent and no-send disclosures.

The provider view states that no provider is verified and no appointment can be requested. The film makes no referral, response, human outcome, model execution, or message-send claim.

The previous assessments remain separate single-judge results with audio inaccessible: v13 80/100 film persuasion (75 weighted), v34 73/100 (75 weighted), and v35 76/100 (77 weighted). v34 had a technical READY; v35 had a release HOLD for duplicated/offset crop bands. These scores do not establish that an edit caused a change.

## Gate results

- **runtime120to145:** PASS.
- **candidateUnder180:** PASS.
- **fullDecode:** PASS.
- **video1920x1080:** PASS.
- **video30fps:** PASS.
- **frameCount3780:** PASS.
- **avDeltaUnder50ms:** PASS.
- **noPartialRetainedSourceCue:** PASS.
- **stillCueCaptionsPresent:** PASS.
- **criticalFramesAtBothSizes:** PASS.
- **priorCandidatesUnchanged:** PASS.


v13, v34, and v35 candidate hashes match their recorded originals: **PASS**. No prior candidate was modified. The v36 candidate hash was re-read after verification: `808f3d3bf00dbc03f500870401d4671c06d3e842c746bef472e6bab7c4ff4b1c`.
