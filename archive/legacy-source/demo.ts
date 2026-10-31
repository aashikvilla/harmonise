export type Stage = "conversation" | "mirror" | "experiences" | "connect" | "takeaway";
export type SupportIntent = "experience" | "reflect" | "listener" | "uncertain";
export type DiscoveryMode = "context" | "topic";
export type Usefulness = "yes" | "somewhat" | "no" | "skip" | null;

export interface ContextClaim {
  id: string;
  text: string;
  confirmed: boolean;
}

export interface ExperienceRecord {
  id: string;
  alias: string;
  fictional: true;
  situation: string;
  wanted: string;
  tried: string[];
  helpful: string[];
  unhelpful: string[];
  perspective: string;
  overlaps: string[];
  differences: string[];
  contributorAllowsQuestions: boolean;
}

export interface TranscriptItem {
  id: string;
  role: "user" | "assistant";
  text: string;
  simulated: true;
}

export interface DemoState {
  stage: Stage;
  turnIndex: number;
  scenarioId: "arjun";
  initialWords: string;
  transcript: TranscriptItem[];
  supportIntent: SupportIntent;
  intentLabel: string;
  selectedClaims: Record<string, boolean>;
  discoveryMode: DiscoveryMode;
  chosenExperienceIds: string[];
  selectedExperienceId: string | null;
  engagementMode: "quiet" | "question" | "alternatives" | null;
  pseudonym: string;
  questionDraft: string;
  previewApproved: boolean;
  questionSentInDemo: boolean;
  usefulness: Usefulness;
  nextStep: string | null;
  clarity: "not-sure" | "a-little" | "clear" | null;
  error: string;
}

export type DemoAction =
  | { type: "EDIT_INITIAL"; text: string }
  | { type: "SELECT_FIRST"; answer: string }
  | { type: "SELECT_INTENT"; intent: SupportIntent; label: string }
  | { type: "CONFIRM_CONTEXT" }
  | { type: "OPEN_MIRROR" }
  | { type: "TOGGLE_CLAIM"; id: string }
  | { type: "EDIT_INTENT"; text: string }
  | { type: "SET_DISCOVERY_MODE"; mode: DiscoveryMode }
  | { type: "OPEN_EXPERIENCE"; id: string }
  | { type: "BACK_TO_EXPERIENCES" }
  | { type: "CHOOSE_ENGAGEMENT"; mode: "quiet" | "question" | "alternatives" }
  | { type: "FINISH_QUIET" }
  | { type: "CONTINUE_TO_TAKEAWAY" }
  | { type: "REVISIT_EXPERIENCES" }
  | { type: "SET_ALIAS"; value: string }
  | { type: "SET_QUESTION"; value: string }
  | { type: "SET_APPROVAL"; approved: boolean }
  | { type: "SEND_QUESTION" }
  | { type: "SET_NEXT_STEP"; value: string }
  | { type: "SET_USEFULNESS"; value: Exclude<Usefulness, null> }
  | { type: "SET_CLARITY"; value: NonNullable<DemoState["clarity"]> }
  | { type: "BACK" }
  | { type: "RESTART" };

export const INITIAL_WORDS = "I don't know how to explain it. Things at home look normal, but I haven't felt okay for a while.";
export const SAMPLE_FIRST_ANSWER = "Things in my relationship. But I'm afraid of how my family would react if I talked about it.";
export const SAMPLE_QUESTION = "When your family had strong expectations, how did you find space to understand what you wanted without rushing a decision?";
export const ALTERNATE_QUESTION = "Was there anything that made talking to someone easier without involving your family?";
export const FICTIONAL_RAVI_REPLY = "I was not ready to decide either. Writing down what I needed before asking others helped me. When I spoke to someone, I asked them to listen before giving advice. My circumstances may be different from yours.";
export const ARJUN_CONTEXT = "I don't feel comfortable talking about my marriage or family expectations.";
export const ARJUN_NEED = "Real experiences, without pressure to decide.";

export const CONTEXT_CLAIMS: ContextClaim[] = [
  { id: "family", text: "Family expectations are part of the pressure", confirmed: true },
  { id: "privacy", text: "Privacy matters before I talk openly", confirmed: true },
  { id: "verdict", text: "I want someone to tell me whether to stay or leave", confirmed: false },
  { id: "peers", text: "I want to hear lived experience", confirmed: true },
];

export const EXPERIENCES: ExperienceRecord[] = [
  {
    id: "story-pressure-listener", alias: "Ravi, 34", fictional: true,
    situation: "Ravi faced strong family expectations while feeling uncertain about his marriage.",
    wanted: "A nonjudgmental space to sort out his own priorities.",
    tried: ["Writing down his concerns", "Speaking with an independent counselor"],
    helpful: ["Separating his priorities from other people's opinions"],
    unhelpful: ["Reading endless conflicting advice"],
    perspective: "He did not make a quick decision. He says it helped to ask someone to listen before offering advice.",
    overlaps: ["Family pressure", "Decision uncertainty", "Perspective without a verdict"],
    differences: ["He had a trusted friend", "He could access counseling"],
    contributorAllowsQuestions: true,
  },
  {
    id: "story-boundaries-conversation", alias: "Nisha, 33", fictional: true,
    situation: "Nisha experienced family pressure and distress in a relationship.",
    wanted: "A discreet conversation where she could ask to be heard.",
    tried: ["Preparing boundaries", "Speaking with a trusted relative"],
    helpful: ["Starting one conversation with a clear request to listen"],
    unhelpful: ["Relatives taking sides"],
    perspective: "Nisha says what helped depended on her family's dynamics.",
    overlaps: ["Fear of judgment", "Discretion", "A listener rather than a verdict"],
    differences: ["She had one supportive relative"],
    contributorAllowsQuestions: false,
  },
  {
    id: "story-legal-process", alias: "Legal Processes Circle", fictional: true,
    situation: "This fictional example focuses on divorce paperwork, logistics, and legal processes.",
    wanted: "General process information rather than a personal listening conversation.",
    tried: ["Listing practical questions before seeking qualified local guidance"],
    helpful: ["Organizing questions about process"],
    unhelpful: ["It does not address the family pressure or need for a listener described in Arjun's sample."],
    perspective: "The topic word overlaps, while the immediate support need differs. This is not legal advice.",
    overlaps: ["The word divorce may appear in the wider context"],
    differences: ["Focus is process and paperwork", "No personal lived-experience question is available"],
    contributorAllowsQuestions: false,
  },
];

export const initialDemoState: DemoState = {
  stage: "conversation", turnIndex: 0, scenarioId: "arjun", initialWords: INITIAL_WORDS,
  transcript: [{ id: "opening", role: "user", text: INITIAL_WORDS, simulated: true }],
  supportIntent: "experience", intentLabel: ARJUN_NEED, selectedClaims: Object.fromEntries(CONTEXT_CLAIMS.map((claim) => [claim.id, claim.confirmed])),
  discoveryMode: "context", chosenExperienceIds: [], selectedExperienceId: null, engagementMode: null,
  pseudonym: "QuietRiver29", questionDraft: SAMPLE_QUESTION, previewApproved: false, questionSentInDemo: false,
  usefulness: null, nextStep: "Write down what I want from a conversation", clarity: null, error: "",
};

export function rankExperiences(mode: DiscoveryMode): ExperienceRecord[] {
  const ids = mode === "context"
    ? ["story-pressure-listener", "story-boundaries-conversation", "story-legal-process"]
    : ["story-legal-process", "story-boundaries-conversation", "story-pressure-listener"];
  return ids.map((id) => EXPERIENCES.find((story) => story.id === id)!);
}

export const mockExperienceService = {
  findRelevant(_confirmedContext: DemoState["selectedClaims"], mode: DiscoveryMode): ExperienceRecord[] {
    return rankExperiences(mode);
  },
};

export const mockContributorService = {
  getReply(contributorId: string): string | null {
    return contributorId === "story-pressure-listener"
      ? FICTIONAL_RAVI_REPLY
      : null;
  },
};

export function mockConversationService(state: DemoState, answer: string): TranscriptItem[] {
  const next = [...state.transcript, { id: `answer-${state.transcript.length}`, role: "user" as const, text: answer, simulated: true as const }];
  if (state.turnIndex === 0) {
    next.push({ id: "prompt-b", role: "assistant", text: "It sounds like both the relationship and fear of judgment may be weighing on you. What would be most useful right now?", simulated: true });
  } else {
    next.push({ id: "confirmation", role: "assistant", text: "I may be hearing two things: uncertainty about the relationship, and fear of family judgment. You want perspective, not someone choosing for you. Is that accurate?", simulated: true });
  }
  return next;
}

export function composeRecipientPreview(input: { alias: string; question: string }): { alias: string; question: string } {
  return { alias: input.alias.trim(), question: input.question.trim() };
}

export function composeTakeaway(state: DemoState): { original: string; need: string; perspectives: string[]; nextStep: string | null } {
  const viewed = state.chosenExperienceIds.map((id) => EXPERIENCES.find((story) => story.id === id)?.alias).filter((value): value is string => Boolean(value));
  return {
    original: state.initialWords.trim() || INITIAL_WORDS,
    need: state.intentLabel || ARJUN_NEED,
    perspectives: viewed,
    nextStep: state.nextStep,
  };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case "EDIT_INITIAL": return { ...state, initialWords: action.text, transcript: [{ id: "opening", role: "user", text: action.text, simulated: true }], error: "" };
    case "SELECT_FIRST": return { ...state, transcript: mockConversationService(state, action.answer), turnIndex: 1, error: "" };
    case "SELECT_INTENT": return state.stage === "mirror"
      ? { ...state, supportIntent: action.intent, intentLabel: action.label }
      : { ...state, supportIntent: action.intent, intentLabel: action.label, transcript: mockConversationService(state, action.label), turnIndex: 2, stage: "mirror", error: "" };
    case "CONFIRM_CONTEXT": return { ...state, stage: "experiences", error: "" };
    case "OPEN_MIRROR": return { ...state, stage: "mirror" };
    case "TOGGLE_CLAIM": return { ...state, selectedClaims: { ...state.selectedClaims, [action.id]: !state.selectedClaims[action.id] } };
    case "EDIT_INTENT": return { ...state, intentLabel: action.text };
    case "SET_DISCOVERY_MODE": return { ...state, discoveryMode: action.mode };
    case "OPEN_EXPERIENCE": return { ...state, selectedExperienceId: action.id, chosenExperienceIds: state.chosenExperienceIds.includes(action.id) ? state.chosenExperienceIds : [...state.chosenExperienceIds, action.id] };
    case "BACK_TO_EXPERIENCES": return { ...state, selectedExperienceId: null, engagementMode: null, stage: "experiences", error: "" };
    case "CHOOSE_ENGAGEMENT": {
      if (action.mode === "question" && !EXPERIENCES.find((story) => story.id === state.selectedExperienceId)?.contributorAllowsQuestions) return state;
      return { ...state, engagementMode: action.mode, stage: action.mode === "question" ? "connect" : action.mode === "quiet" ? "experiences" : "takeaway", previewApproved: false, error: "" };
    }
    case "FINISH_QUIET": return state.engagementMode === "quiet" ? { ...state, stage: "takeaway" } : state;
    case "CONTINUE_TO_TAKEAWAY": return { ...state, stage: "takeaway" };
    case "REVISIT_EXPERIENCES": return { ...state, stage: "experiences", engagementMode: null, selectedExperienceId: null };
    case "SET_ALIAS": return { ...state, pseudonym: action.value.slice(0, 24), previewApproved: false };
    case "SET_QUESTION": return { ...state, questionDraft: action.value.slice(0, 500), previewApproved: false };
    case "SET_APPROVAL": return { ...state, previewApproved: action.approved };
    case "SEND_QUESTION": {
      const recipient = EXPERIENCES.find((story) => story.id === state.selectedExperienceId);
      return state.questionSentInDemo || !recipient?.contributorAllowsQuestions || !state.previewApproved || state.questionDraft.trim().length < 12 || !/^[A-Za-z0-9_]{3,24}$/.test(state.pseudonym) ? state : { ...state, questionSentInDemo: true, stage: "connect" };
    }
    case "SET_NEXT_STEP": return { ...state, nextStep: action.value };
    case "SET_USEFULNESS": return { ...state, usefulness: action.value };
    case "SET_CLARITY": return { ...state, clarity: action.value };
    case "BACK": {
      const previous: Record<Stage, Stage> = { conversation: "conversation", mirror: "conversation", experiences: "mirror", connect: "experiences", takeaway: state.questionSentInDemo ? "connect" : "experiences" };
      return { ...state, stage: previous[state.stage], selectedExperienceId: state.stage === "connect" ? state.selectedExperienceId : null, error: "" };
    }
    case "RESTART": return { ...initialDemoState, transcript: [{ id: "opening", role: "user", text: INITIAL_WORDS, simulated: true }] };
  }
}
