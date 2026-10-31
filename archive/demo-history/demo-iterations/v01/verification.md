# v01 implementation and film verification

Scope: independent check of the React app, builder evidence, and `demo.mp4` against requirements 00–06. This report does not score story quality or assign a final/release designation. Candidate SHA-256: `5245e76807e6df250cad0a753a9fb069b69b2041f01570ee31965d12b9858dcb`. The builder manifest ties the app to implementation commit `20d9431db546d97ede3c94feb5f153228855bdfd`.

## Blocker

- **Truthfulness and role-control blocker — “A report opens a restricted workflow.”** The narration and subtitle say this at about 2:32. The moderator screen actually says, visibly and legibly, “Illustrative staff workspace · no report is routed to a real reviewer and this screen does not enforce staff permissions.” The filmed route opens the moderator view from the general Find Support navigation. The UI therefore discloses that permissions are simulated, but the voiceover/caption contradicts it by claiming the workflow is restricted.

  Replace the line and caption with: **“This example moderator screen records a sample decision; no report reaches staff, and access is not restricted here.”** Keep the purple disclosure notice visible. The alternative is to implement and demonstrate an actual role gate before using “restricted.”

## Checklist

- [x] **Candidate and build evidence are present.** `manifest.json` identifies the candidate and source capture, reports lint/typecheck/build success, 27 passing unit tests, 28 passing E2E tests, and media validation. The capture script exercises the React app through Playwright. Test results are taken from the builder manifest and were not rerun for this review.
- [x] **Preview and sample boundary are clear.** The opening label says “Interactive product preview · fictional sample scenarios”; the app labels participants and content as fictional/prepared; the closing slate says “simulated scenarios.”
- [x] **No live AI, member, moderator, or provider claim is made in the main flow.** The chat labels fixture replies and says no AI service is connected. Community material is historical sample content with no live activity. Ravi's reply and moderator case are identified as prepared/fictional. The architecture slate is explicitly “planned” and “not connected.”
- [x] **Recorded app interactions map to React controls and state.** The capture script uses actual visit buttons, transcript editing, interpretation confirmation, a match-feedback control, community navigation, exact alias/audience/question consent, contribution preview/consent, and a moderator decision control. The model-architecture slate and closing title are editorial overlays, not represented as working app controls.
- [x] **Local scenario content is substantial and deterministic.** `arjun-visits.ts` seeds Days 1, 4, 9, and 16 with 29 user turns. Day 4 corrects the initial marriage assumption to family pressure; Day 16 remains unresolved after an argument. The app uses local fixture rules and prepared conversations.
- [x] **Privacy and consent controls are present.** Private chat is kept separate from community replies. The Ravi question preview shows the group, alias, exact question, and exclusion of private context; a separate checkbox is required and can be withdrawn by editing. The contribution preview similarly requires review of exact group text and alias. Draft discard, quiet reading, and story-scope removal are available.
- [x] **Connection/provider disclosures are candid.** Ravi is explicitly group-only; sample connection choices do not contact anyone. The professional page says no provider directory or credential check is connected, and its emergency link asks the user to verify current availability.
- [~] **Moderator flow exists as a simulated view, but is not role-restricted or linked to the report form.** The app contains an example report form and a separate sample decision screen. Neither routes a submitted report into a restricted queue; the moderator view is publicly reachable. The screen discloses this, but the film's “restricted workflow” line is a blocker. The candidate also does not show a report submission entering the sample case.
- [~] **Professional role and official-support path are implemented but absent from the film.** The app's Help page distinguishes peer, listener, moderator, and qualified-professional roles and offers a separate professional-support view. The film does not show that view or the official-support route, despite the film contract listing those elements.
- [x] **Accessibility basics are present in the app.** Semantic landmarks/headings, a skip link, labeled fields, live/alert/status regions, keyboard-operable tabs, visible keyboard focus, screen-heading focus on transitions, reduced-motion CSS, and generally 44–48px primary controls are present. Responsive CSS stacks the main grids and navigation.
- [~] **Responsive evidence is partial.** The manifest reports focused desktop and mobile E2E coverage; the Playwright config specifies 1920×1080 desktop and 390×844 iPhone 13. The film and saved screenshots are desktop-only, so mobile visual layout was not directly reviewed.
- [x] **Runtime and decode pass.** Independent `ffprobe` reports a 179.000-second container/audio track and a 178.967-second H.264 video stream at 1920×1080/30 fps, with AAC mono 48 kHz. A full FFmpeg decode exited 0. Independent audio measurement found -21.7 dB mean and -3.4 dB peak.
- [~] **Audio is present; voiceover is synthetic.** The manifest and render script identify offline Flite narration. No human voice recording or model-generated speech is claimed. The 230-word script is slightly above the contract's approximate 170–220-word target, and the synthetic voice sounds mechanical.
- [~] **Captions are supplied and accurate, but overlap UI.** The English SRT is also burned into the video and its words match the narration. At 1920×1080 the app and architecture text are generally legible, but lower-center captions cover meaningful UI content in places. Around 0:44 they overlap the comparison cards; around 2:36 they obscure the moderator audit-scope line. Reposition or recompose those shots so captions preserve the UI evidence.
- [x] **Scene order and timings match the contract.** The candidate follows hook, Day 1/Day 4, interpretation change, Day 9/Day 16, community history, Ravi consent, contribution, moderation, planned architecture, and close in the requested time bands.
- [x] **Fixture origin is consistent with fictional use.** The fixture JSON marks participants/stories fictional and states that no real inference, messaging, moderation, or clinical services occur. No imported real sensitive posts or external community/provider data are indicated.

## Media evidence

Independent checks performed on the candidate:

- `ffprobe`: 1920×1080, 30 fps, H.264 High, AAC mono 48 kHz; 178.967-second video and 179-second audio/container.
- Full FFmpeg decode: exit code 0.
- `volumedetect`: -21.7 dB mean and -3.4 dB maximum peak.
- Screens inspected at opening, context comparison, contribution consent, moderator decision, planned architecture, and closing. Captions are readable but collide with important UI at the comparison and moderator beats.

The machine-readable checklist, including evidence and the blocker wording, is in [verification.json](verification.json).
