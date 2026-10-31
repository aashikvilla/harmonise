# v12 verification

- Candidate: `demo.mp4`, 177.633333 s video / 177.621000 s audio (12.3 ms stream delta), 1920×1080 H.264 at 30 fps, mono AAC at 48 kHz. Container duration is 177.633333 s.
- Full decode: `ffmpeg -v error -i demo.mp4 -f null -` completed successfully. Black-frame scan found no black segment longer than 0.5 s. Audio peak is -3.8 dBFS and mean is -19.3 dBFS. The final caption ends at 177.388 s; the final audio is under one second after the last spoken line.
- Captions: 39 SRT cues, monotonic and non-overlapping; no repeated punctuation. Captions are burned into the video and provided as a matching sidecar.
- Footage: actual Playwright React capture at 1600×900 / 25 fps, 177.680 s raw. Fast capture smoke visited all 18 filmed states and asserted the unsent contribution controls. The candidate is edited from that UI footage; no live model, Meta, message, provider, moderator, or community service is connected.
- Visual review: inspected key frames in `verification/contact.png` at 1920×1080 and `verification/contact-960.png` at 960×540. The hook/promise and disclosure are visible, correction changes the editable reflection, community dates and boundaries are labeled, the Ravi preview shows group audience/alias/text/consent, and the close shows the selected optional draft with consent unchecked and posting disabled.
- Validation: lint, typecheck, unit tests (27/27), desktop and mobile E2E (32/32), and production build passed before capture. No source changes were made after those checks; only the edit script was updated to align output streams.
- Limitation: professional directory is an illustrative screen only; no provider is verified or bookable. Historical community examples are prepared fictional fixtures, not live members or moderation.
