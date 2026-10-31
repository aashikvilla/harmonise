# Independent v19 media verification

Scope: visible MP4 content, captions, and media integrity. I did not score persuasion or treat application tests and code declarations as evidence of rendered behavior.

## Media integrity

- `demo.mp4` decodes fully with FFmpeg and contains H.264 video at 1920×1080 (176.233 s) and AAC audio (176.234 s); stream delta is 0.000667 s.
- MP4 SHA-256 matches `manifest.json`: `68309c9e12a05d61d73734936f89ec9a55fd483917aec21b11752bf987c6613e`.
- SRT contains 40 cues, no timing overlaps, ends at 175.325 s, and its SHA-256 matches the manifest: `c8868ee4361b433c6ebf55d41a8cc0a918c5dc4597277fe3e1c3dbdd2685d9eb`.
- Narration/captions extend close to the end with about 1.5 s of silent tail. Captions are high-contrast and generally sit below the captured application. At 960×540 previews the interface text is small but legible in inspected frames; at native 1920×1080 the captured UI is readable. I saw no material caption collision that hides the correction, consent state, or closing state.

## Visible content findings

- The 12-second kinetic opening is visibly labeled “PREPARED PRODUCT-STORY GRAPHIC · FICTIONAL ARJUN” and “PREPARED SCENARIO · NO MODEL CONNECTED.” It is plainly presented as a prepared fictional scenario, not a testimonial or model output. The product promise appears by 4.8 s: think privately, correct the reflection, and choose whether to explore peer experiences. The React-style application view begins by 12.5 s.
- The visible sequence shows Arjun selecting “Not quite,” editing his words to name parental pressure and wanting time to decide, and a changed editable reflection. It then shows the private takeaway selected. The causal correction-to-reflection-to-private-choice chain is visible.
- The manifest reports 164.234 of 176.234 s as UI (93.19%). That share is arithmetically consistent with the declared durations, and the sampled film is predominantly captured application UI. The video alone cannot establish the React framework or Playwright capture provenance; those are manifest/source declarations.
- One prepared, fictional Day 4/9/16 thread is visible, including peer experience, a host boundary, and Dev's unanswered question. The interface labels the thread historical/prepared, states there are no replies, and describes moderator handling as illustrative. No report or live-response outcome is shown.
- Ravi's group-only question form visibly keeps alias “QuietRiver,” audience “Family Expectations group,” edited question “What helped you ask for time before answering?”, excluded private context, unchecked consent, and disabled continuation together. Nothing is sent. **Literal-count caveat:** the form appears in two consecutive states: first with the earlier question “What helped you ask for time?”, then with the edited question. If “exact Ravi consent preview once” means only one appearance of the form, this condition is not met; the final edited preview itself is shown once.
- The support screen says no provider directory or credential checks are connected, no provider is verified, and no appointment can be requested; it offers a return to peer perspectives. The film returns to Arjun's journey.
- The close shows the kept takeaway as private, a separate optional draft to Dev, private context excluded, consent unchecked, post disabled, and “Nothing is sent.” Thus the closing state retains the private takeaway and makes the optional draft visibly unsent.

## Holds and limitations

At one-second sample intervals, I found no unchanged run longer than two seconds in the rendered sequence; the static moments are short pauses in the opening/UI. The rendered audio is present and decodes, but I did not independently assess voice quality or infer that a spoken claim proves a product integration. Manifest statements about lint, tests, build, capture source, and integration status are declarations, not claims verified by the MP4.
