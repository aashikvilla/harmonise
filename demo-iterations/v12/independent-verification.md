# Independent v12 verification

Scope: inspect the frozen MP4 and its sidecar captions for technical playback and requested video-visible beats. This report does not grade persuasion. Source tests and manifest acceptance claims were not treated as proof of behavior; any code-only checks remain separate from what the film shows.

## Result

The candidate passes the requested video-visible checks. One quiet interval lasts 6.04 seconds at the Ravi-preview-to-support transition. It holds on the exact audience and consent preview after the line “This preview sends nothing,” so it reads as time to inspect the preview; this is the only measured interval over five seconds at a -40 dB threshold.

## Checks

- **Runtime and playback:** 177.633 s, 1920×1080 H.264 at 30 fps, mono AAC at 48 kHz. Video/audio stream duration differs by 12.3 ms. Full `ffmpeg` decode completed without errors.
- **Captions:** 39 burned-in SRT cues are also supplied as a sidecar; cue times are ordered and non-overlapping. Captions remain legible in inspected 1920×1080 and 960×540 frames. At 960×540, the main UI copy and exact-preview labels remain readable; some secondary interface text is naturally smaller.
- **Opening and mechanism:** The opening proposition is visible immediately and repeated in narration by 4.4 s. The same opening screen labels the scenario fictional, says examples are prepared and no model is connected, and introduces private reflection. By 15 s, the film presents the three steps—what Arjun said, a possibility to check, and Arjun can correct it—both on screen and in narration.
- **Correction and planned Muse role:** Arjun rejects the first prepared reflection with “Not quite,” edits it, and the editable reflection changes to focus on his parents and his own time. Narration describes Muse Spark as planned and limited to organizing possibilities for Arjun to review, not decide; the screen says it is not connected.
- **Community thread:** The short example is explicitly labeled Day 4, Day 9, and Day 16. It shows different peer perspectives, a host boundary, “Prepared; no report,” and Dev’s unanswered question. Fictional and prepared status is stated on screen and in narration.
- **Ravi preview and boundaries:** Ravi’s preference is group replies only, not private messages. The edited question is reflected in the audience preview with alias and group audience; the preview excludes private context. Consent remains unchecked and the continuation control is disabled. The screen and narration state that nothing is sent.
- **Support and ending:** The support segment says no provider is verified or bookable, then returns to peer perspectives. The closing choice shows a selected takeaway and an optional Dev draft; consent is unchecked, posting is disabled, and the exact local draft is described as unsent. No depicted interaction is presented as a real community or external service action: the film labels the scenario illustrative/fictional and the preview as prepared/local.
- **Motion and silence:** The film uses reframing and state changes to direct attention; inspected motion does not invent app state. Silence detection at -40 dB found one 6.04 s interval (89.76–95.80 s) on the Ravi preview at the transition to support; the remaining detected pauses are shorter than five seconds. The held preview is a plausible intentional reading pause.

## Limits

This is a review of the rendered candidate and captions. The manifest reports lint, typecheck, unit, E2E, build, and capture checks, but those are source/build assertions and do not demonstrate live model, community, messaging, moderator, or provider integrations. The video itself discloses that those integrations are absent.
