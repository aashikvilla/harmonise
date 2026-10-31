# Cold review — Harmonise

**Evidence boundary:** This review uses only the supplied 93.36-second MP4 and its scorecard. The MP4 contains an AAC mono track, but I could not hear it in this review environment. I therefore rely on the visible on-screen text and burned-in narration-style captions, without inferring any additional spoken content. Confidence is medium; audio-dependent judgments are limited.

## Executive decision: Maybe

The film merits a maybe for a frontend-stage hackathon entry. First, it identifies a specific and emotionally credible problem—an adult feeling ungrateful when expressing a family-related choice—and shows a coherent path from private reflection to an optional, bounded community question (0:00–1:30). Second, correction and sharing controls protect agency: the user can reject a reading, rewrite it, preview an exact audience/alias/question, and keep the reflection private (0:24–0:40; 0:56–1:30). Third, the film is candid that the scenario and content are prepared, with no connected model or live community; that candor makes the prototype legible but leaves the central AI and peer-support value unvalidated in this film.

In the first 15 seconds, “I can’t tell my family what I want without feeling ungrateful” states the conflict, while the adjacent panel names adults facing family pressure and promises private clarification, correction, and a choice about sharing. Audience and promise are clear; why AI is needed becomes clearer only with the later correction and theme-matching screens.

## Scene audit

- **0:00–0:08 — Strong hook, candid frame.** The problem statement and “Start privately” / “Browse example stories” create a clear entry point. Persistent top text says “FICTIONAL PREPARED DEMO · NO MODEL CONNECTED · NO LIVE COMMUNITY”; this is essential context but visually competes with the title.
- **0:08–0:24 — Private reflection.** The entry field, prepared response, and “Something with someone / How I’ve felt / Not sure” choices suggest a calm, paced intake. The response and choices are explicitly labeled prepared. The film does not show live model execution.
- **0:24–0:40 — Correction is the strongest interaction.** “Have I got this right?” separates what the person said, what might matter, and what remains unconfirmed; “Not quite” leads to the user’s correction. The editable reflection then changes to “You want time to decide what you want, without someone choosing stay or leave for you.” This is a meaningful, visible branch that respects the user’s wording.
- **0:40–0:56 — Matching and social context.** The interface explains why a broad legal result is set aside for family-pressure experiences. “Where your experiences meet” and “Where your lives differ” are useful comparison labels; the text also says Arjun has not said he has a trusted friend. A prepared fictional perspective and Ravi’s account appear, with the persistent no-live-community disclaimer. The film could more sharply distinguish synthesized matching from editorially prepared examples at the moment they appear.
- **0:56–1:12 — Consent preview.** The alias “QuietRiver,” exact group audience, and question are shown together. The user is told the private conversation and journey are excluded; a checkbox says nothing is sent in this preview and remains unchecked. The film then shows “Maybe later” and “Nothing is sent.” This is strong privacy and control evidence, but not evidence of a successful real-world post.
- **1:12–1:33 — Outcome and limits.** Prepared group content shows a possible takeaway, an unresolved side thread, and a private “Maybe later” outcome. “I can ask for time before deciding” is a modest, credible payoff. The ending is more a sequence of readable product states than an emotional scene; no live peer response is shown.

The recurring prepared-response treatment and dense screens may blur the distinction between illustrative narrative and product output; a closing recap could reinforce it.

## Fixed weighted rubric

| Criterion | Subscores | Score |
|---|---:|---:|
| Impact (30) | Problem specificity 8/10; human need and believable outcome 8.5/10; practical adoption/network benefit 6.5/10 | **23/30** |
| Meta use (25) | Correctly named model roles 5/7; necessity 6/8; visible mechanism or structured UI 4.5/6; evidence/limitation candor 4/4 | **19.5/25** |
| Demo (25) | Hook/story 5.5/6; clarity/legibility 4.5/6; pacing/accessibility 3/5; emotional payoff 3.5/5; polished/coherent UI 2.5/3 | **19/25** |
| Technical depth (20) | Workflow 5.5/6; controls/privacy 5/5; architecture/failure handling 4/5; implementation evidence 3/4 | **17.5/20** |
| **Weighted total** | 23 + 19.5 + 19 + 17.5 | **79/100** |

Weighted-total confidence is **medium**. Workflow and safeguards are visible; architecture is discussed through labels and captions, not an operating service. Technical-depth credit is for film-visible prototype evidence: user correction, a changed reflection, exact share preview, and a recoverable “Maybe later” path—not for unseen infrastructure.

## Separate film-persuasion score

| Dimension | Score | Timestamped evidence |
|---|---:|---|
| First-15-second clarity | **22/25** | 0:00–0:08 names family pressure and adult audience; promise is private thought, correction, and optional sharing. |
| Human journey and payoff | **22/25** | 0:24–0:40 lets Arjun correct the interpretation; 1:12–1:33 lands on asking for time while leaving the relationship decision unresolved. The journey is believable as a prepared example, not an observed person’s testimony. |
| Differentiation and role value | **20/25** | 0:24–0:40 gives the user a correction role; 0:40–1:12 shows prepared peer/community examples and bounded sharing. At about 0:28 the caption says Muse Spark is planned to organize themes; it explicitly says no model is connected. |
| Cinematic and narrative craft | **17/25** | 0:00–1:33 maintains a coherent screen-recorded sequence with large dark-green captions. The interface is dense, little human imagery or visual variety provides emotional lift, and AAC audio could not be heard. |
| **Film-persuasion total** | **81/100** | **22 + 22 + 20 + 17 = 81.** Confidence: medium-low due to inaccessible audio and the entirely prepared scenario. |

The persuasion target of **85 is not met**; this does not alter the weighted total.

## Authenticity, Meta attribution, and craft

The video’s apparent “dialogue” is text displayed in the interface and caption overlays; I cannot assess spoken dialogue because AAC audio was inaccessible. The story is visibly linear and prepared: fictional Arjun enters a concern, corrects prepared text, sees prepared community material, then chooses not to send. The banner and labels make this clear; the group page says “No live activity,” and sample content is illustrative/historical.

The only model named is **Muse Spark**, described at about 0:28 as planned to organize themes. This is a plausible future role, but there is no substantiated model call, reasoning trace, or generated output; prepared reflections and matching cannot be attributed to a running model. The user, peers, host, and moderator have proposed roles, but the group is explicitly not live.

Burned-in captions carry key distinctions, but I could not access the AAC track. Interface text is readable at full size yet dense in overview; caption bars sometimes cover lower UI. Scrolling is not disorienting, but static desktop capture limits visual variety. The correction is the strongest emotional beat; the final takeaway is useful but understated.

## Five highest-impact fix tickets

1. **0:00–0:08 — Make the promise concrete.** Use one concise statement of person, tension, and outcome. Verify a first-time viewer can state audience and promise after 10 seconds.
2. **0:24–0:40 — Clarify where AI would add value.** Show a before/after theme and label it “Muse Spark suggestion — proposed, not live.” Verify viewers distinguish the person’s words from a proposed theme.
3. **0:40–0:56 — Identify prepared peer material at point of use.** Label each card “prepared example perspective” and retain the differences/unknowns comparison. Verify viewers do not infer live participation.
4. **0:56–1:12 — Demonstrate the consent decision more directly.** Hold the preview and contrast cancel/private with consent. Verify viewers can state what is shared, with whom, and what cancel does; claim a sent message only if shown truthfully.
5. **1:12–1:33 — Give the ending a concise, accessible payoff.** End on a brief recap of the retained choice and unresolved question. Make narration intelligible, captions accurate, and takeaway clear with audio muted.

## Judge reactions and release recommendation

**Skeptical judge objection:** “Thoughtful concept, but no live model, community, or peer exchange is shown. Prepared matching leaves the product’s core support unvalidated.”

**Best-case reaction:** “It preserves ownership of a sensitive decision, invites correction, and makes sharing boundaries visible. The path from reflection to scoped community support is plausible.”

**Release recommendation:** Release as a clearly labeled prototype concept film, with no claim that AI or community functionality is live. The blockers are the film’s own no-model/no-live-community status and prepared reflection, matching, and peer content.
