# v13 independent release verification

Review scope: exported MP4, its SRT and narration sidecars, manifest, supplied full/half-resolution frame samples, and the referenced Git commit. This is a media-visible review; repository tests and product behavior outside the export are not treated as evidence.

## Result

The candidate passes the requested playback and boundary checks. The MP4 hash matches the manifest (`dd21e18a…d691d47`); stream inspection reports H.264 1920×1080/30 fps video at 178.766667 s and AAC mono/48 kHz audio at 178.752 s (14.667 ms difference). A full FFmpeg decode completed without errors. The SRT and narration hashes, capture hash, timeline hash, and render-script hash also match the manifest. The candidate commit named in the manifest exists in the repository.

The SRT has 41 chronologically ordered cues, no overlaps, a 0.2 s minimum gap, and ends at 177.580 s. The final narrated line ends at 176.969 s, 1.798 s before picture end. Captions are burned into the export. The supplied 1920×1080 and 960×540 samples show readable, high-contrast caption text in a consistent lower band. One localized collision appears around 00:52: the Day 9 narration caption covers part of the community page’s lower role-summary copy. It does not cover the date cards or the host boundary being narrated. Other sampled key text, including the opening promise and closing consent/no-send boundary, remains legible at both sizes.

The opening presents Arjun’s specific family-pressure statement, labels the scenario fictional/prepared with no model connected, and states the private-reflection-before-optional-peer-experiences promise. The correction sequence visibly moves from a prepared local example through “Not quite” and revised words to a changed reflection. The planned Muse Spark role is explicitly qualified as planned/not connected; the film does not present the prepared reply as live model output.

The community passage presents one fictional prepared historical thread with Day 4, Day 9 and Day 16 states, contrasting member perspectives, the host’s listening boundary, and Dev’s unanswered question. The fiction/prepared/not-live label is visible in the sampled sequence. The Ravi preview states group audience and alias, excludes private context, shows unchecked consent and a disabled action, and says nothing is sent. The support screen says no provider is verified or bookable and a return route is shown. The close pairs a private takeaway with an optional local Dev draft, says private context is excluded, consent remains unchecked and posting is disabled, and states no send action is connected. No message send or real-world result is shown.

FFmpeg black-frame detection found no black interval of 0.2 s or longer. Audio silence detection at −50 dBFS found only speech pauses, with the longest at 3.605 s and a 1.777 s tail after the last detected speech; there is no long unexplained blank interval at the end.

## Evidence boundary

The media facts above were checked directly from the candidate and sidecars. Manifest acceptance fields for lint, typecheck, unit/E2E tests, build and capture smoke are recorded claims, not independently rerun or used as evidence for what the video shows. The manifest’s `source_code_changes: false` and scope statement are metadata claims; this review does not infer live integrations or behavior from tests or source code.
