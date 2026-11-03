import fixtureData from "./harmonise-content.json";

export type Screen =
  | "entry"
  | "conversation"
  | "understanding"
  | "discovery"
  | "community"
  | "experience"
  | "question"
  | "reply"
  | "reflection"
  | "journey"
  | "contribute"
  | "help"
  | "connections"
  | "professional"
  | "moderation";

export type EntryPath = "talk" | "unsure" | "quiet" | "support" | null;
export type Chapter = "relationships" | "belonging";
export type ThemeId =
  | "family-expectations"
  | "relationship-uncertainty"
  | "work-pressure"
  | "relocation"
  | "belonging"
  | "personal-autonomy"
  | "communication"
  | "hobbies";
export type SupportNeed = "human-perspective" | "quiet-reading" | "shared-activity" | "not-sure";
export type CommunityTab = "experiences" | "discussions" | "people" | "guidelines";
export type QuestionChannel = "none" | "private" | "group";
export type Helpfulness = "perspective" | "understood" | "action" | "not-helpful" | "skip" | null;

export type ProductContent = {
  executionProvenance: { source: "local-fixture"; model: string | null };
  notice: string;
  leadPersona: {
    id: string;
    alias: string;
    displayName: string;
    isFictional: boolean;
    private: {
      opening: string;
      utterances: { id: string; text: string }[];
      proposedThemes: string[];
      confirmedThemes: string[];
      supportIntent: string;
      explicitBoundary: string;
      reaction: string;
    };
  };
  chapters: { id: string; title: string; confirmedGoal: string; status: string; futureNote?: string }[];
  contributors: {
    id: string;
    alias: string;
    isFictional: boolean;
    role: string;
    scope: { discoverable: boolean; anonymousQuestions: boolean };
    approvedSummary: string;
  }[];
  experiences: {
    id: string;
    contributorId: string;
    communityId: string;
    isFictional: boolean;
    attributionLabel: string;
    approvedForDiscovery: boolean;
    themeIds: string[];
    milestones: {
      id: string;
      relativeTime: string;
      title: string;
      whatHappened: string;
      whatIActuallyTried: string;
      whatHelped: string | null;
      whatDidNotHelp: string | null;
    }[];
    importantDifferencesFromArjun: string[];
    unknowns: string[];
  }[];
  communities: {
    id: string;
    name: string;
    purpose: string;
    topicIds: string[];
    experienceIds: string[];
    discussionIds: string[];
    evidenceIds: string[];
    roleLabels: string[];
    activityLabel: string;
    joiningIsOptional: boolean;
  }[];
  discussions: { id: string; authorAlias: string; prompt: string; preview: string; reply: string | null; sourceId: string; timeLabel?: string; replyAuthor?: string }[];
  topicOnlyBaseline: { id: string; name: string; explanation: string; sourceIds: string[] };
  peerQuestionDraft: {
    recipientId: string;
    alias: string;
    questionText: string;
    consentDefault: boolean;
    response: { id: string; label: string; text: string };
  };
  approvedInsightDraft: string;
  reportingWorkflow: { label: string; flaggedText: string; possibleConcern: string };
};

export const fixtures = fixtureData as ProductContent;
export const themeLabels: Record<ThemeId, string> = {
  "family-expectations": "Family expectations",
  "relationship-uncertainty": "Relationship uncertainty",
  "work-pressure": "Work pressure",
  relocation: "Relocation",
  belonging: "Belonging",
  "personal-autonomy": "Personal choices",
  communication: "Communication",
  hobbies: "Shared interests",
};

export interface ConversationTurn {
  id: string;
  speaker: "arjun" | "guide";
  text: string;
}

export interface PeerQuestionPayload {
  recipientId: string;
  alias: string;
  questionText: string;
}

export interface PriorChapterSnapshot {
  opening: string;
  confirmedNeed: string;
  confirmedThemes: ThemeId[];
  rejectedThemes: ThemeId[];
  openedExperienceIds: string[];
  questionPayload: PeerQuestionPayload | null;
  usefulness: Helpfulness;
  nextStep: string;
  insightDraft: string;
  insightApproved: boolean;
}

export interface HarmoniseState {
  screen: Screen;
  history: Screen[];
  entryPath: EntryPath;
  chapter: Chapter;
  isFeaturedJourney: boolean;
  quietReader: boolean;
  opening: string;
  turns: ConversationTurn[];
  questionStep: 0 | 1 | 2;
  mockTextNotice: boolean;
  proposedThemes: ThemeId[];
  confirmedThemes: ThemeId[];
  rejectedThemes: ThemeId[];
  supportNeed: SupportNeed;
  confirmedNeed: string;
  selectedCommunityId: string;
  communityTab: CommunityTab;
  selectedExperienceId: string | null;
  openedExperienceIds: string[];
  topicComparisonOpen: boolean;
  rejectedBaseline: boolean;
  noMatch: boolean;
  alias: string;
  questionText: string;
  questionConsent: boolean;
  questionChannel: QuestionChannel;
  questionPayload: PeerQuestionPayload | null;
  reportShown: boolean;
  usefulness: Helpfulness;
  nextStep: string;
  insightDraft: string;
  insightApproved: boolean;
  futureChapterStarted: boolean;
  priorChapter: PriorChapterSnapshot | null;
  carryPreviousContext: boolean;
  carriedTakeaway: string;
  contributorDraft: string;
  contributorSummary: string;
  contributorPreviewOpen: boolean;
  contributorApproved: boolean;
  contributorPublished: boolean;
  contributorDiscoverable: boolean;
  contributorAllowsQuestions: boolean;
  error: string;
}

export const initialHarmoniseState: HarmoniseState = {
  screen: "entry",
  history: [],
  entryPath: null,
  chapter: "relationships",
  isFeaturedJourney: false,
  quietReader: false,
  opening: "",
  turns: [],
  questionStep: 0,
  mockTextNotice: false,
  proposedThemes: [],
  confirmedThemes: [],
  rejectedThemes: [],
  supportNeed: "not-sure",
  confirmedNeed: "",
  selectedCommunityId: "community.family-expectations",
  communityTab: "experiences",
  selectedExperienceId: null,
  openedExperienceIds: [],
  topicComparisonOpen: false,
  rejectedBaseline: false,
  noMatch: false,
  alias: "QuietRiver",
  questionText: fixtures.peerQuestionDraft.questionText,
  questionConsent: false,
  questionChannel: "none",
  questionPayload: null,
  reportShown: false,
  usefulness: null,
  nextStep: "",
  insightDraft: fixtures.approvedInsightDraft,
  insightApproved: false,
  futureChapterStarted: false,
  priorChapter: null,
  carryPreviousContext: false,
  carriedTakeaway: "",
  contributorDraft: "I felt unsure and heard many different opinions. I wrote down my questions and asked a trusted friend to listen before offering advice.",
  contributorSummary: fixtures.contributors[0].approvedSummary,
  contributorPreviewOpen: false,
  contributorApproved: false,
  contributorPublished: true,
  contributorDiscoverable: true,
  contributorAllowsQuestions: true,
  error: "",
};

export function stateForEntry(path: Exclude<EntryPath, null> | "arjun" | "help" | undefined): HarmoniseState {
  if (path === "arjun") return harmoniseReducer(initialHarmoniseState, { type: "START_ARJUN" });
  if (path === "help") return harmoniseReducer(initialHarmoniseState, { type: "OPEN_HELP" });
  if (path) return harmoniseReducer(initialHarmoniseState, { type: "START_PATH", path });
  return initialHarmoniseState;
}

export type HarmoniseAction =
  | { type: "START_PATH"; path: Exclude<EntryPath, null> }
  | { type: "START_ARJUN" }
  | { type: "EDIT_OPENING"; value: string }
  | { type: "SYNC_CHAT_CONTEXT"; turns: ConversationTurn[]; themes: ThemeId[]; need: string }
  | { type: "REJECT_BASELINE" }
  | { type: "ANSWER_FIRST"; value: string; source: "prepared" | "typed" }
  | { type: "ANSWER_SECOND"; value: string; source: "prepared" | "typed" }
  | { type: "SKIP_QUESTION" }
  | { type: "STOP_ASKING" }
  | { type: "OPEN_UNDERSTANDING" }
  | { type: "TOGGLE_THEME"; theme: ThemeId }
  | { type: "SET_SUPPORT_NEED"; need: SupportNeed; label: string }
  | { type: "CONFIRM_UNDERSTANDING" }
  | { type: "OPEN_DISCOVERY" }
  | { type: "OPEN_COMMUNITY"; communityId: string }
  | { type: "SET_COMMUNITY_TAB"; tab: CommunityTab }
  | { type: "OPEN_EXPERIENCE"; experienceId: string }
  | { type: "CLOSE_EXPERIENCE" }
  | { type: "TOGGLE_TOPIC_COMPARISON" }
  | { type: "SET_NO_MATCH"; value: boolean }
  | { type: "OPEN_QUESTION" }
  | { type: "OPEN_GROUP_QUESTION" }
  | { type: "SET_ALIAS"; value: string }
  | { type: "SET_QUESTION_TEXT"; value: string }
  | { type: "SET_QUESTION_CONSENT"; value: boolean }
  | { type: "SEND_QUESTION" }
  | { type: "CONTINUE_AFTER_REPLY" }
  | { type: "SET_USEFULNESS"; value: Exclude<Helpfulness, null> }
  | { type: "EXPLORE_DIFFERENT_PERSPECTIVE" }
  | { type: "SET_NEXT_STEP"; value: string }
  | { type: "SET_INSIGHT_DRAFT"; value: string }
  | { type: "APPROVE_INSIGHT" }
  | { type: "OPEN_JOURNEY" }
  | { type: "START_FUTURE_CHAPTER"; carryContext: boolean }
  | { type: "OPEN_CONTRIBUTE" }
  | { type: "SET_CONTRIBUTOR_DRAFT"; value: string }
  | { type: "SET_CONTRIBUTOR_SUMMARY"; value: string }
  | { type: "OPEN_CONTRIBUTOR_PREVIEW" }
  | { type: "APPROVE_CONTRIBUTOR" }
  | { type: "SET_CONTRIBUTOR_SCOPE"; discoverable: boolean; questions: boolean }
  | { type: "PUBLISH_CONTRIBUTOR" }
  | { type: "REVOKE_CONTRIBUTOR" }
  | { type: "OPEN_HELP" }
  | { type: "OPEN_CONVERSATION" }
  | { type: "OPEN_CONNECTIONS" }
  | { type: "OPEN_PROFESSIONAL" }
  | { type: "OPEN_MODERATION" }
  | { type: "REPORT_EXAMPLE" }
  | { type: "BACK" }
  | { type: "RESTART" };

const cloneState = (state: HarmoniseState): HarmoniseState => ({ ...state, history: [...state.history] });
const go = (state: HarmoniseState, screen: Screen): HarmoniseState => ({
  ...state,
  screen,
  history: state.screen === screen ? state.history : [...state.history, state.screen],
  error: "",
});

export function composePeerQuestionPayload(input: {
  recipientId: string;
  alias: string;
  questionText: string;
}): PeerQuestionPayload {
  return {
    recipientId: input.recipientId,
    alias: input.alias.trim(),
    questionText: input.questionText.trim(),
  };
}

export function getRecommendedCommunities(state: Pick<HarmoniseState, "confirmedThemes" | "chapter" | "noMatch" | "openedExperienceIds">) {
  if (state.noMatch) return [];
  if (state.chapter === "belonging") return fixtures.communities.filter((community) => community.id === "community.moving-friends");
  const availableCommunities = fixtures.communities.filter((community) => community.id !== "community.moving-friends");
  if (state.confirmedThemes.length === 0) return availableCommunities;
  const filtered = availableCommunities.filter((community) => {
    const hasMatchingTheme = community.topicIds.some((topic) => state.confirmedThemes.includes(topic as ThemeId));
    const hasUnseenExperience = community.experienceIds.length === 0
      || community.experienceIds.some((experienceId) => !state.openedExperienceIds.includes(experienceId));
    return hasMatchingTheme && hasUnseenExperience;
  });
  return filtered.sort((a, b) => {
      const overlapA = a.topicIds.filter((topic) => state.confirmedThemes.includes(topic as ThemeId)).length;
      const overlapB = b.topicIds.filter((topic) => state.confirmedThemes.includes(topic as ThemeId)).length;
      return overlapB - overlapA;
    });
}

export function getPublicExperiences(state: Pick<HarmoniseState, "contributorPublished" | "contributorDiscoverable">) {
  return fixtures.experiences.filter((experience) => {
    if (experience.id === "experience.ravi") return state.contributorPublished && state.contributorDiscoverable;
    return experience.approvedForDiscovery;
  });
}

function answerThemes(value: string, source: "prepared" | "typed"): ThemeId[] {
  if (source === "typed") return [];
  const lower = value.toLowerCase();
  if (lower.includes("work")) return ["work-pressure"];
  if (lower.includes("moving") || lower.includes("new city") || lower.includes("friend")) return ["relocation", "belonging", "hobbies"];
  if (lower.includes("relationship") || lower.includes("marriage") || lower.includes("family")) {
    return ["relationship-uncertainty", "family-expectations"];
  }
  return [];
}

export function harmoniseReducer(state: HarmoniseState, action: HarmoniseAction): HarmoniseState {
  switch (action.type) {
    case "START_PATH": {
      const screen: Screen = action.path === "talk" || action.path === "unsure" ? "conversation" : action.path === "quiet" ? "discovery" : "contribute";
      return go({ ...initialHarmoniseState, entryPath: action.path, quietReader: action.path === "quiet", proposedThemes: [], confirmedThemes: [], rejectedThemes: [], isFeaturedJourney: false }, screen);
    }
    case "START_ARJUN":
      return go({ ...initialHarmoniseState, entryPath: "talk", isFeaturedJourney: true, quietReader: false, opening: fixtures.leadPersona.private.opening, turns: [{ id: "u1", speaker: "arjun", text: fixtures.leadPersona.private.opening }], questionStep: 0, proposedThemes: ["relationship-uncertainty"], confirmedThemes: [], rejectedThemes: [] }, "conversation");
    case "EDIT_OPENING":
      return {
        ...state,
        opening: action.value,
        mockTextNotice: action.value.trim() !== fixtures.leadPersona.private.opening,
        turns: [{ id: "u1", speaker: "arjun", text: action.value }],
        questionStep: 0,
        proposedThemes: [],
        confirmedThemes: [],
        rejectedThemes: [],
        supportNeed: "not-sure",
        confirmedNeed: "",
      };
    case "SYNC_CHAT_CONTEXT": {
      const firstUserTurn = action.turns.find((turn) => turn.speaker === "arjun");
      return {
        ...state,
        opening: firstUserTurn?.text ?? "",
        turns: action.turns,
        proposedThemes: [...action.themes],
        confirmedThemes: [...action.themes],
        rejectedThemes: [],
        confirmedNeed: action.need,
        supportNeed: "human-perspective",
        mockTextNotice: false,
        rejectedBaseline: false,
        error: "",
      };
    }
    case "REJECT_BASELINE": return { ...state, rejectedBaseline: true };
    case "ANSWER_FIRST": {
      const preserveUninterpreted = state.mockTextNotice || action.source === "typed";
      const themes = preserveUninterpreted ? [] : answerThemes(action.value, action.source);
      const isArjunCorrection = !preserveUninterpreted && state.isFeaturedJourney && action.source === "prepared" && action.value.toLowerCase().includes("not quite");
      const turns: ConversationTurn[] = isArjunCorrection
        ? [
            { id: "u1", speaker: "arjun", text: state.opening || fixtures.leadPersona.private.opening },
            { id: "g1", speaker: "guide", text: "It sounds like your relationship is feeling difficult. Is that what you most want to talk through?" },
            { id: "u2", speaker: "arjun", text: fixtures.leadPersona.private.utterances[1].text },
            { id: "g2", speaker: "guide", text: "Thanks for clarifying. The pressure to have an answer may be harder right now than the relationship question itself. Does that fit?" },
          ]
        : [
            { id: "u1", speaker: "arjun", text: state.opening || action.value },
            { id: "g1", speaker: "guide", text: "I might be missing something. What feels hardest right now?" },
            { id: "u2", speaker: "arjun", text: action.value },
            { id: "g2", speaker: "guide", text: "What would feel useful right now: hearing experiences, talking it through, or just reading quietly?" },
          ];
      return {
        ...state,
        turns,
        questionStep: 1,
        proposedThemes: preserveUninterpreted ? [] : isArjunCorrection ? ["relationship-uncertainty", "family-expectations"] : themes.length ? themes : state.proposedThemes,
        confirmedThemes: preserveUninterpreted ? [] : isArjunCorrection ? ["family-expectations"] : themes,
        rejectedThemes: preserveUninterpreted ? [] : isArjunCorrection ? ["relationship-uncertainty"] : [],
        mockTextNotice: preserveUninterpreted,
        error: "",
      };
    }
    case "ANSWER_SECOND": {
      const preserveUninterpreted = state.mockTextNotice || action.source === "typed";
      const themes = preserveUninterpreted ? [] : answerThemes(action.value, action.source);
      const isConfirmedArjunExample = state.isFeaturedJourney && !state.mockTextNotice && action.source === "prepared" && state.turns.some((turn) => turn.speaker === "arjun" && turn.text.toLowerCase().includes("not quite"));
      return {
        ...state,
        turns: [...state.turns, { id: "u3", speaker: "arjun", text: isConfirmedArjunExample ? fixtures.leadPersona.private.utterances[2].text : action.value }],
        questionStep: 2,
        proposedThemes: preserveUninterpreted ? [] : isConfirmedArjunExample ? ["relationship-uncertainty", "family-expectations", "personal-autonomy"] : themes.length ? themes : state.proposedThemes,
        confirmedThemes: preserveUninterpreted ? [] : isConfirmedArjunExample ? ["family-expectations", "personal-autonomy"] : themes.length ? themes : state.confirmedThemes,
        rejectedThemes: preserveUninterpreted ? [] : isConfirmedArjunExample ? ["relationship-uncertainty"] : state.rejectedThemes,
        supportNeed: action.value.toLowerCase().includes("read") ? "quiet-reading" : action.value.toLowerCase().includes("activity") ? "shared-activity" : "human-perspective",
        confirmedNeed: isConfirmedArjunExample ? "Perspectives on family expectations, without pressure to choose a relationship outcome." : action.value,
        mockTextNotice: preserveUninterpreted,
        error: "",
      };
    }
    case "SKIP_QUESTION": return { ...state, questionStep: Math.min(2, state.questionStep + 1) as 0 | 1 | 2, mockTextNotice: true };
    case "STOP_ASKING": return go({ ...state, confirmedThemes: [], confirmedNeed: "I would rather explore without more questions", supportNeed: "not-sure", quietReader: true }, "discovery");
    case "OPEN_UNDERSTANDING": return go(state, "understanding");
    case "TOGGLE_THEME": {
      const has = state.confirmedThemes.includes(action.theme);
      const confirmedThemes = has ? state.confirmedThemes.filter((theme) => theme !== action.theme) : [...state.confirmedThemes, action.theme];
      return { ...state, confirmedThemes, rejectedThemes: has ? [...state.rejectedThemes, action.theme] : state.rejectedThemes.filter((theme) => theme !== action.theme), error: "" };
    }
    case "SET_SUPPORT_NEED": return { ...state, supportNeed: action.need, confirmedNeed: action.label };
    case "CONFIRM_UNDERSTANDING": return go({ ...state, noMatch: false, selectedCommunityId: "", quietReader: state.supportNeed === "quiet-reading" }, "discovery");
    case "OPEN_DISCOVERY": return go(state, "discovery");
    case "OPEN_COMMUNITY": return go({ ...state, selectedCommunityId: action.communityId, communityTab: "experiences", selectedExperienceId: null }, "community");
    case "SET_COMMUNITY_TAB": return { ...state, communityTab: action.tab };
    case "OPEN_EXPERIENCE": return go({ ...state, selectedExperienceId: action.experienceId, openedExperienceIds: state.openedExperienceIds.includes(action.experienceId) ? state.openedExperienceIds : [...state.openedExperienceIds, action.experienceId] }, "experience");
    case "CLOSE_EXPERIENCE": return { ...state, screen: "community", selectedExperienceId: null, history: state.history.slice(0, -1), error: "" };
    case "TOGGLE_TOPIC_COMPARISON": return { ...state, topicComparisonOpen: !state.topicComparisonOpen };
    case "SET_NO_MATCH": return { ...state, noMatch: action.value, confirmedThemes: action.value ? state.confirmedThemes : [] };
    case "OPEN_QUESTION": {
      const allowed = fixtures.contributors.find((person) => person.id === "contributor.ravi")?.scope.anonymousQuestions;
      if (state.selectedExperienceId !== "experience.ravi" || !allowed || !state.contributorAllowsQuestions || !state.contributorPublished) return { ...state, error: "This contributor is not accepting questions in this example." };
      return go({ ...state, questionConsent: false, questionChannel: "private", questionPayload: null, error: "" }, "question");
    }
    case "OPEN_GROUP_QUESTION": {
      if (state.selectedExperienceId !== "experience.ravi" || state.selectedCommunityId !== "community.family-expectations" || !state.contributorAllowsQuestions || !state.contributorPublished) return { ...state, error: "This group question is not available in the current example." };
      return go({ ...state, questionConsent: false, questionChannel: "group", questionPayload: null, error: "" }, "question");
    }
    case "SET_ALIAS": return { ...state, alias: action.value.slice(0, 24), questionConsent: false };
    case "SET_QUESTION_TEXT": return { ...state, questionText: action.value.slice(0, 400), questionConsent: false };
    case "SET_QUESTION_CONSENT": return { ...state, questionConsent: action.value };
    case "SEND_QUESTION": {
      const validAlias = /^[A-Za-z0-9_]{3,24}$/.test(state.alias.trim());
      const channelAllowed = state.questionChannel === "group"
        ? state.selectedCommunityId === "community.family-expectations" && state.selectedExperienceId === "experience.ravi"
        : state.questionChannel === "private" && fixtures.contributors.find((person) => person.id === "contributor.ravi")?.scope.anonymousQuestions === true;
      if (!state.questionConsent || !validAlias || state.questionText.trim().length < 12 || !state.contributorPublished || !state.contributorAllowsQuestions || !channelAllowed) {
        return { ...state, error: "Review the alias and question, then choose the consent checkbox to continue." };
      }
      const questionPayload = composePeerQuestionPayload({ recipientId: state.questionChannel === "group" ? "community.family-expectations" : "contributor.ravi", alias: state.alias, questionText: state.questionText });
      return go({ ...state, questionPayload, error: "" }, "reply");
    }
    case "CONTINUE_AFTER_REPLY": return go(state, "reflection");
    case "SET_USEFULNESS": return { ...state, usefulness: action.value };
    case "EXPLORE_DIFFERENT_PERSPECTIVE": {
      const themes: ThemeId[] = state.selectedExperienceId === "experience.ravi"
        ? ["relationship-uncertainty"]
        : state.selectedExperienceId === "experience.nisha" && state.contributorPublished
          ? ["family-expectations"]
          : [];
      return go({ ...state, usefulness: "not-helpful", confirmedThemes: themes, noMatch: false, selectedExperienceId: null, quietReader: true }, "discovery");
    }
    case "SET_NEXT_STEP": return { ...state, nextStep: action.value };
    case "SET_INSIGHT_DRAFT": return { ...state, insightDraft: action.value, insightApproved: false };
    case "APPROVE_INSIGHT": return { ...state, insightApproved: state.insightDraft.trim().length > 0 };
    case "OPEN_JOURNEY": return go(state, "journey");
    case "START_FUTURE_CHAPTER": {
      const priorChapter: PriorChapterSnapshot = state.priorChapter ?? {
        opening: state.opening,
        confirmedNeed: state.confirmedNeed,
        confirmedThemes: [...state.confirmedThemes],
        rejectedThemes: [...state.rejectedThemes],
        openedExperienceIds: [...state.openedExperienceIds],
        questionPayload: state.questionPayload ? { ...state.questionPayload } : null,
        usefulness: state.usefulness,
        nextStep: state.nextStep,
        insightDraft: state.insightDraft,
        insightApproved: state.insightApproved,
      };
      const canCarryApprovedTakeaway = action.carryContext && state.insightApproved;
      return go({
        ...state,
        chapter: "belonging",
        futureChapterStarted: true,
        priorChapter,
        carryPreviousContext: canCarryApprovedTakeaway,
        carriedTakeaway: canCarryApprovedTakeaway ? state.insightDraft : "",
        isFeaturedJourney: true,
        quietReader: true,
        opening: fixtures.chapters.find((chapter) => chapter.id === "chapter.arjun-belonging")?.futureNote ?? "I moved cities recently. I feel lonely after work.",
        turns: [],
        questionStep: 0,
        mockTextNotice: false,
        proposedThemes: ["relocation", "belonging", "hobbies"],
        confirmedThemes: ["relocation", "belonging", "hobbies"],
        rejectedThemes: [],
        confirmedNeed: "Wants regular social connection, not additional marriage advice.",
        supportNeed: "shared-activity",
        selectedCommunityId: "community.moving-friends",
        selectedExperienceId: null,
        openedExperienceIds: [],
        noMatch: false,
        questionText: fixtures.peerQuestionDraft.questionText,
        questionConsent: false,
        questionPayload: null,
        usefulness: null,
        nextStep: "",
        insightDraft: "",
        insightApproved: false,
        reportShown: false,
      }, "discovery");
    }
    case "OPEN_CONTRIBUTE": return go(state, "contribute");
    case "SET_CONTRIBUTOR_DRAFT": return { ...state, contributorDraft: action.value };
    case "SET_CONTRIBUTOR_SUMMARY": return { ...state, contributorSummary: action.value, contributorApproved: false };
    case "OPEN_CONTRIBUTOR_PREVIEW": return { ...state, contributorPreviewOpen: true };
    case "APPROVE_CONTRIBUTOR": return { ...state, contributorApproved: true };
    case "SET_CONTRIBUTOR_SCOPE": return { ...state, contributorDiscoverable: action.discoverable, contributorAllowsQuestions: action.questions && action.discoverable };
    case "PUBLISH_CONTRIBUTOR": return state.contributorApproved
      ? { ...state, contributorPublished: state.contributorDiscoverable, error: "" }
      : { ...state, error: "Review the public summary and approve it before publishing." };
    case "REVOKE_CONTRIBUTOR": return { ...state, contributorPublished: false, contributorDiscoverable: false, contributorAllowsQuestions: false, contributorApproved: false, error: "" };
    case "OPEN_HELP": return go(state, "help");
    case "OPEN_CONVERSATION": return go(state, "conversation");
    case "OPEN_CONNECTIONS": return go(state, "connections");
    case "OPEN_PROFESSIONAL": return go(state, "professional");
    case "OPEN_MODERATION": return go(state, "moderation");
    case "REPORT_EXAMPLE": return { ...state, reportShown: true };
    case "BACK": {
      const previous = state.history[state.history.length - 1];
      if (!previous) return { ...state, screen: "entry", error: "" };
      return { ...state, screen: previous, history: state.history.slice(0, -1), error: "" };
    }
    case "RESTART": return { ...initialHarmoniseState };
    default: return cloneState(state);
  }
}
