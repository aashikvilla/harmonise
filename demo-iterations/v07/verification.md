# v07 prototype release verification

**Scope:** independent content, release-truthfulness, and media check of the frozen `demo.mp4`, its captions, and the corresponding UI/capture source. This is not a story score or a technical implementation audit. Film claims below are based only on what is visible in the export; code and test files are called out separately as code-only evidence.

**Candidate:** `demo.mp4`, SHA-256 `05c3f1047418255b9129e9c548437abbaf0b79ae27e7ea545fdbf5ebf5397545`.

## Result

The film is broadly truthful about a fictional, local prototype and shows the requested consent and privacy boundaries. The opening, three-day thread, human host and moderator examples, Ravi audience review, support caveat, and bounded Dev preview are visible and labeled. The frozen export starts on the actual first-use UI; a blank `verification/frame-0.png` in the folder is stale and does not represent this MP4. The builder independently confirmed the first exported frame.

Two content gaps remain against the v06→v07 direction: the last image is the open Dev contribution preview rather than a clearly resolved selected-or-declined ending, and the final screen holds silently for about 22 seconds after narration and captions stop. The final preview still shows both choices, excluded private context, unchecked consent, and a disabled post button, so it does not imply a post was sent.

## Video-visible evidence

- **Opening and premise:** at 00:00 the actual screen says “Interactive product preview,” identifies a fictional scenario with prepared examples and no connected AI or community, and offers “Start privately” and “Browse example stories.” The headline names adults under family or relationship pressure and promises private reflection followed by relevant lived experience on the viewer’s terms. The caption is readable at both 1920×1080 and 960×540. No blank loading screen appears in the frozen export.
- **Correction and planned AI:** the film shows the first local prepared response, “Not quite,” an editable user correction, and the sent correction in the next state. The in-flow note says “Planned, not connected” for Muse Spark and optional voice transcription, and says the preview uses local prepared rules with no model or live person connected. This supports a proposed role only; it does not demonstrate model execution or transcription.
- **Day 4 → Day 9 → Day 16:** the cut moves through one labeled historical thread with all three dates. Day 4 shows Ravi’s parallel experience and Nisha’s listening-first response. Day 9 shows the unresolved argument, Ravi’s limited perspective, and a clearly labeled fictional human thread host who leaves the decision to Arjun. The prepared flag opens a distinct human-review example; the copy says no report was sent and no real moderator is contacted or assigned. Day 16 shows Dev’s unanswered question and “No replies yet.” The historical/fictional/prepared labels remain visible. Captions do not cover the dates, host boundary, unanswered state, or triage explanation in the reviewed frames.
- **Ravi:** the film visibly presents the Family Expectations group, alias `QuietRiver`, exact question, and group-only reply boundary. It says the private conversation and journey are excluded and no direct message is sent. The consent checkbox is unchecked and the continuation control is disabled. The narration correctly describes a prepared group-only example, not contact with Ravi.
- **Professional support:** the film visits the support screen and shows separate peer, trained-listener, moderator, and qualified-professional roles. It states that no provider is verified or bookable. This is a caveat, not evidence of a provider directory, booking flow, staffed listener, or live support service.
- **Maybe later and Dev:** “Maybe later” is shown and selected, followed by the optional offer path. The final preview names the fictional Dev and Family Expectations group, alias, and exact bounded sentence. It states that the private conversation and other context are excluded. Consent stays unchecked, posting is disabled, and “Nothing is sent to a real group” is visible. The film does not show publication or a response from Dev.
- **Closing and hold:** the export ends on the open contribution preview with both “Offer one thing that helped” and “Maybe later” visible. It does not finish on a distinct final selection or decline state. Narration and subtitles end at 02:34.072; the 02:56.000 video then holds the same screen silently for about 21.9 seconds.

## Media and readability checks

- `ffprobe` reports H.264 video at 1920×1080, 30 fps, and AAC audio; both streams and the container are 176.000 seconds. `ffmpeg -v error -i demo.mp4 -f null -` decoded the complete file without errors.
- `captions.srt` has 19 parseable cues, all with positive duration and no adjacent cue overlap. The last cue ends at 154.072 seconds; captions are embedded in the picture as well as provided as an SRT sidecar.
- Reviewed opening, thread, Ravi, support, and final preview frames at 1920×1080 and the supplied 960×540 renders. At 960×540, the opening premise and action labels, thread day markers and status labels, Ravi consent boundary, and Dev preview remain legible. The UI body copy is smaller at half size but still readable in the sampled frames; the final caption does not cover the exact share text or unchecked consent control.
- These are 16:9 film-size reviews. They do not establish mobile layout behavior or accessibility beyond the sampled visible states.

## Source and test evidence (code-only)

`capture/capture-film.mjs` records a real React browser session and drives the correction, day tabs, prepared triage, Ravi preview, support route, Maybe later, and final Dev preview. `src/components/demo-experience.tsx` and `src/lib/historical-thread.ts` contain the matching deterministic fixture UI. These files support the capture provenance and explain the states, but they do not increase the film’s demonstrated technical depth: the film itself shows local prepared rules and explicitly disclaims a connected model, people, or moderation.

`tests/demo-flow.spec.ts` contains UI assertions for the first-use promise, correction/local behavior, historical thread and triage, group-only Ravi preview, unchecked/disabled Dev consent, support caveat, and no external requests. This review inspected those assertions but did not execute the suite. `QA_REPORT.md` describes earlier desktop/mobile checks and is not treated as v07 test evidence. No responsive browser test result was available for this candidate.

## Gaps and truthfulness risks

1. **Closing resolution and pacing:** the final image is still a preview with both choices available, after the narration describes options rather than a final choice. The ~22-second silent tail is unusually long and makes the still-open state feel like an accidental freeze. It is a release polish gap, not evidence of a false send.
2. **Human-role boundary:** the film labels the host and moderator as fictional/prepared roles and says no live moderation is connected. Do not describe this film as proving staffed peer support, moderator response, or report handling in a live service.
3. **AI boundary:** Muse Spark and voice transcription are explicitly planned and disconnected. Do not describe the film as demonstrating an AI model call, generated response, or working transcription.
4. **First-frame evidence hygiene:** `verification/frame-0.png` is a stale blank artifact; `verification/final-0.png` matches the actual export opening. The candidate hash above identifies the reviewed MP4.

