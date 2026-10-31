# v20 release verification

Source inspected: `../demo.mp4` only. The requested `demo-iterations/prompts/04_RELEASE_VERIFIER.md` was not present at the specified path, so this review uses the requested objective checks. The MP4 was not modified.

## Media integrity

- **Pass — duration:** 177.500 s (2:57.5), under the 180 s limit.
- **Pass — playable/decodable:** MP4 container; H.264 video, 1920×1080 at 30 fps; AAC mono audio at 48 kHz. A full decode completed with no ffmpeg errors (5,325 video frames).
- **Pass — stream timing:** both streams start at 0.000 s and report 177.500 s duration; no offset or duration mismatch was reported by ffprobe.

## Rendered content

- **Opening promise by 5 s — pass:** at 4.5 s, the large opening card reads “For adults facing family pressure. I can’t tell my family what I want without feeling ungrateful. Think privately. Correct the reflection. Choose whether to explore peer experiences.” The opening has a prepared/fictional/no-model disclaimer from the first frame. The disclaimer’s first line is temporarily left-cropped in the 4.5 s transition frame, but is fully visible at 0 s and in the 5 s sample.
- **Visible labels — pass:** the video repeatedly labels the material “PREPARED PRODUCT-STORY GRAPHIC · FICTIONAL ARJUN” and “PREPARED SCENARIO · NO MODEL CONNECTED.” The Ravi form calls itself an illustrative flow; the preview says no direct message is sent. The ending card says “ARJUN · FICTIONAL PREVIEW SESSION” and “Preview session only · nothing sent.” These labels make the staged content and lack of live model/contact clear.
- **Ravi preview — pass with one scene:** one continuous exact-audience preview is shown around 85–100 s. At 90–96 s the preview specifies “Family Expectations group · Ravi may reply in group,” alias “QuietRiver,” and the exact question “What helped you ask for time before answering?” It also says the private conversation/journey are excluded and no direct message is sent. The review checkbox is visibly unchecked in the 96 s frame. I did not see a second distinct Ravi preview scene.
- **Private-choice journey ending — pass:** the final sequence keeps the private takeaway “I can ask for time before deciding,” labels the screen a fictional preview session, and ends with the caption “The private takeaway remains for this preview session” at 177 s. At 150 s the journey view shows the selected takeaway and “No next step selected.”
- **Captions — generally legible and ordered:** visible captions follow the scene sequence in the sampled timeline (opening privacy/reflection promise, prepared story, optional peer experience, exact preview/consent, then private takeaway). They use high-contrast white text on gray bars, remain in frame at the start and tail, and are legible in 1920×1080 and the representative 960×540 end frame. **Presentation issue:** around 96 s, the caption “The disabled send control remains visible.” overlaps the disabled “Continue to prepared response” button and partly obscures its label. This is the one visible caption/UI collision found in the sampled frames.
- **Native/half-size screenshots — pass:** source is 1920×1080; sampled interface content remains readable at 960×540, particularly the question, audience preview, takeaway, and ending caption. Fine body copy is naturally smaller at half size.

## Audio

An AAC audio stream is present throughout the file. Full-file audio analysis measured -3.08 dBFS peak and -19.27 dBFS overall RMS, with regular speech-length non-silent segments and intentional pauses (for example, the final silence begins at 174.82 s). No audio decode error was reported. I could not subjectively audition intelligibility in this review, so narration audibility is **not fully verified**; the file does contain a healthy-level, non-empty audio signal.

## Blockers / release concerns

No technical playability, duration, or sequence blocker found. One visual release concern remains: the caption/UI overlap at approximately 96 s partly obscures the disabled control label. Subjective narration intelligibility remains unverified.

## Evidence files

`contact_sheet.png` samples the full timeline at 5 s intervals. `frame_000.png`, `frame_0045.png`, `frame_087_half.png`, `frame_090.png`, `frame_096.png`, `frame_150.png`, `frame_172.png`, `frame_175_half.png`, and `frame_177.png` preserve the representative native or half-size frames referenced above.
