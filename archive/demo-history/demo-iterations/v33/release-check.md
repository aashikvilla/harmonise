# v33 exported film release check

**Candidate:** `/workspace/hormonise/demo-iterations/v33/demo.mp4`
**Verdict:** **HOLD — one blocking claim/UI inconsistency.**

The MP4 is 1920×1080 H.264 at 25 fps, 87.16 s, with a 48 kHz mono AAC track (87.61 s). Both streams decode through end without FFmpeg errors. Audio is present (mean −19.5 dBFS, peak −2.0 dBFS); the final audio tail is silent from about 84.86 s and extends about 0.45 s past the video. No material timing drift is apparent in the sampled visual timeline. The video has clear burned-in captions and the core story progresses from the fictional Arjun scenario, through prepared chat/reflection and illustrative community material, to a private-choice closing. At native size, captions and essential UI are readable. At 960×540, captions, headings, and controls remain readable; dense page copy becomes small.

Persistent banners and page labels repeatedly say “FICTIONAL PREPARED DEMO,” “NO MODEL CONNECTED,” and “NO LIVE COMMUNITY/ACTIVITY.” The Muse Spark reference is explicitly labeled as a planned role and is paired with “no model is connected” (around 20 s), so it does not falsely claim a model is active. Community examples are labeled illustrative, and the community page says “No live activity.” The closing card (around 86 s) says “Maybe later selected,” “Kept privately for this preview,” and “Private reflection stays private. Nothing is sent.” The consent caption at about 70 s says consent remains unchecked.

**Blocking defect:** The absolute no-send claim is undermined by the film’s own chat UI. Around 10–20 s, the screen shows typed personal text, “Enter to send,” and an enabled “Send” button; the sequence then shows a prepared response. The top banner and “Prepared local example” clarify that no model is connected, but do not reconcile the apparent send action with the closing “Nothing is sent” claim. This is visible in the exported film itself and should be resolved before release (for example, clarify that the interaction is local/prepared or remove the send affordance/action from the depicted sequence).

Evidence sampled at 0, 10, 20, 40, 54, 70, and 86 s; reduced-size readability checked at 960×540. The container and full decode were checked across the complete file. Dialog-level audio-to-caption wording was not independently transcribed; this check confirms an intact audio stream and no apparent broad timing drift, not exact spoken-word caption matching.

## Archive context

This path-only release check is archived as historical evidence for the overwritten 574d candidate. Its report does not record a candidate SHA. The report gives video duration 87.16 s, audio duration 87.61 s, and 2,190 frames at 25 fps; those values conflict because 2,190 frames at 25 fps imply 87.60 s. The reported 450 ms tail is retained as reported but cannot be verified against the unavailable bytes. The current b180 media is separately frozen as v33b and awaits fresh checks.
