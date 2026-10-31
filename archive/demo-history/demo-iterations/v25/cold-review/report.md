# Harmonise — first-pass cold judge report

## Executive decision: Maybe

The film makes a strong case for a careful, user-controlled process for talking about family pressure. I recommend **maybe**, rather than shortlist, for three reasons. First, the story is specific and its central interaction is persuasive: Arjun rejects an interpretation, corrects it, and the reflection changes (about 0:15–0:35). Second, the prototype shows unusually concrete privacy and consent boundaries, including a canceled question, an unanswered thread, and an unchecked sharing control (about 1:00–2:38). Third, the film is candid that this is a fictional local preview with no model or live people connected, which means it presents little evidence of Meta model use or real-world outcomes. The product direction is credible; the required Meta-specific distinction and a stronger demonstrated payoff are not yet there.

## First 15 seconds: comprehension

At 0:00, “I can’t tell my family what I want without feeling ungrateful” names a recognizable family-pressure dilemma; the screen labels it a “fictional prepared scenario.” By roughly 0:05, “Talk it through privately, or explore at your own pace” states a private-first promise. The audience is only broadly implied, and the differentiator—correction followed by optional community and consent—emerges later. The opening could state that proposition sooner.

## Scene audit

- **0:00–0:10 — Strong premise, modest differentiation.** Fictional and private-first labels are useful cues, though the viewer cannot yet distinguish it from journaling.
- **0:10–0:35 — Best interaction.** A possible meaning is offered, Arjun selects “Not quite,” corrects it to needing time, and confirms the updated theme. This legibly demonstrates correction and agency, while remaining prepared behavior rather than model inference.
- **0:40–1:00 — Community discovery.** “Why this community surfaced” connects the concern to a fictional example; a question is labeled group-only, never by DM. The handoff is plausible, but no live activity appears.
- **1:00–1:25 — Non-send branches.** Arjun edits then cancels the question; nothing is sent. A later thread has no reply, appropriately making no promise of response.
- **1:30–2:38 — Strong consent, unresolved close.** The final screen separates the private takeaway from an optional group draft, shows exact text and audience, excludes private context, and leaves consent unchecked. “Nothing is sent” is explicit. The outcome is recoverable but no human exchange occurs.

## Fixed weighted rubric

| Category | Score | Evidence and arithmetic |
|---|---:|---|
| Impact | **23/30** | Problem specificity 8/10: the family-pressure dilemma is concrete (0:00–0:10). Human need/outcomes 8/10: agency and a useful next step are plausible, but outcomes remain fictional (0:15–0:35; 2:20–2:38). Adoption/network benefit 7/10: topic communities and bounded sharing are shown, with no live participation evidence (0:40–1:00; 1:30 onward). |
| Meta use | **13/25** | Named model roles 0/7: no model is named. Necessity 4/8: reflective interpretation could help, but the film does not distinguish why a model is needed from a structured interaction. Visible mechanism/UI 5/6: the interpretation, rejection, and update are visible (0:15–0:35). Evidence/candid limitation 4/4: the preview says no model is connected (visible in the prototype scenes, including around 0:00 and later prepared-state screens). |
| Demo | **18/25** | Hook/story 5/6 (0:00); clarity/legibility 5/6 (0:10–2:38); pacing/access 3/5 (audio inaccessible to this judge; embedded captions are present); emotional payoff 3/5 (the private takeaway is modest but meaningful, 2:20–2:38); coherent UI 2/3 (consistent and calm, though dense text is small in full-screen capture). |
| Technical depth | **18/20** | Workflow 5/6 (0:00–2:38); controls/privacy 5/5 (cancellation and exact consent scope at 1:00–1:25 and 2:20–2:38); architecture/failure handling 4/5 (no-reply and no-send states are shown, about 1:15–1:25 and 2:35–2:38); implementation evidence 4/4 (visible correction, branch, and prepared outcome). All technical evidence here means film-visible prototype evidence. |

**Weighted total: 23 + 13 + 18 + 18 = 72/100.** Confidence: medium. Interaction and prototype limits are clear; audio, model execution, and actual community use are unevidenced. The 0/7 model-role score reflects missing attribution, not a live-API requirement.

## Separate film-persuasion score

- **First-15-second clarity — 19/25.** The opening names the emotional problem and fictional scenario (0:00); the private-first promise follows by about 0:05. Audience and distinctiveness remain underspecified. Confidence: medium.
- **Human journey and payoff — 21/25.** Arjun rejects and corrects the system’s possible meaning (0:15–0:35), then chooses a private takeaway and a possible, bounded contribution (2:20–2:38). Agency is strong; reciprocal benefit is proposed and unposted. Confidence: medium-high.
- **Differentiation and role value — 18/25.** The film connects private reflection to a topical example group and group-only question (0:40–1:00), then shows a bounded optional contribution (2:20–2:38). The AI role is only suggested by the interpretation UI; the film explicitly says no model is connected, and peers/moderation are fictional or unconnected. Confidence: medium.
- **Cinematic and narrative craft — 21/25.** Repeated dark-green captions guide a coherent journey from private reflection to optional contribution (0:00–2:38); the UI is consistent and the final consent state is readable at full frame (2:35–2:38). Some screens hold on dense small interface text, and audio could not be assessed. Confidence: medium.

**Film-persuasion arithmetic: 19 + 21 + 18 + 21 = 79/100.** Picture and embedded captions were accessible, but AAC audio was not. I make no claims about narration, music, or sound quality; audio-dependent judgment is reduced-evidence.

## Authenticity, model attribution, and accessibility

Fictional participants and prepared/local/example content are labeled throughout; screens also state “no model connected,” “no live activity,” “no live moderator,” and “nothing is sent.” This is credible as a frontend interaction study, not a live social product. The edited linear journey still shows user-controlled branches: rejecting an interpretation, canceling a question, retaining a private takeaway, and leaving consent unchecked. No real exchange or transformation is shown.

No model or role is named, and no model call is evidenced. The “possible meaning” is a prepared interaction; the explicit limitation precludes claims about a Meta model, reasoning, or live integration. This limits Meta-use credit, while candid disclosure earns full evidence/candor credit.

The interface is calm, consistently framed, and uses restrained color. Embedded captions are high contrast and mostly readable; smaller UI text on community and consent screens can require close viewing. Motion is limited to navigation. The arc reaches self-authored language and a possible contribution, but remains unresolved. Audio was inaccessible, so dialogue, music, sound levels, and audio accessibility cannot be judged.

## Five highest-impact fix tickets

1. **0:00–0:10 — State the audience and promise sooner.** Use one title card: “For people navigating family pressure: clarify privately, then choose whether to hear from peers.” Keep the fiction label. Expected: audience and proposition are clear within 15 seconds; verify before the first interaction.
2. **0:15–0:35 — Attribute the interpretation honestly.** Label the interpretation as prepared or proposed, state its role, and retain “no model connected.” Expected: no confusion with execution; verify at the suggestion moment.
3. **0:40–1:00 — Make the community’s status and benefit concrete.** Hold the matching rationale beside one clearly fictional peer perspective. Expected: community value is concrete without implying live users; verify both labels are readable together.
4. **1:00–1:25 — Show the complete question decision in one concise sequence.** Keep group-only audience, edited question, cancel action, and unchanged draft readable. Expected: privacy and recovery are clear; verify the exact audience and no-send result.
5. **2:20–2:38 — Close on the user’s choice.** Hold on the private takeaway beside the unchecked draft, then end with “nothing posted.” Expected: human outcome and sharing boundary land; verify consent stays unchecked and legible.

## Judge reactions and release recommendation

**Skeptical judge objection:** The thoughtful prototype does not establish Meta model use or show a real person benefiting. “Possible meaning” is prepared, community members are fictional, and contributions stay local and unsent. User-control design is visible; working AI and network effect are not.

**Best-case reaction:** Harmonise keeps a sensitive conversation under the person’s control: correct the system, consult peers or not, cancel, save privately, and review content and audience before sharing. Candor about what is not live makes the prototype easier to trust.

**Release recommendation: hold for a revised film before shortlist consideration.** Blockers are absent model attribution or execution evidence, no actual peer interaction, and a prepared local-draft ending. The footage supports only its fictional prototype states.
