# v34 MP4 release check

**Verdict: READY**, with the limitations below.

## Artifact and decode

- Target: `/workspace/hormonise/demo-iterations/v34/demo.mp4`
- SHA-256: `d362f09d6fd7119a1ce3d65db0876172a2e48548327a5ec15f5ed734932cc913` (matches the requested digest).
- Valid ISO Base Media/MP4 container; 1920×1080, 16:9, progressive H.264 video at 30 fps and mono AAC-LC audio at 48 kHz.
- Runtime: 178.766667 seconds (2:58.77). 5,363 video frames and 8,380 audio packets reported.
- Full FFmpeg decode of both streams completed with exit code 0 and no decode errors.
- Compatibility limitation: the video stream reports H.264 High 4:4:4 Predictive profile despite `yuv420p`; FFmpeg decodes it successfully, but this profile may have narrower hardware/browser support than the common H.264 High profile. No target-device playback test was available.

## Timing and audio accessibility

- Both streams start at 0.000 seconds. Video duration is 178.766667 seconds; audio duration is 178.752 seconds, a 14.7 ms end difference.
- Sampled caption beats track the visible scene changes, and there is no on-camera speaker requiring lip-sync evaluation. Stream timestamps and scene alignment are consistent.
- Audio is present and non-silent in aggregate (mono AAC-LC, 48 kHz; measured mean −19 dBFS, peak −4 dBFS).
- Narration is captioned with large burned-in text. Captions are visually readable at both 1920×1080 and 960×540. They are not selectable/toggleable: the MP4 has only video and audio streams and no subtitle stream.
- Limitation: the audio could not be auditioned in this environment. This check therefore cannot certify subjective intelligibility, mix quality, or word-for-word agreement between speech and captions. It verifies stream presence/timing and sampled visual caption alignment only.

## Visual review and claims

Representative frames were reviewed at source resolution and at 960×540, including the opening private-reflection screen, prepared-example conversation, community thread, sharing/consent flow, support directory, and closing prepared preview.

- Essential page headings, primary controls, form contents, and narration captions remain readable at 960×540; at 1920×1080 they are clear. Dense explanatory copy is smaller but still legible at half resolution when viewed at normal frame size.
- The opening screen labels the scenario fictional and says the prepared examples have no model connected. Conversation views label the example as local/prepared, and the community view identifies fictional participants and says no live people or moderation are connected.
- The support page says no provider is verified and no appointment can be requested. The sharing flow previews the exact audience, alias, and question, says private conversation is excluded, and says no message is sent. The final preview states nothing is sent without consent; the sampled consent checkbox is visibly unchecked and the post control is shown in its disabled-looking muted style.
- No sampled scene claims real participants, live responses, verified/bookable support, model-generated answers, or a completed send. The fictional/prepared/no-model/no-live/no-send disclosures are visible and consistent across the sampled scenes.

## Exact limitations

This is a media-file review, not an execution test of the underlying UI. Claims about what the app would do after interaction cannot be independently proven from the video. No physical-device playback test or subjective audio audition was possible. Captions are burned into the picture, so users cannot toggle them or select a caption track.
