# v21 media verification

Scope: exported media integrity, caption timing and the brief's observable UI states. This records checks only.

## Media integrity

- `demo.mp4` fully decodes as H.264 at 1920×1080 with mono AAC audio at 48 kHz. Video, audio and container durations are all 177.500 seconds (0 ms stream delta).
- Candidate SHA-256: `7d5e8edd7cae75e7f02daf444a6d5ce023d03a9d4465b0e1105a77a5d192fcd4`.
- AAC mean volume is -18.8 dBFS; peak is -3.5 dBFS.
- `captions.srt` has 49 ordered cues, no overlaps, and its final cue ends at 172.893 seconds (4.607 seconds before picture end). SHA-256: `dcca57f869d4387aafb84ecb468192977e2e8188a4a31a14be0ce4c59b864093`.
- The 177.5-second picture consists of 50 cuts, each 3.533 or 3.567 seconds. All 1920×1080 and 960×540 verification frames are in `verification/`.

## Observable brief checks

- Opening captions establish adults facing family pressure, Arjun's wish for time to think, and the private/correctable/optional-peer promise by 14 seconds.
- Actual frontend footage shows the prepared reading, “Not quite,” Arjun's rewritten words and the changed editable reflection. The interface and captions say Muse Spark is not connected; one concise future-role statement describes organizing themes for user review.
- The single Ravi example is explicitly prepared. Narration names its match (family pressure and needing time) and difference (Ravi already had a trusted friend; Arjun has not said he does). No live peer activity is shown.
- One actual Ravi preview shows Family Expectations, alias QuietRiver, the exact question, excluded private conversation/journey, unchecked consent and disabled continuation. Nothing is sent.
- The support route shows that no provider credentials are verified and no appointment can be requested.
- Actual frontend selection confirms the private takeaway for this preview session and then selects “Maybe later.” The ending pairs the selected state with “I can ask for time before deciding”; the family question remains open.
- Captions occupy a separate lower band. At 960×540 the Ravi consent checkbox, disabled continuation and UI disclosure remain visible above it.

## Provenance and limits

- `capture/react-capture.webm` is a fresh Playwright recording of the local React frontend. Its SHA-256 is `71d0bb46e0d1ea8b06cdf1af7fb35b8c7c011f97dba68c0d1a2dc005f76d58e9`.
- Three AI-generated staged fictional-Arjun stills provide the human framing. Every human image is labeled **“Fictional Arjun · staged AI-generated scene.”** Interface footage carries **“Prepared preview · Muse Spark not connected · no live peers / services.”** No image represents a real user or testimonial.
- Narration uses the synthetic Flite `slt` voice. No model, live peer, provider directory, message delivery or real-world outcome is represented as connected.
- No application code changed; application tests were not run.
