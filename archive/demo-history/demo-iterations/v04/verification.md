# v04 release verification

**Result: pass for release verification of the filmed claims and supplied media, with scope gaps recorded below.** This is a film-to-app parity and truthfulness check, not a narrative or story score.

## Film and app parity

The opening identifies an “INTERACTIVE PRODUCT PREVIEW · FICTIONAL SAMPLE SCENARIOS” and the title states the protagonist problem and Harmonise promise. The visual contrast labels the directive “Advice: decide now” as illustrative and pairs it with the room Arjun needs to explain what is happening at home. This matches the local-only preview shown in the React app.

The v04 film shows the Day 1/Day 4 correction and transcript review, the changed understanding and result comparison, the Day 9/Day 16 unresolved outcome, a historical group thread, Ravi’s story and question flow, a prepared reply, Dev’s later group post with Arjun’s reviewed contribution, and an illustrative moderation decision. These scenes correspond to screens and state transitions in the current React app. The recorded Ravi payload is readable in the film: group audience, alias, exact question, and the unchecked consent checkbox are visible together. App copy says Ravi accepts group replies only, rules out a direct message, excludes the private conversation and journey, and says nothing is sent in this preview. The next scene calls Ravi’s reply prepared and fictional.

The film also accurately labels Meta integration as planned and not connected. It names Muse Spark for dialogue and correctable structured context, and Muse Voice Transcribe for optional speech-to-text reviewed before sending. The app’s voice control does not call a transcription service: it explains that transcription is not connected and offers an editable text review. The displayed moderator decision is explicitly a browser example; the screen says reports do not reach staff, permissions are not enforced, and AI triage is not connected. No claim of a live Meta call, community member, human response, staff moderation, or backend operation is made. **No live Meta, community, human, or backend behavior occurred.**

## App paths not covered in the film

The film is a selected journey, not a tour of all app destinations. The following paths or controls are available in the React app but are not shown, or are only partly shown, in v04:

- The front-door entry choices and alternate ways to begin.
- Standalone Connections and its mutual request, decline, and block states.
- My Journey’s separated chapters and optional goal status.
- Find Support, including the professional-support screen and the India emergency-resource link. The app says no provider is verified or bookable and cautions users to verify emergency-resource availability. This pathway is not covered in the film.
- Contributor sharing preferences and approval controls are only partly represented by the contribution scene; the film does not demonstrate changing the shareable summary or opting out of discovery/questions.
- Other community tabs and branches such as stories, people, guidelines, reporting, and alternative reading choices are not comprehensively exercised.

These are coverage omissions, not mismatches in scenes that the film actually shows. The professional/official support wording exists in the app but is not narrated or shown in v04.

## Privacy, accessibility, and responsive evidence

The sampled consent screen and contribution preview show the intended audience and exact text before the checkbox is selected; source copy excludes private conversation content. App disclosures describe local/session-only behavior, and the moderation and professional views explain that no real staff/provider access exists. This inspection did not exercise browser storage across reloads or perform a security audit.

The app source includes semantic labels and headings, visible keyboard focus styling, a polite live region for chat updates, and a reduced-motion media query. CSS includes narrow-screen breakpoints down to 320 px. These are implementation indicators, not a completed assistive-technology or device test. Film frames reviewed at 1920×1080 and the supplied 960×540 reductions show the opening hook/disclosure, consent details, prepared reply, moderation disclosure, and planned-integration labels. The central consent text remains readable at 960×540; smaller supporting architecture copy is less prominent. No claim of full accessibility conformance is warranted from this check.

## Media checks

- Runtime: 178.000 seconds, within the 175–179 second target.
- Video: H.264, 1920×1080, 30 fps.
- Audio: AAC, mono, 48 kHz; measured mean −21.2 dB and peak −4.6 dB.
- Full decode: `ffmpeg -v error -i demo.mp4 -f null -` completed successfully.
- Captions: supplied SRT runs from the opening to 2:57.8 and tracks the narration’s major beats, including the consent checkbox, fictional prepared reply, simulated moderation, and planned integrations. Captions are also burned in.
- File digest: SHA-256 `4cb08bbb531dc4b4870421a94d1267cecb89db25f601252335d9036bb044f5d7`, matching the v04 manifest.

The evidence reviewed was v04’s manifest, narration, SRT, rendered video and supplied verification frames, plus the current React component, reducer/fixture references, and styles. No source or video files were changed. No app tests were run as part of this film-only verification.
