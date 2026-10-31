# v40 candidate release verification

**Verdict: HOLD**

Verified only `/workspace/hormonise/demo-iterations/v40/candidate.mp4` against the supplied expected SHA256. No source, prior version, or notes were consulted.

## File and decode

- SHA256: `889060565ca987216376f5d649f2eb83da290aafe2dcc540649aebf51415fd2f` — matches expected.
- Container: MP4, 2 streams, 4,371,082 bytes, 91.800 s.
- Video: H.264 High, 1920×1080, 16:9, progressive, yuv420p, 30 fps, 2,754 frames.
- Audio: AAC-LC, 48 kHz, mono, 91.800 s.
- Full decode of both streams to null completed with no reported decode errors.
- No subtitle/caption stream is present. On-screen text is burned into the video.

## Visual and content review

Sampled the full sequence at five-second intervals and inspected 1920×1080 and 960×540 frames at 55 s and 90 s, plus the final seconds. The compositions stay within frame bounds without visible clipping or overlap. At 960×540 the main labels, controls, status lines, and final choice remain readable; smaller text in dense page screenshots is correspondingly fine but not cut off. The final display holds through the end of the file; it does not fade or cut to black.

The frames visibly identify the example as fictional/prepared local content. They say Muse Spark is planned but not connected, no provider is verified/bookable, private reflection is excluded, consent is unchecked, and nothing is sent to a real group/person. The final local frontend state explicitly says “Maybe later selected” and “nothing sent”; the private reflection stays private. The optional takeaway is presented as an Arjun fictional sample. These claims are internally consistent in the inspected frames.

## Sound and cue alignment

The AAC track decodes and contains non-silent signal (overall RMS about −18.5 dBFS; peak about −4.2 dBFS). There is a final silent interval of approximately 1.44 s while the last choice screen holds. Short pauses also occur throughout the track.

**Audio was not actually heard.** The audio handoff reported that this model does not support audio input, and no local speech-recognition tool is available. With no subtitle stream, I could not confirm spoken wording, voice quality, audibility in playback, or word-to-screen cue timing. The visual transitions and pauses can be inspected, but they do not establish exact audio synchronization.

## Release decision

**HOLD** pending a human listen and audio-to-screen cue check. Structural checks and the visible fictional/local/privacy/consent/no-send state passed; the audio content and synchronization remain unverified.
