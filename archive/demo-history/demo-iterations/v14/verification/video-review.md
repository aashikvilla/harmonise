# Independent v14 media review

Scope: review of `demo.mp4`, burned-in captions, `captions.srt`, and media claims visible/audible in the export. This review does not score persuasion. Manifest assertions about lint, tests, build, or source behavior are recorded separately and were not used as evidence.

## Technical checks

- **PASS — identity and runtime:** MP4 SHA-256 `281753a0b2372b2ae3431b30cfdc9f3159ae53105765217b8ccfdecc16acf84a` matches the manifest. H.264, 1920×1080, 30 fps, 5,338 frames; duration 177.933333 s (within 176–179 s).
- **PASS — audio/video:** AAC mono, 48 kHz, 177.920000 s; stream duration delta is 0.013333 s (<50 ms).
- **PASS — decode:** complete FFmpeg decode to null completed without errors.
- **PASS — captions:** SRT SHA-256 matches the manifest; 42 cues, maximum two lines, no overlaps, final cue ends at 177.580 s. Burned-in captions are visible in reviewed frames at both 1920×1080 and 960×540 and stay in a dedicated lower band without covering the key correction controls, host quote, audience preview, or final choice.
- **PASS — speech gaps:** audio silence scan at −42 dB found no silence gap longer than 3.562 s; final detected silence is 0.954 s. Last audible speech is approximately 176.97 s, while the final SRT cue ends at 177.58 s and video at 177.933 s. The manifest's `last_speech_seconds: 177.58` appears to describe the cue end, not the last audible sample.

## Visible and audible claims

- **PASS — opening proposition and labels:** frame 0 presents the family-pressure line and private-first proposition. “Fictional scenario,” “prepared examples,” and “no model connected” are on screen at frame 0; the planned Muse Spark label says it is not connected. At 960×540 these remain legible.
- **PASS — correction is causal:** the prepared response is labeled local/no-model; the “Not quite” response is selected; the text changes from “partner” to “parents” and then the editable reflection shows Arjun's own revised words. Planned model language is marked “planned, not connected.” The captions track the states.
- **PASS — fictional thread and host boundary:** the three dated views are labeled “Historical example · fictional participants · prepared content.” Day 4 shows the contrasting peer account; Day 9 shows the fictional host saying “I can listen; I can’t decide for you”; Day 16 shows Dev's question with “no replies yet.” The thread states no live people or moderation are connected.
- **PASS — report claim:** the triage beat says it is a prepared example and that no report was sent; it explicitly says no real moderator is contacted or assigned.
- **PASS — Ravi audience/consent preview:** the exact preview shows the Family Expectations group, alias QuietRiver, exact question, excluded private conversation, and no direct message. The review checkbox is visibly unchecked in the form; later the optional Dev draft shows consent unchecked and posting disabled.
- **PARTIAL — support return timing:** the support screen truthfully says no provider is verified and no appointment can be requested, with a visible Back link. The caption “Arjun returns to the thread” starts while the support page is still on screen at 106–110 s; the thread/selected takeaway is visible by 113 s. The route is shown, but the narration leads the visual return by several seconds.
- **PASS — final choice and no-send:** the ending shows the private takeaway beside an optional local draft for the fictional group, private context excluded, consent unchecked, post disabled, and “Nothing is sent without consent.” No send, reply, provider, or outcome is shown.
- **PASS — overall prototype disclosure:** all substantive example content is framed as prepared or fictional; no model, live community, real human/moderator, provider, or message integration is claimed as active in the media.

## Conclusion

Media integrity and the requested on-screen claims pass, with one small timing caveat on the support return narration. The final file meets duration, A/V sync, decode, and caption-overlap requirements. This is a video-only review; code-only test/build claims in the manifest were not considered.
