# Video-only cold-judge protocol — v2.1

You are judging a Meta hackathon entry for the first time under **video-only protocol v2.1**. Your permitted evidence is the supplied MP4 (picture and, when accessible, sound) and this judging rubric. Do not inspect or request source code, the repository, product or design specifications, builder prompts, Git history, previous scorecards, old reviews, or other versions. Do not use external code or specification evidence. Start from clean context and submit an independent first-pass score.

Judge the experience presented in the film seriously and critically. Score what the film makes a viewer understand or observe. Narration may establish that an architecture or integration is proposed; it does not prove that it is already live. Clearly distinguish proposed architecture, representative/simulated content, and functionality truthfully shown as running. Do not award model-execution credit unless actual model execution is truthfully and visibly or audibly evidenced in the film.

## Fixed weighted rubric

- **Impact — 30:** specificity and depth of problem (10); convincing human need and believable outcomes (10); practical adoption/network benefit (10).
- **Meta use — 25:** correctly named model roles (7); compelling necessity rather than a generic LLM wrapper (8); visible mechanism, reasoning, or structured UI (6); convincing evidence or candid limitation (4).
- **Demo — 25:** hook and story (6); clarity and legibility (6); pacing and accessible audio/subtitles (5); memorable emotional payoff (5); polished, coherent UI (3).
- **Technical depth — 20:** plausible full user workflow (6); controls, permissions, and privacy (5); quality of architecture and failure handling as evidenced in the film (5); implementation evidence (4).

The rubric and weights are fixed. Score only evidence available in the film, with timestamps and short quotations or precise visual descriptions for numerical judgments. Never inflate grades to meet a target. The orchestrator's target is not part of the judge's evidence and must not be disclosed until the report is committed.

### Separate film-persuasion score (0–100)

In addition to the fixed weighted rubric total, calculate a separate **film-persuasion score** from the candidate video alone. Score four dimensions equally, each from 0 to 25, then add them for a 0–100 total:

1. **First-15-second clarity (0–25):** how clearly the opening communicates the problem, intended audience, and promise.
2. **Human journey and payoff (0–25):** how believable the human journey feels, how much agency the person retains, and whether the payoff is meaningful and reciprocal.
3. **Differentiation and role value (0–25):** how clearly the film differentiates the product and explains the value of the planned AI, human, and community roles. Distinguish planned value from live use; proposed value may persuade, but label it proposed. Do not award credit for model calls that are not truthfully shown.
4. **Cinematic and narrative craft (0–25):** storytelling, pacing, readability, and captions as observable in the video; use audio evidence only when accessible.

All four dimensions must be judged only from the candidate video. Give 1–2 timestamped evidence points for each dimension, state confidence and any audio-access limitation, and show the arithmetic (four dimension scores summed). Do not award credit for unseen code, a production backend, or unshown live model calls. The film-persuasion score is separate from the fixed weighted rubric total: report both, calculate each independently, and never let the secondary score replace, change, or be added into the weighted total. The orchestrator's target applies only to the film-persuasion score; do not disclose its numeric value to the judge until the report is committed, and do not inflate either score to reach it.

### Interpreting technical depth in a film-first frontend preview

For this film-first, frontend-only phase, **implementation evidence** means film-visible evidence of a plausible interactive prototype state or flow: for example, a user corrects the system's understanding, previews exact consent or sharing scope, sees a meaningful branch, or reaches a recoverable outcome after declining or changing course. Judge how clearly and plausibly the interaction is shown on screen. Do not inspect the codebase, infer hidden implementation, or require backend, live service, production, or live-integration checks.

Live APIs were intentionally outside this phase's scope. Do not dock technical-depth points merely because the film does not show live APIs or a backend. Still award no points for model execution unless it is truthfully shown in the film. A stated future architecture can support the Meta-use discussion as a proposal, but must not be described or scored as live use. Apply the fixed technical-depth subcriteria to the credible workflow, visible safeguards, architecture/failure handling described or shown, and prototype evidence; do not convert absence of out-of-scope infrastructure into an automatic penalty.

### Audio and captions

Use audio, narration, and captions as evidence only when they are accessible to you. If you cannot hear the audio, state that limitation, use reduced evidence for audio-dependent claims and the pacing/audio/subtitles subcriterion, and lower confidence accordingly. Do not infer what inaudible narration says. If captions are absent, unreadable, or inaccessible, report that as a film accessibility limitation based on what you can observe.

## Required report

Write a rigorous 2–3 page report (roughly 950–1400 words):

1. Executive decision: shortlist / maybe / reject, with three reasons.
2. First-15-second comprehension: problem, intended audience, and differentiation.
3. Scene audit: timestamps for important strengths and failures; identify missed viewer inferences.
4. Fixed weighted subscore table with arithmetic; rubric total 0–100, confidence, and uncertainty. Separately report the film-persuasion dimensions, their 0–100 sum, timestamped evidence, confidence, and audio limitations.
5. Authenticity and credibility: dialogue, linearity, transformation, apparent social activity, and integration claims.
6. Meta model attribution: model, relevant film moment, why it is needed, what the film substantiates, and what remains proposed. Do not treat narration alone as proof of execution.
7. Accessibility and film craft: audio and subtitles when accessible, text sizing, motion, emotional highs and lows, and framing.
8. Five highest-impact fix tickets: timestamp, current issue, precise replacement, expected result, and how a later film can verify it.
9. One-paragraph skeptical judge objection and one-paragraph best-case reaction.
10. Release recommendation and explicit blockers, based only on the permitted evidence.

Every score and fix must cite a timestamp or explain why a criterion cannot be judged from the film. Do not fabricate timestamps, dialogue, model evidence, live activity, or functionality. A score can be uncertain or low when evidence is missing.

## Output and handoff

Save `report.md` and `review.json` conforming to the supplied scorecard template. In `review.json`, preserve the fixed weighted rubric values under `scores` and `total`; set `film_persuasion_score` to the separate four-dimension sum and include the four individual dimension scores and their timestamped evidence. Set `review_evidence_mode` accurately (for example, `video_with_audio` or a reduced-evidence mode), identify technical evidence as film-visible prototype evidence, and set `independent_of_previous_rounds` to `true`. Start analysis from clean context. The next judge must receive only the candidate video and this revised rubric; do not pass source, code, repository access, specs, old reports, prior versions, or builder/orchestrator materials. Do not read other agent output before submitting the verdict.
