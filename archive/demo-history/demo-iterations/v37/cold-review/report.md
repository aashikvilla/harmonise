# Independent cold review — Harmonise

**Candidate:** `/workspace/hormonise/demo-iterations/v37/demo.mp4`
**SHA256:** `9281740447ec8ddd8df5ecd943c423a6a3a2de164e49416d78541a91c3c73f05`
**Review date:** 2026-10-30
**Evidence:** video frames, on-screen text, and embedded captions. An AAC audio stream is present, but I could not listen to it in this review setup. I do not infer uncaptioned dialogue or music.

## Executive decision: Maybe

The film presents a relatable dilemma—an adult wants to make a family decision without feeling ungrateful—and gives the person control over editing, sharing, pausing, or leaving. However, the interaction and community examples are prepared fiction; no model is connected or named, and no real community activity is shown. I would keep it in consideration, but not shortlist it on this film alone.

## First 15 seconds

The first-person line “I can’t tell my family what I want without feeling ungrateful” (0:00–0:06) quickly establishes the dilemma. Around 0:07–0:14, “Think it through privately, correct the reflection, then choose whether to share” gives a concrete promise, with “LOCAL PROTOTYPE · NO MODEL CONNECTED” calibrating expectations. The adult audience becomes clear later; the opening could name the product and distinguish AI, community, and human roles sooner.

## Scene audit

- **0:00–0:06:** Restrained title card establishes the dilemma and tone. It is legible and emotionally focused, though it delays seeing what the product does.
- **0:07–0:17:** Product preview and local interface show the privacy-first promise and disclose that content is prepared. The whole browser is often reduced within the frame, making detailed controls small.
- **0:18–0:34:** A prepared chat introduces the concern, asks a short follow-up, and offers an interpretation with “Yes, that’s closer,” “Not quite,” and “Edit in my words.” The edit changes “parents keep asking me to choose” into “It’s my parents. I want time to decide what I want.” This is the clearest visible interaction and agency evidence. It is still a scripted example, not a demonstrated live model response.
- **0:35–0:45:** The editable reflection and a suggested practical step (“I can ask for time before deciding”) illustrate a possible outcome. The film says the user wants time “without advice to stay or leave”; it appropriately avoids forcing a resolution.
- **0:46–0:57:** Two “prepared fictional” perspectives are shown, followed by an explicitly fictional human thread host who says they can listen but cannot decide for Arjun. This communicates intended community boundaries, but no live members or moderator appear.
- **0:58–1:09:** The exact group draft is shown with its audience, alias, review checkbox, and private-conversation exclusion. The unchecked-consent state keeps continuing disabled; captions say nothing is sent. These are strong, specific privacy cues.
- **1:10–1:29:** Support availability explicitly says no provider is verified or bookable. The “Maybe later” path keeps the reflection private, and the ending says “Your words. Your timing. Nothing sent.” This is a coherent, low-pressure payoff. The repeated still-like interface shots slow the closing stretch.

The journey and safeguards are clear, but the film cannot establish usefulness or safety in real situations. It shows pausing, keeping private, and leaving, but no failure recovery, real share, or community response.

## Fixed weighted rubric

| Category | Subscores | Arithmetic | Score |
|---|---|---:|---:|
| Impact (30) | Specificity 7/10 (0:00–0:06); human need/outcomes 7/10 (0:18–0:45); adoption/network benefit 4/10 (0:46–0:57) | 7 + 7 + 4 | **18/30** |
| Meta use (25) | Named roles 1/7 (0:07–0:17); necessity 4/8 (0:18–0:34); mechanism 4/6 (0:18–0:34); evidence/candor 4/4 (0:07–0:17) | 1 + 4 + 4 + 4 | **13/25** |
| Demo (25) | Hook/story 5/6 (0:00–0:06); clarity 4/6 (0:07–0:17); audio/subtitles 3/5 (captions throughout; audio inaccessible); payoff 3/5 (1:10–1:29); UI 2/3 (0:18–1:29) | 5 + 4 + 3 + 3 + 2 | **17/25** |
| Technical depth (20) | Workflow 5/6 (0:18–1:29); controls/privacy 5/5 (0:58–1:29); architecture/failure 3/5 (1:10–1:20); prototype evidence 3/4 (0:18–0:34; 0:58–1:09) | 5 + 5 + 3 + 3 | **16/20** |
| **Total** |  | **18 + 13 + 17 + 16** | **64/100** |

Confidence is **moderate** overall. The film makes prototype status and privacy states unusually explicit, but the audio could not be assessed directly and the film’s prepared examples limit evidence about real behavior. The 64 is a film-evidence score; it does not penalize absence of live APIs or backend infrastructure. Technical implementation credit reflects only the visible, plausible prototype flow at 0:18–0:34 and 0:58–1:09.

## Separate film-persuasion score

| Dimension | Score | Evidence |
|---|---:|---|
| First-15-second clarity | 19/25 | 0:00–0:06 gives a specific dilemma; 0:07–0:14 explains private reflection and optional sharing, with a no-model disclosure. |
| Human journey and payoff | 19/25 | 0:18–0:34 lets Arjun correct the reflection; 1:10–1:29 lets him choose “Maybe later” and leave without sharing. Strong agency, but fictional and not an observed human outcome. |
| Differentiation and role value | 16/25 | 0:46–0:57 distinguishes prepared peer perspectives from a bounded human host; 0:07–0:17 discloses no model connection, leaving AI’s role and value proposed rather than demonstrated. |
| Cinematic and narrative craft | 16/25 | 0:00–0:06 has a clean, legible emotional hook and captions carry the story; 0:58–1:29 repeats static interface views and the UI is small in the full-frame layout. Audio unavailable. |
| **Film-persuasion total** | **70/100** | **19 + 19 + 16 + 16 = 70** |

Confidence in this separate score is **moderate-low** because audio could not be heard. The captions are visible and readable in the sampled frames, so the narrative can be followed without relying on narration; no claim is made about voice delivery, music, or sound mix.

## Authenticity, model attribution, and craft

The film repeatedly marks the scenario fictional, examples prepared, and the prototype unconnected. It shows no live integration or model call, and names no Meta model. The editable reflection suggests a possible AI role, but the prepared exchange does not establish why an LLM is needed over guided prompts. Peer cards and the human host are illustrative, not live social activity.

White captions on a dark band carry the story clearly. The calm visual system uses organized cards, though wide shots shrink the UI and consent text. Restrained cuts and the option to wait provide a quiet payoff. Audio pacing, intelligibility, and delivery are unassessed.

## Five highest-impact fix tickets

1. **0:07–0:17 — Establish roles early.** Use one opening screen to name the model, human/community roles, and privacy boundary. This should clarify the product distinction; verify that a cold viewer can name audience, promise, and roles after 15 seconds.
2. **0:18–0:34 — Separate interaction evidence from prepared content.** Keep “prepared example / no model connected” visible during chat. Verify label legibility and ask viewers what was running.
3. **0:46–0:57 — Make community status unmistakable.** Hold the “prepared fictional / no live members or moderator” disclosure. Verify with a pause test and ask if quotes came from real members.
4. **0:58–1:09 — Demonstrate the consent boundary at readable scale.** Crop closer on group, draft, unchecked consent, and disabled action. Verify at normal playback size that viewers can state what would be shared and why sending is blocked.
5. **1:10–1:29 — Tighten the closing sequence.** Cut repeated shots and land on “Maybe later” plus “Nothing sent.” Verify the ending’s meaning and pace with a cold viewer.

## Judge reactions and release recommendation

**Skeptical objection:** This is a polished, thoughtful storyboard of a privacy-first support product, not evidence that its AI reflection, peer community, or human support works in practice. The team has been honest about that distinction, but the film leaves the headline Meta contribution unsubstantiated and offers no real user outcome or live model behavior to judge.

**Best-case reaction:** The product understands that people facing intimate family pressure need room to think before they share. It gives the person control over wording, timing, audience, and whether anything is sent, while positioning a human host as a listener rather than an authority. The interface makes those principles concrete instead of relying only on promises.

**Release recommendation:** Keep as a **maybe** for a frontend-prototype round. The film is coherent and unusually candid about prepared fiction and privacy boundaries. The explicit blockers to a stronger recommendation are lack of named/substantiated Meta model use, no observed real user or live community evidence, and small interface text in wide shots. These judgments are limited to the film and its captions; audio-dependent claims remain unassessed.
