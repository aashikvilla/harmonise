# v03 release verification

**Result: truthfulness and media checks pass; film coverage is incomplete against the product contract.** I reviewed the current React app, the v03 candidate and its evidence/manifest, plus the three specified prototype-boundary requirements. No source or video files were changed.

The film clearly labels the opening contrast as an illustrative fictional case. It identifies the preview and fictional sample scenarios, and the planned architecture scene says Meta integration is not connected. Its narration and visible copy correctly describe the community as prepared history, Ravi as fictional, the sample reply as not sent by a person, and moderator decisions as fictional browser-only examples. The moderator scene explicitly says no report reaches staff and that the screen does not enforce staff permissions. No real Meta calls, community activity or replies, moderator actions, clinician actions, or backend behavior occurred or are claimed.

The film includes the central correction (parents, not separation), transcript editing, the broad legal-topic mismatch and family-context change, the disappointing argument, historical group content, Ravi's imperfect account, Arjun's contribution draft, and the planned Meta Muse Spark and Voice Transcribe labels. The architecture overlay makes permissioned retrieval, approved stories, and a human moderator decision legible as future design. The 178-second duration is within the 175–179 second target. The MP4 is 1920×1080 at 30 fps, H.264 with mono 48 kHz AAC; a full ffmpeg decode succeeded. Measured audio mean/max are −21.8/−5.2 dB, and the file hash matches the manifest. Burned-in captions are present and `captions.srt` is supplied; reviewed HD frames are readable. At the 960×540 evidence size, small architecture text and the opening case label are much harder to read.

The film still omits product behavior that exists in the app and is required or materially relevant to the contract:

- It narrates review of the audience, alias and exact words, but does not show the exact consent preview/checkbox before the sample question flow. The app has this preview and consent control.
- It does not visibly establish Ravi's group-only/DM preference in the question scene; the app states he accepts group replies only and provides no private request path.
- It does not show the separate qualified-professional role or the official support pathway. The app has distinct support role descriptions and a qualified-support destination, although it truthfully says no providers are verified or bookable.
- It does not show role-limited access in operation. The moderation scene correctly discloses that this prototype has no staff-permission enforcement; the app's professional and moderator views are illustrative screens, not actual restricted access.
- The film does not demonstrate the app's optional response-style choices or its editable understanding controls. It includes an editable voice transcript and a tentative understanding screen, but not those controls as user actions.

These are coverage gaps rather than false claims. The film's privacy language is careful: private chat is described as separate from community sharing, and it says nothing was sent. The full consent payload is present in the app, but its absence from the footage makes the consent mechanism less verifiable to viewers.

Accessibility and responsive evidence is partial. The current app source includes focus-visible styling, reduced-motion handling, semantic labels/live regions, and narrow-screen CSS breakpoints. The v03 evidence includes 960×540 scaled film frames, not a mobile app capture or runtime keyboard/screen-reader review; therefore responsive behavior and accessibility are not independently demonstrated here. Captions are both burned in and supplied as SRT.

**Boundary statement:** This is a React fixture preview. No real Meta integration, community/member interaction, human moderation or clinical service, or backend behavior occurred.
