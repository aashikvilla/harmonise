# v29 candidate release verification

Candidate: `demo-iterations/v29/demo.mp4`  
SHA-256: `0adebec5a5da9ef7d89d0ceee32064ad527a93ec425aabe34328c28b92f2077f`  
Captured product/source revision: `e7e8cbe3c6b94f41324f030b7bb21aaf96f25af0`
Rendering checkout revision: `be6daf1e0106284ca835113da302283d2c312d2d`  
Container runtime: 100.000000 seconds.

## Media checks

- H.264 High, 1920×1080, nominal 25/1 fps, yuv420p, progressive; 2500 frames. Video stream duration is 99.960000 seconds.
- AAC-LC, 48000 Hz mono, 100.000000 seconds. Audio/video stream-duration offset is 0.04 seconds (one nominal frame); container duration is 100 seconds.
- Full decode completed without errors.
- Integrated loudness is -18.1 LUFS, LRA 5.2 LU.
- Freeze detection (`n=-50dB`, `d=4s`) found no non-final holds over 4 seconds. The two final-choice holds are 4.00 seconds on the captured private takeaway and 4.32 seconds on the authored ending, within the brief’s 5-second final allowance.
- Voice clips fit their caption windows; captions reproduce each spoken line verbatim.

## 960×540 evidence

Frames are exported under `verification/release/frames/` at 21 points, with `contact-960.jpg`. Sampled key frames include the correction pair, the broad-topic/context comparison, the exact consent evidence card, planned/prepared labels, and the private-choice ending. The consent and comparison cards are visibly labeled editorial and copy exact captured text.

## Truth and review status

The persistent disclosure reads “FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY.” The planned Muse Spark role and prepared example are labeled together; no model run is claimed. Peers are labeled fictional/prepared and community activity is labeled absent. The exact question in the recorded consent screen is “Could I take time to decide before answering?”; the recorded consent action is “Cancel · keep my draft.” “Maybe later selected” is visible only in the later captured private takeaway. Those capture/brief differences are recorded in `capture/edit-map.json`.

The candidate is ready for independent cold review. No score is assigned here.
