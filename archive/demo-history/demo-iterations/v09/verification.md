# Independent v09 release verification

Scope: frozen `demo.mp4`, its SRT sidecar, manifest, narration transcript, and supplied verification stills. This checks observable media claims and technical packaging; it does not score persuasion. No candidate files were changed.

## Media integrity

- `ffprobe` reports a 176.428 s MP4 container, 176.400 s H.264 video (1920×1080, 30 fps, 5,292 frames), and 176.428 s mono AAC audio at 48 kHz. Audio/video stream duration delta: 0.028 s. This is within the requested 176–179 s runtime.
- Full FFmpeg decode completed with exit status 0. MP4 and SRT SHA-256 match the manifest.
- The 19 SRT cues are sequential and non-overlapping; they start at 0.000 s and end at 175.641 s. Captions are also burned into the reviewed frames. The cue text agrees with the narration transcript. The last speech is audible through about 174.95 s, followed by about 1.49 s of silence to the audio end; this is a short tail.
- No black interval was reported by FFmpeg black detection. The opening frame is the product entry screen. There are long pauses inside the film, including approximately 21.4 s from 132.2–153.6 s, while the composed choice screen remains on display; there is no comparable long silent end tail.

## Film-visible claims

- Opening: the first frame presents the intended audience and all three distinct steps (“What Arjun said” → “A possibility to check” → “Arjun can correct it”), alongside “Fictional scenario · prepared examples · no model connected” and a clearly marked planned Muse Spark role. “Start privately” is selected in the captured flow; the timeline places the first actual typed interaction at 10.944 s of the React capture. Opening cards are shown before this interaction.
- Correction: the film shows Arjun correcting the first interpretation and an editable, user-worded understanding. The prepared/local-rule and no-model disclosures remain visible.
- Community sequence: the prepared thread visibly steps through Day 4, Day 9, and Day 16. It includes peer perspectives, the fictional host’s boundary, and the explicitly unanswered Dev side question. A prepared moderation example is narrated; nothing indicates a live report or live moderator action.
- Ravi preview: the edited question is visible in the question editor and the exact group-only preview reflects it. The audience and alias are shown, prior private conversation is excluded, consent is visibly unchecked, and the continuation control is disabled. The narration and screen disclaimers say the flow sends nothing.
- Support: the provider screen says no provider is verified/bookable, no directory or credential checks are connected, and no appointment can be requested. A return to prepared peer perspectives is shown in the sequence.
- Close: Arjun’s selected private takeaway remains marked private; the optional Dev contribution is presented as a local editable draft for the fictional group. The final composed state retains the exact draft and audience, excludes private context, shows consent unchecked and posting disabled, and states “Nothing is sent without consent.” No send/publication/reply state appears.

## Readability and limits

At 1920×1080, the main interface, labels, exact-preview controls, and captions are readily readable in the supplied stills. At 960×540, headings, main text, primary controls, and captions remain readable at native size, while dense helper text and some secondary labels are small. Captions sit in the lower band and do not cover the main content in the sampled required frames.

The film consistently identifies fictional/prepared content and discloses that no model is connected. The media does not substantiate live AI generation, live community participation, live moderation/provider verification, authentication, persistence, voice transcription, or a real posting action. The manifest reports application tests and lint/typecheck/build checks; those are code-level claims and were not independently rerun here. Video-only technical inspection does not establish those implementation behaviors.
