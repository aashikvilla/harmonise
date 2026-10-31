import { describe, expect, it } from "vitest";
import {
  ALTERNATE_QUESTION,
  ARJUN_NEED,
  EXPERIENCES,
  INITIAL_WORDS,
  SAMPLE_FIRST_ANSWER,
  SAMPLE_QUESTION,
  composeRecipientPreview,
  composeTakeaway,
  demoReducer,
  initialDemoState,
  rankExperiences,
} from "./demo";

describe("Beyond Silence v2 fixtures and state transitions", () => {
  it("keeps contextual and topic-only experience ordering deterministic", () => {
    expect(rankExperiences("context").map(({ id }) => id)).toEqual([
      "story-pressure-listener",
      "story-boundaries-conversation",
      "story-legal-process",
    ]);
    expect(rankExperiences("topic").map(({ id }) => id)).toEqual([
      "story-legal-process",
      "story-boundaries-conversation",
      "story-pressure-listener",
    ]);
    expect(EXPERIENCES).toHaveLength(3);
    for (const story of EXPERIENCES) {
      expect(story.fictional).toBe(true);
      expect(story.situation).toBeTruthy();
      expect(story.tried.length).toBeGreaterThan(0);
      expect(story.helpful.length).toBeGreaterThan(0);
      expect(story.unhelpful.length).toBeGreaterThan(0);
      expect(story.differences.length).toBeGreaterThan(0);
    }
  });

  it("progresses from the vague opening through exactly two guided turns", () => {
    const first = demoReducer(initialDemoState, { type: "SELECT_FIRST", answer: SAMPLE_FIRST_ANSWER });
    expect(first.turnIndex).toBe(1);
    expect(first.transcript.at(-1)?.text).toContain("What would be most useful right now?");

    const mirrored = demoReducer(first, {
      type: "SELECT_INTENT",
      intent: "experience",
      label: ARJUN_NEED,
    });
    expect(mirrored.stage).toBe("mirror");
    expect(mirrored.turnIndex).toBe(2);
    expect(mirrored.transcript.at(-1)?.text).toContain("Is that accurate?");

    const explored = demoReducer(mirrored, { type: "CONFIRM_CONTEXT" });
    expect(explored.stage).toBe("experiences");
  });

  it("builds message previews from only the approved alias and question fields", () => {
    expect(composeRecipientPreview({ alias: "  QuietRiver29 ", question: ` ${SAMPLE_QUESTION} ` })).toEqual({
      alias: "QuietRiver29",
      question: SAMPLE_QUESTION,
    });
    const preview = composeRecipientPreview({ alias: "River", question: ALTERNATE_QUESTION });
    expect(Object.keys(preview).sort()).toEqual(["alias", "question"]);
    expect(JSON.stringify(preview)).not.toMatch(/married|Hyderabad|family expectations|29/);
  });

  it("requires nonempty question and explicit approval and prevents duplicate submission", () => {
    const base = {
      ...initialDemoState,
      stage: "connect" as const,
      engagementMode: "question" as const,
      selectedExperienceId: "story-pressure-listener",
    };
    const blocked = demoReducer(base, { type: "SEND_QUESTION" });
    expect(blocked.questionSentInDemo).toBe(false);

    const empty = demoReducer(base, { type: "SET_QUESTION", value: "   " });
    const emptyApproved = demoReducer(empty, { type: "SET_APPROVAL", approved: true });
    expect(demoReducer(emptyApproved, { type: "SEND_QUESTION" }).questionSentInDemo).toBe(false);

    const filled = demoReducer(base, { type: "SET_QUESTION", value: SAMPLE_QUESTION });
    const approved = demoReducer(filled, { type: "SET_APPROVAL", approved: true });
    const sent = demoReducer(approved, { type: "SEND_QUESTION" });
    expect(sent.questionSentInDemo).toBe(true);
    expect(demoReducer(sent, { type: "SEND_QUESTION" })).toBe(sent);

    const nisha = { ...approved, selectedExperienceId: "story-boundaries-conversation" };
    expect(demoReducer(nisha, { type: "SEND_QUESTION" }).questionSentInDemo).toBe(false);
  });

  it("only summarizes perspectives the user opened and the chosen next step", () => {
    const opened = demoReducer(initialDemoState, { type: "OPEN_EXPERIENCE", id: "story-pressure-listener" });
    const chosen = demoReducer(opened, { type: "SET_NEXT_STEP", value: "Nothing for now" });
    expect(composeTakeaway(chosen)).toEqual({
      original: INITIAL_WORDS,
      need: ARJUN_NEED,
      perspectives: ["Ravi, 34"],
      nextStep: "Nothing for now",
    });
    expect(composeTakeaway(initialDemoState).perspectives).toEqual([]);
  });

  it("does not assign usefulness before a user choice and preserves negative feedback", () => {
    expect(initialDemoState.usefulness).toBeNull();
    const no = demoReducer(initialDemoState, { type: "SET_USEFULNESS", value: "no" });
    expect(no.usefulness).toBe("no");
    expect(demoReducer(initialDemoState, { type: "SET_USEFULNESS", value: "skip" }).usefulness).toBe("skip");
  });

  it("restart clears progress, opened stories, question state, and feedback", () => {
    const used = {
      ...initialDemoState,
      stage: "takeaway" as const,
      questionSentInDemo: true,
      previewApproved: true,
      questionDraft: "custom draft",
      chosenExperienceIds: ["story-pressure-listener"],
      usefulness: "no" as const,
      nextStep: "Nothing for now",
    };
    const reset = demoReducer(used, { type: "RESTART" });
    expect(reset).toMatchObject({
      stage: "conversation",
      turnIndex: 0,
      initialWords: INITIAL_WORDS,
      questionSentInDemo: false,
      previewApproved: false,
      chosenExperienceIds: [],
      selectedExperienceId: null,
      usefulness: null,
    });
    expect(reset.questionDraft).toBe(SAMPLE_QUESTION);
    expect(reset.nextStep).toBe("Write down what I want from a conversation");
  });
});
