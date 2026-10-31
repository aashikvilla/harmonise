import { describe, expect, it } from "vitest";
import {
  composePeerQuestionPayload,
  fixtures,
  getPublicExperiences,
  getRecommendedCommunities,
  harmoniseReducer,
  initialHarmoniseState,
  stateForEntry,
  type HarmoniseState,
  type ThemeId,
} from "./harmonise";

describe("Harmonise guided demo state and fictional fixtures", () => {
  it("offers four distinct entry paths and an independent Arjun example", () => {
    expect(stateForEntry("talk").screen).toBe("conversation");
    expect(stateForEntry("unsure").screen).toBe("conversation");
    expect(stateForEntry("quiet").screen).toBe("discovery");
    expect(stateForEntry("quiet").quietReader).toBe(true);
    expect(stateForEntry("support").screen).toBe("contribute");
    expect(stateForEntry("arjun").screen).toBe("conversation");
    expect(stateForEntry("arjun").isFeaturedJourney).toBe(true);
  });

  it("lets a prepared conversation change family context to work pressure", () => {
    let state = stateForEntry("arjun");
    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: "Work has felt difficult, and I am not sure how to talk about it." });
    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: "I want to talk through work without advice." });
    state = harmoniseReducer(state, { type: "CONFIRM_UNDERSTANDING" });
    expect(state.confirmedThemes).toEqual(["work-pressure"]);
    expect(getRecommendedCommunities(state).map((community) => community.id)).toEqual(["community.work-pressure"]);
    expect(getRecommendedCommunities(state).map((community) => community.id)).not.toContain("community.family-expectations");
  });

  it("uses a correction in the understanding map to rerank recommendations", () => {
    let state = stateForEntry("arjun");
    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: "It's my marriage and I am worried about family expectations." });
    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: "I want to hear experiences, without advice." });
    state = harmoniseReducer(state, { type: "OPEN_UNDERSTANDING" });
    state = harmoniseReducer(state, { type: "TOGGLE_THEME", theme: "family-expectations" });
    state = harmoniseReducer(state, { type: "TOGGLE_THEME", theme: "relationship-uncertainty" });
    state = harmoniseReducer(state, { type: "TOGGLE_THEME", theme: "work-pressure" });
    state = harmoniseReducer(state, { type: "CONFIRM_UNDERSTANDING" });
    expect(getRecommendedCommunities(state).map((community) => community.id)).toEqual(["community.work-pressure"]);
  });

  it("does not analyze arbitrary typed content or retain stale personalized themes", () => {
    let state = stateForEntry("arjun");
    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "typed", value: "A different concern I typed myself." });
    expect(state.mockTextNotice).toBe(true);
    expect(state.confirmedThemes).toEqual([]);
    expect(state.proposedThemes).toEqual([]);
  });

  it("keeps Arjun's exact words, tentative interpretation, correction, and confirmation distinct", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" });
    expect(state.turns).toEqual([{ id: "u1", speaker: "arjun", text: fixtures.leadPersona.private.utterances[0].text }]);
    expect(state.turns[0].text).toBe("I think something is wrong with my marriage. Things look normal, but I feel trapped whenever everyone asks me what comes next.");

    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: fixtures.leadPersona.private.utterances[1].text });
    expect(state.turns.find((turn) => turn.id === "u2")?.text).toBe("Not quite. My partner and I are still talking. It's my parents and relatives. Everyone expects me to give them an answer, and I don't even know what I want yet.");
    expect(state.proposedThemes).toEqual(["relationship-uncertainty", "family-expectations"]);
    expect(state.confirmedThemes).toEqual(["family-expectations"]);
    expect(state.rejectedThemes).toEqual(["relationship-uncertainty"]);

    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: fixtures.leadPersona.private.utterances[2].text });
    expect(state.turns.find((turn) => turn.id === "u3")?.text).toBe("Yes. Please don't tell me whether I should stay or leave. I want to know how others handled that pressure without making things worse.");
    expect(state.confirmedThemes).toEqual(["family-expectations", "personal-autonomy"]);
    expect(state.rejectedThemes).toEqual(["relationship-uncertainty"]);
    expect(state.confirmedNeed).toBe("Perspectives on family expectations, without pressure to choose a relationship outcome.");
  });

  it("keeps an edited opening uninterpreted through later prepared answers", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" });
    state = harmoniseReducer(state, { type: "EDIT_OPENING", value: "I feel unsure about a different part of my life." });
    expect(state.mockTextNotice).toBe(true);
    expect(state.proposedThemes).toEqual([]);
    expect(state.confirmedThemes).toEqual([]);

    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: fixtures.leadPersona.private.utterances[1].text });
    expect(state.mockTextNotice).toBe(true);
    expect(state.proposedThemes).toEqual([]);
    expect(state.confirmedThemes).toEqual([]);
    expect(state.turns.find((turn) => turn.id === "g1")?.text).toBe("I might be missing something. What feels hardest right now?");

    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: fixtures.leadPersona.private.utterances[2].text });
    expect(state.mockTextNotice).toBe(true);
    expect(state.proposedThemes).toEqual([]);
    expect(state.confirmedThemes).toEqual([]);
    expect(state.rejectedThemes).toEqual([]);
  });

  it("starts a fresh entry path without old conversation, question, reflection, or journey state", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" });
    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: fixtures.leadPersona.private.utterances[1].text });
    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: fixtures.leadPersona.private.utterances[2].text });
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.ravi" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    state = harmoniseReducer(state, { type: "SET_QUESTION_CONSENT", value: true });
    state = harmoniseReducer(state, { type: "SEND_QUESTION" });
    state = harmoniseReducer(state, { type: "CONTINUE_AFTER_REPLY" });
    state = harmoniseReducer(state, { type: "SET_USEFULNESS", value: "perspective" });
    state = harmoniseReducer(state, { type: "SET_NEXT_STEP", value: "Talk with someone I trust" });
    state = harmoniseReducer(state, { type: "SET_INSIGHT_DRAFT", value: "A note from the previous chapter" });
    state = harmoniseReducer(state, { type: "APPROVE_INSIGHT" });

    const fresh = harmoniseReducer(state, { type: "START_PATH", path: "talk" });
    expect(fresh.screen).toBe("conversation");
    expect(fresh.history).toEqual(["entry"]);
    expect(fresh.entryPath).toBe("talk");
    expect(fresh.isFeaturedJourney).toBe(false);
    expect(fresh.opening).toBe("");
    expect(fresh.turns).toEqual([]);
    expect(fresh.questionStep).toBe(0);
    expect(fresh.mockTextNotice).toBe(false);
    expect(fresh.proposedThemes).toEqual([]);
    expect(fresh.confirmedThemes).toEqual([]);
    expect(fresh.rejectedThemes).toEqual([]);
    expect(fresh.questionConsent).toBe(false);
    expect(fresh.questionPayload).toBeNull();
    expect(fresh.usefulness).toBeNull();
    expect(fresh.nextStep).toBe("");
    expect(fresh.insightApproved).toBe(false);
    expect(fresh.insightDraft).toBe(fixtures.approvedInsightDraft);
    expect(fresh.openedExperienceIds).toEqual([]);
    expect(fresh.contributorSummary).toBe(initialHarmoniseState.contributorSummary);
    expect(fresh.contributorPublished).toBe(initialHarmoniseState.contributorPublished);
    expect(fresh.contributorAllowsQuestions).toBe(initialHarmoniseState.contributorAllowsQuestions);
  });

  it("keeps C0 and C1 grounded in source IDs and ranks the confirmed family context first", () => {
    const state = harmoniseReducer(harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" }), { type: "ANSWER_FIRST", source: "prepared", value: fixtures.leadPersona.private.utterances[1].text });
    const confirmed = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: fixtures.leadPersona.private.utterances[2].text });
    expect(fixtures.topicOnlyBaseline.name).toBe("Separation paperwork and settlement basics");
    expect(fixtures.topicOnlyBaseline.sourceIds).toEqual(["C0"]);
    const family = fixtures.communities.find((community) => community.id === "community.family-expectations");
    expect(family?.evidenceIds).toEqual(["T1", "T2", "R1", "R2", "R3"]);
    expect(getRecommendedCommunities(confirmed)[0]?.id).toBe("community.family-expectations");
  });

  it("keeps the community fixture human-centered and clearly labeled", () => {
    expect(fixtures.communities.map((community) => community.name)).toContain("Family Expectations & Personal Choices");
    const ravi = fixtures.experiences.find((experience) => experience.id === "experience.ravi");
    expect(ravi?.milestones).toHaveLength(3);
    expect(ravi?.milestones.every((milestone) => milestone.whatIActuallyTried)).toBe(true);
    expect(ravi?.importantDifferencesFromArjun.length).toBeGreaterThan(0);
    expect(fixtures.contributors.every((contributor) => contributor.isFictional)).toBe(true);
    const mira = fixtures.experiences.find((experience) => experience.id === "experience.mira");
    expect(mira?.isFictional).toBe(true);
    expect(mira?.milestones[0]?.whatIActuallyTried).toContain("professional support");
    expect(fixtures.communities.find((community) => community.id === "community.family-expectations")?.experienceIds).toContain("experience.mira");
    expect(fixtures.communities.find((community) => community.id === "community.family-expectations")?.roleLabels).toContain("facilitator (fictional role)");
    expect(fixtures.discussions.find((post) => post.sourceId === "T1")?.prompt).toBe("When every family call turns into a decision I haven't made");
    expect(fixtures.discussions.find((post) => post.sourceId === "T1")?.reply).toContain("people voting on your decision");
    expect(fixtures.discussions.find((post) => post.sourceId === "T2")?.prompt).toBe("What actually helped when everyone had an opinion?");
    expect(fixtures.discussions.find((post) => post.sourceId === "T2")?.reply).toContain("listening rather than a decision");
    expect(ravi?.milestones.map((milestone) => milestone.id)).toEqual(["R1", "R2", "R3"]);
    expect(ravi?.milestones[0]?.whatDidNotHelp).toContain("anonymous opinions");
    expect(ravi?.milestones[1]?.whatHelped).toBe("My friend listened without deciding for me.");
    expect(ravi?.milestones[2]?.whatDidNotHelp).toContain("did not suddenly know");
    expect(fixtures.peerQuestionDraft.alias).toBe("QuietRiver");
    expect(fixtures.leadPersona.alias).toBe("QuietRiver");
    expect(fixtures.peerQuestionDraft.questionText).toBe("When you didn't want to disappoint your family, how did you figure out what you wanted before listening to everyone else's opinions?");
    expect(fixtures.peerQuestionDraft.response.label).toBe("Prepared fictional reply");
    expect(fixtures.peerQuestionDraft.response.text).toBe("I didn't know at first. I kept asking people what they'd do, and their answers made me more unsure. What helped was writing down the one question I wanted to answer for myself, then asking a friend to listen without giving me a verdict. I still had a hard conversation with my family afterward. It wasn't a quick fix.");
  });

  it("does not allow questions to the read-only Nisha fixture", () => {
    let state = stateForEntry("arjun");
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.nisha" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    expect(state.screen).toBe("experience");
    expect(state.error).toMatch(/not accepting questions/i);
  });

  it("keeps Ravi group-only and blocks direct question payloads", () => {
    let state = stateForEntry("arjun");
    expect(initialHarmoniseState.alias).toBe("QuietRiver");
    expect(state.questionText).toBe(fixtures.peerQuestionDraft.questionText);
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.ravi" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    expect(state.screen).toBe("experience");
    expect(state.error).toMatch(/not accepting questions/i);
    expect(state.questionPayload).toBeNull();
    expect(composePeerQuestionPayload({ recipientId: "contributor.ravi", alias: " river ", questionText: " question text " })).toEqual({ recipientId: "contributor.ravi", alias: "river", questionText: "question text" });
  });

  it("does not open a direct message draft for a group-only contributor", () => {
    let state = stateForEntry("arjun");
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.ravi" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    expect(state.screen).toBe("experience");
    expect(state.questionPayload).toBeNull();
    expect(state.error).toMatch(/not accepting questions/i);
  });

  it("removes Ravi from discovery and disables contact when sharing is revoked", () => {
    let state: HarmoniseState = { ...initialHarmoniseState, confirmedThemes: ["family-expectations"] };
    expect(getPublicExperiences(state).some((experience) => experience.id === "experience.ravi")).toBe(true);
    state = harmoniseReducer(state, { type: "REVOKE_CONTRIBUTOR" });
    expect(getPublicExperiences(state).some((experience) => experience.id === "experience.ravi")).toBe(false);
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.ravi" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    expect(state.screen).toBe("experience");
  });

  it("starts a separate later chapter with a different community", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" });
    state = harmoniseReducer(state, { type: "ANSWER_FIRST", source: "prepared", value: fixtures.leadPersona.private.utterances[1].text });
    state = harmoniseReducer(state, { type: "ANSWER_SECOND", source: "prepared", value: fixtures.leadPersona.private.utterances[2].text });
    state = harmoniseReducer(state, { type: "OPEN_EXPERIENCE", experienceId: "experience.ravi" });
    state = harmoniseReducer(state, { type: "OPEN_QUESTION" });
    state = harmoniseReducer(state, { type: "SET_QUESTION_CONSENT", value: true });
    state = harmoniseReducer(state, { type: "SEND_QUESTION" });
    state = harmoniseReducer(state, { type: "CONTINUE_AFTER_REPLY" });
    state = harmoniseReducer(state, { type: "SET_USEFULNESS", value: "perspective" });
    state = harmoniseReducer(state, { type: "SET_NEXT_STEP", value: "Talk with someone I trust" });
    state = harmoniseReducer(state, { type: "SET_INSIGHT_DRAFT", value: "I want someone to listen while I work out my priorities." });
    state = harmoniseReducer(state, { type: "APPROVE_INSIGHT" });
    state = harmoniseReducer(state, { type: "OPEN_JOURNEY" });
    const priorOpening = state.opening;
    const priorNeed = state.confirmedNeed;
    const priorQuestion = state.questionPayload;
    const future = harmoniseReducer(state, { type: "START_FUTURE_CHAPTER", carryContext: false });
    expect(future.chapter).toBe("belonging");
    expect(future.opening).toBe("I moved cities recently. I feel lonely after work.");
    expect(future.confirmedNeed).toContain("regular social connection");
    expect(future.priorChapter?.opening).toBe(priorOpening);
    expect(future.priorChapter?.confirmedNeed).toBe(priorNeed);
    expect(future.priorChapter?.confirmedThemes).toEqual(["family-expectations", "personal-autonomy"]);
    expect(future.priorChapter?.openedExperienceIds).toContain("experience.ravi");
    expect(future.priorChapter?.questionPayload).toEqual(priorQuestion);
    expect(future.priorChapter?.usefulness).toBe("perspective");
    expect(future.priorChapter?.nextStep).toBe("Talk with someone I trust");
    expect(future.priorChapter?.insightApproved).toBe(true);
    expect(future.carryPreviousContext).toBe(false);
    expect(future.carriedTakeaway).toBe("");
    expect(future.nextStep).toBe("");
    expect(future.usefulness).toBeNull();
    expect(future.questionPayload).toBeNull();
    expect(getRecommendedCommunities(future).map((community) => community.id)).toEqual(["community.moving-friends"]);
  });

  it("carries only an explicitly approved takeaway into a later chapter", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "SET_INSIGHT_DRAFT", value: "I want someone to listen while I work out my priorities." });
    state = harmoniseReducer(state, { type: "APPROVE_INSIGHT" });
    const carried = harmoniseReducer(state, { type: "START_FUTURE_CHAPTER", carryContext: true });
    expect(carried.carryPreviousContext).toBe(true);
    expect(carried.carriedTakeaway).toBe("I want someone to listen while I work out my priorities.");
    expect(carried.priorChapter?.insightDraft).toBe(carried.carriedTakeaway);
    expect(carried.priorChapter?.insightApproved).toBe(true);
    expect(carried.opening).toBe("I moved cities recently. I feel lonely after work.");

    const separate = harmoniseReducer(state, { type: "START_FUTURE_CHAPTER", carryContext: false });
    expect(separate.carryPreviousContext).toBe(false);
    expect(separate.carriedTakeaway).toBe("");
  });

  it("does not carry an unapproved draft even when carry is requested", () => {
    const unapprovedDraft = harmoniseReducer(initialHarmoniseState, { type: "SET_INSIGHT_DRAFT", value: "A note that has not been approved." });
    expect(unapprovedDraft.insightApproved).toBe(false);
    const future = harmoniseReducer(unapprovedDraft, { type: "START_FUTURE_CHAPTER", carryContext: true });
    expect(future.carryPreviousContext).toBe(false);
    expect(future.carriedTakeaway).toBe("");
    expect(future.priorChapter?.insightDraft).toBe("A note that has not been approved.");
    expect(future.priorChapter?.insightApproved).toBe(false);
  });

  it("records only explicitly approved insights and respects negative or skipped feedback", () => {
    let state = harmoniseReducer(initialHarmoniseState, { type: "SET_USEFULNESS", value: "not-helpful" });
    expect(state.usefulness).toBe("not-helpful");
    expect(state.insightApproved).toBe(false);
    state = harmoniseReducer(state, { type: "SET_INSIGHT_DRAFT", value: "A note I wrote" });
    state = harmoniseReducer(state, { type: "APPROVE_INSIGHT" });
    expect(state.insightApproved).toBe(true);
    expect(state.insightDraft).toBe("A note I wrote");
    state = harmoniseReducer(state, { type: "SET_USEFULNESS", value: "skip" });
    expect(state.usefulness).toBe("skip");
  });

  it("takes negative experience feedback to a different community instead of repeating the same result", () => {
    const viewed = {
      ...stateForEntry("arjun"),
      screen: "experience" as const,
      selectedExperienceId: "experience.ravi",
      confirmedThemes: ["family-expectations", "relationship-uncertainty"] as ThemeId[],
      openedExperienceIds: ["experience.ravi"],
    };
    const alternative = harmoniseReducer(viewed, { type: "EXPLORE_DIFFERENT_PERSPECTIVE" });
    expect(alternative.screen).toBe("discovery");
    expect(alternative.usefulness).toBe("not-helpful");
    expect(getRecommendedCommunities(alternative).map((community) => community.id)).toEqual(["community.family-expectations", "community.relationship-uncertainty"]);
  });
});
