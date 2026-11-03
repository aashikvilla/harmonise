"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  fixtures,
  getPublicExperiences,
  getRecommendedCommunities,
  harmoniseReducer,
  stateForEntry,
  themeLabels,
  type CommunityTab,
  type EntryPath,
  type HarmoniseAction,
  type HarmoniseState,
  type SupportNeed,
  type ThemeId,
} from "@/lib/harmonise";
import { hasFamilyContext } from "@/lib/conversation";
import { arjunVisits, type VisitTurn } from "@/lib/arjun-visits";
import { historicalThread, type HistoricalDay } from "@/lib/historical-thread";
import SessionPanel, { type ResumePayload } from "@/components/account/session-panel";
import { saveConversation, setSyncSession } from "@/lib/session-sync";
import { COMMUNITY_THEMES, THEME_LABELS } from "@/lib/community-topics";

const navItems = [
  { label: "My Space", screen: "conversation" as const },
  { label: "Communities", screen: "discovery" as const },
  { label: "Connections", screen: "connections" as const },
  { label: "My Journey", screen: "journey" as const },
  { label: "Find Support", screen: "help" as const },
];

const communityTabs: { id: CommunityTab; label: string }[] = [
  { id: "experiences", label: "Experiences" },
  { id: "discussions", label: "Discussions" },
  { id: "people", label: "People" },
  { id: "guidelines", label: "Guidelines" },
];

const goalStates = [
  ["not-tried", "Not tried"],
  ["tried", "Tried"],
  ["changed-plan", "Changed plan"],
  ["paused", "Paused"],
] as const;

function Brand() {
  return <Link href="/" className="brand" aria-label="Harmonize home"><svg className="brand-symbol" viewBox="0 0 40 40" aria-hidden="true"><path d="M8 23C8 14 15 9 23 9C31 9 34 15 29 20C23 26 12 22 12 29C12 34 22 34 28 26"/><circle cx="31" cy="24" r="2.6"/></svg><span>harmonize<span className="brand-period">.</span></span></Link>;
}

function Notice({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "human" | "private" }) {
  return <p className={`notice notice-${tone}`}>{children}</p>;
}

function PrimaryButton({ children, onClick, disabled = false, type = "button" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return <button type={type} className="button button-primary" onClick={onClick} disabled={disabled}>{children}</button>;
}

function SecondaryButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) {
  return <button type="button" className="button button-secondary" onClick={onClick} disabled={disabled}>{children}</button>;
}

function textForTheme(theme: ThemeId) {
  return themeLabels[theme];
}

async function encodeMonoPcmWav(recording: Blob): Promise<Blob> {
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(await recording.arrayBuffer());
    const targetRate = 24_000;
    const sourceRate = decoded.sampleRate;
    const sampleCount = Math.ceil(decoded.length * targetRate / sourceRate);
    const samples = new Float32Array(sampleCount);
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, channel) => decoded.getChannelData(channel));

    for (let i = 0; i < sampleCount; i += 1) {
      const sourcePosition = i * sourceRate / targetRate;
      const left = Math.floor(sourcePosition);
      const fraction = sourcePosition - left;
      let sum = 0;
      for (const channel of channels) {
        const first = channel[Math.min(left, decoded.length - 1)] ?? 0;
        const second = channel[Math.min(left + 1, decoded.length - 1)] ?? first;
        sum += first + (second - first) * fraction;
      }
      samples[i] = sum / channels.length;
    }

    const wav = new ArrayBuffer(44 + sampleCount * 2);
    const view = new DataView(wav);
    const writeText = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
    };
    writeText(0, "RIFF");
    view.setUint32(4, 36 + sampleCount * 2, true);
    writeText(8, "WAVE");
    writeText(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(36, "data");
    view.setUint32(40, sampleCount * 2, true);
    for (let i = 0; i < sampleCount; i += 1) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }
    return new Blob([wav], { type: "audio/wav" });
  } finally {
    await audioContext.close();
  }
}

function activeCommunity(state: HarmoniseState) {
  return fixtures.communities.find((community) => community.id === state.selectedCommunityId) ?? null;
}

function activeExperience(state: HarmoniseState) {
  return getPublicExperiences(state).find((experience) => experience.id === state.selectedExperienceId) ?? null;
}

function HumanConnectionIllustration() {
  return <figure className="entry-illustration" aria-hidden="true">
    <svg viewBox="0 0 460 320" role="presentation">
      <ellipse cx="230" cy="164" rx="184" ry="125" fill="#f6e7df" />
      <ellipse cx="230" cy="164" rx="145" ry="101" fill="#eee9f7" />
      <path className="illustration-thread" d="M91 213C128 159 147 140 196 157S268 203 315 159 362 128 389 141" fill="none" stroke="#bf8178" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 9" />
      <path d="M111 223c-3-37 9-62 37-62s41 25 38 62" fill="#c5b6db" />
      <circle cx="148" cy="135" r="25" fill="#e9c4a8" />
      <path d="M124 136c-4-28 13-43 34-36 11 4 16 14 15 26-9-9-21-11-33-4-6 3-11 9-16 14" fill="#56465a" />
      <path d="M195 235c-4-43 10-72 36-72s41 29 37 72" fill="#bb706d" />
      <circle cx="231" cy="143" r="28" fill="#f2cfaa" />
      <path d="M204 142c1-31 18-44 39-35 11 5 16 16 15 29-10-8-21-11-34-4-7 3-14 8-20 10" fill="#40374e" />
      <path d="M286 220c-3-37 8-61 36-61s39 24 36 61" fill="#9ebdc4" />
      <circle cx="322" cy="132" r="24" fill="#c88d70" />
      <path d="M298 133c-1-27 13-39 31-35 13 3 18 12 18 25-9-6-19-8-29-4-8 3-14 9-20 14" fill="#574653" />
      <circle cx="86" cy="105" r="7" fill="#d28a7c" />
      <circle cx="375" cy="219" r="6" fill="#9a8bb3" />
      <path d="M231 201v15m-8-7h16" stroke="#fffaf5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  </figure>;
}

function appHeading(state: HarmoniseState) {
  const headings: Record<HarmoniseState["screen"], string> = {
    entry: "I can’t tell my family what I want without feeling ungrateful.",
    conversation: "You can start anywhere.",
    understanding: "Have I understood what matters?",
    discovery: state.chapter === "belonging" ? "Find a way to feel more connected" : "Explore communities and experiences",
    community: activeCommunity(state)?.name ?? "Community",
    experience: "One person's experience",
    question: "Ask Ravi in the group",
    reply: "A perspective from Ravi",
    reflection: "Was any part of this useful?",
    journey: "Your journey, in your words",
    contribute: "Share an experience by choice",
    help: "Find Support",
    connections: "Connections, by mutual choice",
    professional: "Professional and community team",
    moderation: "Community review",
  };
  return headings[state.screen];
}

type LiveCommunity = { id: string; name: string; description: string; memberCount: number; postCount: number };

function CircleRecommendation({ themes }: { themes: string[] }) {
  const [communities, setCommunities] = useState<LiveCommunity[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/communities", { credentials: "include" });
        const body = (await response.json().catch(() => null)) as { communities?: LiveCommunity[] } | null;
        if (!cancelled && response.ok && Array.isArray(body?.communities)) setCommunities(body.communities);
        else if (!cancelled) setCommunities([]);
      } catch {
        if (!cancelled) setCommunities([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (communities === null || communities.length === 0) return null;
  const ranked = communities
    .filter((community) => community.memberCount > 0)
    .map((community) => ({
      community,
      overlap: (COMMUNITY_THEMES[community.id] ?? []).filter((theme) => themes.includes(theme)),
    }))
    .filter((entry) => entry.overlap.length > 0)
    .sort((a, b) => b.overlap.length - a.overlap.length)
    .slice(0, 2);
  if (ranked.length === 0) return null;
  return (
    <section className="circle-recommendation" aria-label="A circle that may fit">
      <span className="context-eyebrow">A CIRCLE THAT MAY FIT</span>
      {ranked.map(({ community, overlap }) => (
        <article key={community.id} className="circle-recommendation-card">
          <h3>{community.name}</h3>
          <p>
            Matched because: {overlap.map((theme) => THEME_LABELS[theme] ?? theme).join(" · ")}.{" "}
            {community.memberCount} members · {community.postCount} posts.
          </p>
          <div className="inline-actions">
            <Link className="button button-primary" href={`/communities/${community.id}`}>
              Preview this circle
            </Link>
          </div>
        </article>
      ))}
      <Link className="text-button" href={`/communities?themes=${themes.join(",")}`}>
        Compare all circles with your themes
      </Link>
    </section>
  );
}

function SavedChatsInJourney({ onResume }: { onResume: (payload: ResumePayload) => void }) {
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; last_active_at: string }> | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState("");
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/sessions", { credentials: "include", cache: "no-store" });
        const body = (await response.json().catch(() => null)) as { sessions?: Array<{ id: string; title: string; last_active_at: string }> } | null;
        if (!cancelled) setSessions(response.ok && Array.isArray(body?.sessions) ? body.sessions : []);
      } catch {
        if (!cancelled) setSessions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  if (!sessions || sessions.length === 0) return null;
  async function resume(id: string) {
    setResumingId(id);
    setResumeError("");
    try {
      const response = await fetch(`/api/sessions/${id}`, { credentials: "include", cache: "no-store" });
      const body = (await response.json().catch(() => null)) as {
        session?: { id: string; title: string };
        messages?: { role: string; text: string }[];
        understanding?: { suggested_themes: string[]; confirmed_themes: string[]; support_need: string; need_summary: string } | null;
      } | null;
      if (!response.ok || !body?.session) {
        setResumeError("This saved chat couldn’t be opened. Please try again.");
        return;
      }
      onResume({
        sessionId: id,
        title: body.session.title,
        turns: (body.messages ?? [])
          .filter((message) => message.role === "user" || message.role === "assistant")
          .map((message) => ({ role: message.role === "user" ? ("you" as const) : ("harmonise" as const), text: message.text })),
        understanding: body.understanding
          ? {
              suggested: body.understanding.suggested_themes ?? [],
              confirmed: body.understanding.confirmed_themes ?? [],
              need: body.understanding.support_need ?? "not-sure",
              summary: body.understanding.need_summary ?? "",
            }
          : null,
      });
    } catch {
      setResumeError("This saved chat couldn’t be opened. Check your connection and try again.");
    } finally {
      setResumingId(null);
    }
  }
  return (
    <section className="panel" aria-label="Your saved chats">
      <span className="tag tag-private">SAVED · ONLY YOU</span>
      <h2>Your saved chats</h2>
      <ul className="session-list">
        {sessions.map((session) => (
          <li key={session.id}>
            <div>
              <strong>{session.title}</strong>
              <span className="small-note">{new Date(session.last_active_at).toLocaleString()}</span>
            </div>
            <div className="inline-actions">
              <button type="button" className="button button-secondary" disabled={resumingId !== null} onClick={() => void resume(session.id)}>
                {resumingId === session.id ? "Opening…" : "Resume in My Space"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {resumeError && <p className="small-note" role="status">{resumeError}</p>}
    </section>
  );
}

export default function HarmoniseExperience({ initialPath }: { initialPath?: Exclude<EntryPath, null> | "arjun" | "help" }) {
  const [state, dispatch] = useReducer(harmoniseReducer, initialPath, stateForEntry);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const [groupReplyDraft, setGroupReplyDraft] = useState("");
  const [groupReplyPreview, setGroupReplyPreview] = useState(false);
  const [groupReplyConsent, setGroupReplyConsent] = useState(false);
  const [groupReplies, setGroupReplies] = useState<string[]>([]);
  const [groupReportOpen, setGroupReportOpen] = useState(false);
  const [groupReportSubmitted, setGroupReportSubmitted] = useState(false);
  const [historicalDay, setHistoricalDay] = useState<HistoricalDay>("Day 4");
  const [historicalTriageOpen, setHistoricalTriageOpen] = useState(false);
  const [devContributionChoice, setDevContributionChoice] = useState<"offer" | "later" | null>(null);
  const [devContributionClose, setDevContributionClose] = useState(false);
  const [devContributionText, setDevContributionText] = useState("I asked for time to think before replying. We argued, and I’m still working out what I want.");
  const [devContributionConsent, setDevContributionConsent] = useState(false);
  const [devContributionAdded, setDevContributionAdded] = useState(false);
  const [moderationDecision, setModerationDecision] = useState("");
  const [goalStatus, setGoalStatus] = useState<"not-tried" | "tried" | "changed-plan" | "paused">("not-tried");
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "accepted" | "declined" | "blocked">("none");
  const [spaceTopic, setSpaceTopic] = useState("family");
  const [topicChats, setTopicChats] = useState<Record<string, { id: string; role: "you" | "harmonise"; text: string }[]>>({ family: [] });
  const [activeVisitId, setActiveVisitId] = useState("day-1");
  const [visitHistory, setVisitHistory] = useState<Record<string, VisitTurn[]>>(() => Object.fromEntries(arjunVisits.map((visit) => [visit.id, visit.turns])));
  const [chatTurns, setChatTurns] = useState<{ id: string; role: "you" | "harmonise"; text: string }[]>([]);
  const [chatPending, setChatPending] = useState(false);
  const [privacyNoteDismissed, setPrivacyNoteDismissed] = useState(false);
  const [chatError, setChatError] = useState("");
  const [modelLive, setModelLive] = useState(false);
  const [suggestedThemes, setSuggestedThemes] = useState<ThemeId[]>([]);
  const [suggestedNeed, setSuggestedNeed] = useState<{ summary: string; type: SupportNeed }>({ summary: "", type: "not-sure" });
  const [composer, setComposer] = useState(initialPath === "arjun" ? "I don't know... things at home feel weird lately." : "");
  const [understandingConfirmed, setUnderstandingConfirmed] = useState(false);
  const [correctionRequested, setCorrectionRequested] = useState(false);
  const [correctedUnderstanding, setCorrectedUnderstanding] = useState("");
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "processing" | "review">("idle");
  const [recordingError, setRecordingError] = useState("");
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [recordingAudio, setRecordingAudio] = useState<Blob | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordingAutoRef = useRef(false);
  const recordingElapsedRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [triageLoading, setTriageLoading] = useState(false);
  const [triageResult, setTriageResult] = useState<{ concern: string; severity: string; rationale: string; recommendedAction: string } | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const cancelledRecordingRef = useRef(false);
  const recordingTimerRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const transcriptAreaRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousScreenRef = useRef(state.screen);
  const community = activeCommunity(state);
  const experience = activeExperience(state);
  const recommended = getRecommendedCommunities(state);
  const publicExperiences = getPublicExperiences(state);
  const publicExperienceIds = community?.experienceIds ?? [];
  const shownExperiences = publicExperiences.filter((record) =>
    publicExperienceIds.includes(record.id) ||
    (community?.id === "community.family-expectations" && record.id === "experience.nisha")
  );
  const discussions = fixtures.discussions.filter((discussion) => community?.discussionIds.includes(discussion.id));
  const aliasValid = /^[A-Za-z0-9_]{3,24}$/.test(state.alias.trim());
  const questionValid = state.questionText.trim().length >= 12;
  const stateDispatch = dispatch as (action: HarmoniseAction) => void;

  useEffect(() => {
    if (previousScreenRef.current !== state.screen) headingRef.current?.focus();
    previousScreenRef.current = state.screen;
  }, [state.screen]);

  useEffect(() => {
    if (chatTurns.length === 0) return;
    chatEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [chatTurns.length]);

  useEffect(() => {
    const adopt = (event: Event) => {
      const id = (event as CustomEvent<{ sessionId?: unknown }>).detail?.sessionId;
      if (typeof id === "string") setActiveSessionId(id);
    };
    window.addEventListener("harmonise:sessions-changed", adopt);
    return () => window.removeEventListener("harmonise:sessions-changed", adopt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/ready", { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as { model?: { configured?: unknown } } | null;
        if (!cancelled) setModelLive(body?.model?.configured === true);
      } catch {
        if (!cancelled) setModelLive(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
  }, []);
  useEffect(() => {
    if (transcriptDraft) transcriptAreaRef.current?.focus();
  }, [transcriptDraft]);
  // Navigation must drop in-memory audio and drafts; intentional reset, not derived state.

  useEffect(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    recorderRef.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- navigation reset, not derived state
    setRecordingAudio(null); setTranscriptDraft(""); setRecordingState("idle");
  }, [state.screen]);

  function navigate(screen: (typeof navItems)[number]["screen"]) {
    if (screen === "conversation") stateDispatch({ type: "OPEN_CONVERSATION" });
    if (screen === "discovery") stateDispatch({ type: "OPEN_DISCOVERY" });
    if (screen === "journey") stateDispatch({ type: "OPEN_JOURNEY" });
    if (screen === "help") stateDispatch({ type: "OPEN_HELP" });
    if (screen === "connections") stateDispatch({ type: "OPEN_CONNECTIONS" });
  }

  function restartJourney() {
    stateDispatch({ type: "RESTART" });
    stateDispatch({ type: "START_PATH", path: "talk" });
    setChatTurns([]);
    setChatError("");
    setChatPending(false);
    setSuggestedThemes([]);
    setSuggestedNeed({ summary: "", type: "not-sure" });
    setComposer("");
    setUnderstandingConfirmed(false);
    setRecordingState("idle");
    setTranscriptDraft("");
    setRecordingAudio(null);
    setRecordingError("");
    setTriageResult(null);
    setModerationDecision("");
    setSpaceTopic("family");
    setTopicChats({ family: [] });
    setActiveVisitId("day-1");
    setVisitHistory(Object.fromEntries(arjunVisits.map((visit) => [visit.id, visit.turns])));
    try { window.sessionStorage.removeItem("harmonise-arjun-visits"); } catch { /* storage is optional */ }
  }

  function openVisit(visitId: string) {
    let merged = { ...visitHistory };
    try {
      const saved: unknown = JSON.parse(window.sessionStorage.getItem("harmonise-arjun-visits") ?? "null");
      if (saved && typeof saved === "object") {
        for (const visit of arjunVisits) {
          const candidate = (saved as Record<string, unknown>)[visit.id];
          if (Array.isArray(candidate) && candidate.every((turn) => turn && typeof turn === "object" && typeof (turn as VisitTurn).text === "string" && ((turn as VisitTurn).role === "you" || (turn as VisitTurn).role === "harmonise"))) merged[visit.id] = candidate as VisitTurn[];
        }
      }
    } catch { /* session storage is optional */ }
    if (chatTurns.length > 0) merged = { ...merged, [activeVisitId]: chatTurns };
    setVisitHistory(merged);
    setActiveVisitId(visitId);
    const nextTurns = merged[visitId] ?? arjunVisits.find((visit) => visit.id === visitId)?.turns ?? [];
    setChatTurns(nextTurns);
    try { window.sessionStorage.setItem("harmonise-arjun-visits", JSON.stringify(merged)); } catch { /* session storage is optional */ }
    setComposer("");
    setUnderstandingConfirmed(false);
  }

  function startSeparateTopic(topic: string, opener: string) {
    const currentTurns = chatTurns;
    setTopicChats((chats) => ({ ...chats, [spaceTopic]: currentTurns }));
    const nextTurns = topicChats[topic] ?? [];
    setSpaceTopic(topic);
    setChatTurns(nextTurns);
    setComposer(opener);
    setUnderstandingConfirmed(false);
    const mappedTurns = nextTurns.map((turn) => ({ id: turn.id, speaker: turn.role === "you" ? "arjun" as const : "guide" as const, text: turn.text }));
    const family = topic === "family" && hasFamilyContext(nextTurns);
    stateDispatch({
      type: "SYNC_CHAT_CONTEXT",
      turns: mappedTurns,
      themes: family ? ["family-expectations", "personal-autonomy"] : [],
      need: family ? "Perspectives on family expectations, without pressure to choose a relationship outcome." : "No support preference confirmed in this separate topic.",
    });
  }


  function resumeSession(payload: ResumePayload) {
    const turns = payload.turns.map((turn, index) => ({ id: `srv-${payload.sessionId}-${index}`, role: turn.role, text: turn.text }));
    setChatTurns(turns);
    setTopicChats((chats) => ({ ...chats, [spaceTopic]: turns }));
    setComposer("");
    setChatError("");
    const supportedNeeds = ["human-perspective", "quiet-reading", "shared-activity", "not-sure"];
    setSuggestedThemes((payload.understanding?.suggested ?? []).filter((theme): theme is ThemeId => Object.hasOwn(themeLabels, theme)));
    setSuggestedNeed({ summary: payload.understanding?.summary ?? "", type: (supportedNeeds.includes(payload.understanding?.need ?? "") ? payload.understanding?.need : "not-sure") as SupportNeed });
    setCorrectedUnderstanding(payload.understanding?.summary ?? "");
    setUnderstandingConfirmed((payload.understanding?.confirmed.length ?? 0) > 0);
    setCorrectionRequested(false);
    setActiveSessionId(payload.sessionId);
  }
  function renderConversation() {
    async function sendChat(text = composer) {
      const clean = text.trim();
      if (!clean || chatPending) return;
      setChatError("");
      setComposer("");
      setUnderstandingConfirmed(false);
      setChatPending(true);
      const userTurn = { id: `you-${Date.now()}`, role: "you" as const, text: clean };
      setChatTurns((current) => [...current, userTurn]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: clean,
            history: chatTurns.slice(-8).map((turn) => ({ role: turn.role === "you" ? "user" : "adviser", text: turn.text })),
          }),
        });
        const payload: unknown = await response.json().catch(() => null);
        if (payload && typeof payload === "object" && (payload as Record<string, unknown>).crisis === true) {
          setChatError("I’m taking you to the safety and support information. This app cannot monitor you or contact emergency services.");
          stateDispatch({ type: "OPEN_HELP" });
          return;
        }
        const result = payload as { reply?: unknown; suggestedThemes?: unknown; supportNeed?: unknown; needSummary?: unknown } | null;
        if (!response.ok || !result || typeof result.reply !== "string" || !Array.isArray(result.suggestedThemes) || typeof result.supportNeed !== "string" || typeof result.needSummary !== "string") {
          setComposer(clean);
          setChatError("Meta AI couldn’t respond just now. Your message is still here; you can retry or keep exploring without AI.");
          return;
        }

        const next = [...chatTurns, userTurn, { id: `meta-${Date.now()}`, role: "harmonise" as const, text: result.reply }];
        setChatTurns(next);
        setTopicChats((chats) => ({ ...chats, [spaceTopic]: next }));
        setSuggestedThemes(result.suggestedThemes.filter((theme): theme is ThemeId => typeof theme === "string" && Object.hasOwn(themeLabels, theme)));
        setSuggestedNeed({ summary: result.needSummary, type: result.supportNeed as SupportNeed });
        void saveConversation(next.map((turn) => ({ role: turn.role, text: turn.text })), {
          suggestedThemes: result.suggestedThemes.filter((theme): theme is ThemeId => typeof theme === "string" && Object.hasOwn(themeLabels, theme)),
          confirmedThemes: [],
          supportNeed: result.supportNeed,
          needSummary: result.needSummary,
          correctionRequested,
        });
        setCorrectedUnderstanding(result.needSummary);
        setCorrectionRequested(false);
        if (state.isFeaturedJourney) {
          const updated = { ...visitHistory, [activeVisitId]: next };
          setVisitHistory(updated);
          try { window.sessionStorage.setItem("harmonise-arjun-visits", JSON.stringify(updated)); } catch { /* session storage is optional */ }
        }
      } catch {
        setComposer(clean);
        setChatError("Meta AI couldn’t be reached. Your message is still here; you can retry or keep exploring without AI.");
      } finally {
        setChatPending(false);
      }
    }

    function beginNewServerSession() {
      setChatTurns([]);
      setTopicChats((chats) => ({ ...chats, [spaceTopic]: [] }));
      setComposer("");
      setChatError("");
      setSuggestedThemes([]);
      setSuggestedNeed({ summary: "", type: "not-sure" });
      setCorrectedUnderstanding("");
      setUnderstandingConfirmed(false);
      setCorrectionRequested(false);
      setActiveSessionId(null);
    }

    function handleSessionDeleted(id: string) {
      if (id === activeSessionId) beginNewServerSession();
    }

    async function startRecording() {
      setRecordingError("");
      setRecordingAudio(null);
      setTranscriptDraft("");
      cancelledRecordingRef.current = false;
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setRecordingError("Voice recording isn’t available in this browser. You can keep typing here.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) => {
          try {
            return typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(candidate);
          } catch {
            return false;
          }
        });
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        recordingChunksRef.current = [];
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) recordingChunksRef.current.push(event.data);
        };
        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          recorderRef.current = null;
          if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
          if (recordingElapsedRef.current !== null) window.clearInterval(recordingElapsedRef.current);
          recordingElapsedRef.current = null;
          recordingTimerRef.current = null;
          if (cancelledRecordingRef.current) return;
          try {
            const recording = new Blob(recordingChunksRef.current, { type: recorder.mimeType || "audio/webm" });
            if (!recording.size) {
              setRecordingState("idle");
              setRecordingError("No audio was captured. Check your microphone, then try again or type your message.");
              return;
            }
            const wav = await encodeMonoPcmWav(recording);
            if (wav.size > 8 * 1024 * 1024) {
              setRecordingState("idle");
              setRecordingError("That recording is longer than the 2-minute limit. Try a shorter recording or type your message.");
              return;
            }
            setRecordingAudio(wav);
            if (recordingAutoRef.current) {
              recordingAutoRef.current = false;
              void transcribeAndUse(wav);
              return;
            }
            setRecordingState("review");
          } catch {
            setRecordingState("idle");
            setRecordingError("The recording couldn’t be prepared for transcription. Try a shorter recording or type your message.");
          }
        };
        recorderRef.current = recorder;
        recorder.start();
        recordingStartedAtRef.current = Date.now();
        setRecordingElapsed(0);
        if (recordingElapsedRef.current !== null) window.clearInterval(recordingElapsedRef.current);
        recordingElapsedRef.current = window.setInterval(() => {
          setRecordingElapsed(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000));
        }, 500);
        setRecordingState("recording");
        recordingTimerRef.current = window.setTimeout(() => {
          if (recorder.state === "recording") {
            setRecordingState("processing");
            recorder.stop();
          }
        }, 120_000);
      } catch {
        setRecordingError("Microphone access wasn’t granted. You can continue by typing, or try again.");
      }
    }

    async function transcribeAndUse(wav: Blob) {
      setRecordingError("");
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append("audio", wav, "recording.wav");
        const response = await fetch("/api/voice/transcribe", { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
        const payload: unknown = await response.json().catch(() => null);
        const transcript = payload && typeof payload === "object" ? (payload as Record<string, unknown>).transcript : null;
        if (!response.ok || typeof transcript !== "string" || !transcript.trim()) {
          setRecordingAudio(wav);
          setRecordingState("review");
          setRecordingError("Auto-transcription didn’t catch that. Review the recording or type your words.");
          return;
        }
        setComposer(transcript.trim());
        setRecordingAudio(null);
        setRecordingState("idle");
        document.getElementById("chat-input")?.focus();
      } catch {
        setRecordingAudio(wav);
        setRecordingState("review");
        setRecordingError("Auto-transcription didn’t catch that. Review the recording or type your words.");
      } finally {
        setTranscribing(false);
      }
    }

    function toggleMicRecording() {
      if (recordingState === "recording") {
        const recorder = recorderRef.current;
        if (!recorder || recorder.state !== "recording") return;
        recordingAutoRef.current = true;
        setRecordingState("processing");
        recorder.stop();
        return;
      }
      if (recordingState === "idle") {
        recordingAutoRef.current = true;
        void startRecording();
      }
    }

    function stopRecording() {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== "recording") return;
      setRecordingState("processing");
      recorder.stop();
    }

    function cancelRecording() {
      cancelledRecordingRef.current = true;
      recordingAutoRef.current = false;
      if (recordingElapsedRef.current !== null) window.clearInterval(recordingElapsedRef.current);
      recordingElapsedRef.current = null;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      recorderRef.current = null;
      if (recordingTimerRef.current !== null) window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setRecordingState("idle");
      setTranscriptDraft("");
      setRecordingAudio(null);
    }

    async function transcribeRecording() {
      if (!recordingAudio || transcribing) return;
      setRecordingError("");
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append("audio", recordingAudio, "recording.wav");
        const response = await fetch("/api/voice/transcribe", { method: "POST", body: form, signal: AbortSignal.timeout(60_000) });
        const payload: unknown = await response.json().catch(() => null);
        const transcript = payload && typeof payload === "object" ? (payload as Record<string, unknown>).transcript : null;
        if (response.status === 413) {
          setRecordingError("That recording is too large to transcribe. Try a shorter recording or type your words.");
          return;
        }
        if (response.status === 429 || response.status === 503) {
          setRecordingError("Meta Voice is busy right now. Your recording is kept for review; try again in a moment or type your words.");
          return;
        }
        if (!response.ok || typeof transcript !== "string" || !transcript.trim()) {
          setRecordingError("Meta Voice couldn’t transcribe this recording. You can try again or type your words.");
          return;
        }
        setTranscriptDraft(transcript.trim());
      } catch (error) {
        if (error instanceof Error && error.name === "TimeoutError") {
          setRecordingError("Transcription timed out. Your recording is kept for review; try again or type your words.");
          return;
        }
        setRecordingError("Meta Voice couldn’t be reached. You can try again or type your words.");
      } finally {
        setTranscribing(false);
      }
    }

    function exploreExperiences() {
      const mappedTurns = chatTurns.map((turn) => ({ id: turn.id, speaker: turn.role === "you" ? "arjun" as const : "guide" as const, text: turn.text }));
      stateDispatch({ type: "SYNC_CHAT_CONTEXT", turns: mappedTurns, themes: suggestedThemes, need: suggestedNeed.summary || "Explore without personal context" });
      setUnderstandingConfirmed(true);
      stateDispatch({ type: "OPEN_DISCOVERY" });
    }

    return <>
      <p className="lede">{spaceTopic === "family" ? "Talk it through privately, or explore at your own pace." : `A separate ${spaceTopic} conversation. Earlier family context is not included.`}</p>
      {!privacyNoteDismissed && <p className="small-note privacy-note">Your chat is not posted to a community. Sending uses Meta for a Muse Spark reply. <button type="button" className="text-button" onClick={() => setPrivacyNoteDismissed(true)} aria-label="Dismiss privacy note">Got it</button></p>}
      {state.isFeaturedJourney && <section className="visit-switcher" aria-label="Arjun's saved visits">
        <div className="visit-switcher-heading"><div><span className="context-eyebrow">ARJUN · FICTIONAL STORY HISTORY</span><strong>Return visits</strong></div><span>{arjunVisits.reduce((total, visit) => total + visit.turns.filter((turn) => turn.role === "you").length, 0)} written exchanges</span></div>
        <div className="visit-buttons">{arjunVisits.map((visit) => <button key={visit.id} type="button" className={activeVisitId === visit.id ? "visit-button selected" : "visit-button"} aria-pressed={activeVisitId === visit.id} onClick={() => openVisit(visit.id)}><strong>{visit.day}</strong><span>{visit.title}</span></button>)}</div>
        <p className="small-note">{arjunVisits.find((visit) => visit.id === activeVisitId)?.intention}. Choose any visit; history stays in this browser tab. Restart clears it.</p>
      </section>}
      <section className="panel conversation-panel organic-chat" aria-label="Conversation">
        <SessionPanel activeSessionId={activeSessionId} onResume={resumeSession} onNewSession={beginNewServerSession} onSessionDeleted={handleSessionDeleted} />
        <div className="chat-provenance">Meta AI · Muse Spark · Review each response and suggested theme</div>
        <div className="chat-log" aria-live="polite" aria-relevant="additions text">
        {chatTurns.length === 0 && <article className="conversation-turn turn-guide"><span>{modelLive ? "Harmonise · Meta AI" : "Harmonise · fictional assistant"}</span><p>We can take this slowly. Is this mainly about something happening with someone, or how you’ve been feeling? You can also just tell me a little more.</p></article>}
        {chatTurns.map((turn) => <article className={`conversation-turn ${turn.role === "you" ? "turn-arjun" : "turn-guide"}`} key={turn.id}><span>{turn.role === "you" ? (state.isFeaturedJourney ? `Arjun · ${arjunVisits.find((visit) => visit.id === activeVisitId)?.day ?? "Day 1"}` : "You") : turn.id.startsWith("meta-") || turn.id.startsWith("srv-") ? "Harmonise · Meta AI" : "Harmonise · fictional transcript"}</span><p>{turn.text}</p></article>)}
          <div ref={chatEndRef}/>
        </div>
        {chatPending && <div className="small-note typing-row" role="status"><span className="typing-dots" aria-hidden="true"><span /><span /><span /></span>Muse Spark is preparing a response…</div>}
        {chatError && <div className="chat-error-row"><Notice>{chatError}</Notice><SecondaryButton onClick={() => void sendChat()}>Retry</SecondaryButton></div>}
        {chatTurns.filter((turn) => turn.role === "you").length === 1 && <div className="inline-chat-choices" aria-label="Optional response"><span>Only if it helps:</span>{["Something with someone", "How I’ve felt", "Not sure"].map((choice) => <button key={choice} type="button" disabled={chatPending} onClick={() => { void sendChat(choice); }}>{choice}</button>)}</div>}
        {chatTurns.filter((turn) => turn.role === "you").length >= 1 && <section className="inline-understanding" aria-labelledby="understanding-inline-title">
          <div><span className="context-eyebrow">A THOUGHT TO CHECK · AI SUGGESTION</span><h2 id="understanding-inline-title">Have I got this right?</h2><p><strong>What you said:</strong> “{chatTurns.filter((turn) => turn.role === "you").at(-1)?.text}”</p><p><strong>Might matter:</strong> {suggestedThemes.length ? suggestedThemes.map(textForTheme).join(" · ") : "No theme suggested yet. You can keep talking or explore without a match."}</p><p><strong>What you want now:</strong> {understandingConfirmed ? `${suggestedNeed.summary || "Explore without personal context"} · confirmed by you` : "Not confirmed yet"}</p></div>
          <div className="inline-chat-choices"><button type="button" disabled={chatPending} onClick={() => setUnderstandingConfirmed(true)}>Yes, that’s closer</button><button type="button" disabled={chatPending} onClick={() => { setUnderstandingConfirmed(false); setCorrectionRequested(true); }}>Not quite</button><button type="button" disabled={chatPending} onClick={() => { setCorrectionRequested(true); setComposer("I don't want someone to tell me to stay or leave."); }}>Edit in my words</button></div>
          {correctionRequested && <p className="correction-request-status" role="status">Not quite. Tell me what I missed in your own words.</p>}
          {correctedUnderstanding && <section className="causal-understanding" aria-label="Updated editable understanding">
            <div className="causal-comparison"><div><span className="context-eyebrow">WHAT YOU SAID</span><p>{chatTurns.filter((turn) => turn.role === "you").at(-2)?.text ?? "Your first words are above."}</p></div><span className="comparison-arrow" aria-hidden="true">→</span><div><label className="context-eyebrow" htmlFor="corrected-understanding">WHAT YOU CONFIRMED · EDITABLE</label><textarea id="corrected-understanding" rows={3} value={correctedUnderstanding} onChange={(event) => setCorrectedUnderstanding(event.target.value)}/></div></div>
            <p className="preview-provenance"><strong>Muse Spark’s suggestion is editable. It affects community recommendations only after you confirm it.</strong></p>
          </section>}
          {understandingConfirmed && <>
            <section className="private-outcome-choice" aria-label="Arjun's optional private takeaway">
              <span className="context-eyebrow">A PRACTICAL NEXT STEP · HIS CHOICE</span>
              <p>“I can ask for time before deciding.”</p>
              <SecondaryButton onClick={() => { stateDispatch({ type: "SET_INSIGHT_DRAFT", value: "I can ask for time before deciding." }); stateDispatch({ type: "APPROVE_INSIGHT" }); }}>Keep this takeaway privately</SecondaryButton>
              {state.insightApproved && state.insightDraft === "I can ask for time before deciding." && <p className="private-outcome-status" role="status">Arjun chose to keep this in the browser session only. Nothing is sent.</p>}
            </section>
            <div className="inline-chat-choices"><button type="button" onClick={exploreExperiences}>Hear experiences</button><button type="button" onClick={() => setComposer("")}>Keep talking</button></div>
          </>}
        </section>}
        {understandingConfirmed && suggestedThemes.length > 0 && <CircleRecommendation themes={suggestedThemes} />}
        {recordingState === "recording" && <div className="voice-review" role="status"><strong>Recording · up to 2 minutes</strong><span>Audio stays in this browser until you choose “Transcribe with Meta”.</span><div className="inline-actions"><SecondaryButton onClick={stopRecording}>Stop and review</SecondaryButton><button className="text-button" onClick={cancelRecording}>Cancel recording</button></div></div>}
        {recordingState === "processing" && <div className="voice-review" role="status"><strong>Preparing your recording…</strong><span>Audio is being converted in this browser. It has not been sent to Meta yet.</span></div>}
        {recordingState === "review" && <div className="voice-review"><p className="sr-only" role="status">{transcribing ? "Transcribing your recording with Meta Voice." : transcriptDraft ? "Transcript ready. Review and edit it before sending." : "Recording ready for review. Nothing has been sent to Meta yet."}</p><strong>Review before sending</strong><p>When you choose “Transcribe with Meta”, this recording is sent to Meta Voice Transcribe. Review and edit the transcript, then send it as a chat message.</p><div className="inline-actions"><PrimaryButton onClick={() => { void transcribeRecording(); }} disabled={!recordingAudio || transcribing}>{transcribing ? "Transcribing…" : "Transcribe with Meta"}</PrimaryButton><SecondaryButton onClick={cancelRecording}>Cancel</SecondaryButton></div>{transcriptDraft && <><label className="field-label" htmlFor="voice-transcript">Review and edit the transcript</label><textarea ref={transcriptAreaRef} id="voice-transcript" rows={3} value={transcriptDraft} onChange={(event) => setTranscriptDraft(event.target.value)}/><p className="preview-provenance">Transcript from Meta Voice Transcribe · editable here · audio is deleted when you cancel or leave · nothing is sent to chat until you press Send.</p><div className="inline-actions"><PrimaryButton onClick={() => { setComposer(transcriptDraft); setRecordingState("idle"); setRecordingAudio(null); setTranscriptDraft(""); document.getElementById("chat-input")?.focus(); }}>Use this in my message</PrimaryButton></div></>}</div>}
        {recordingError && <Notice>{recordingError}</Notice>}
        {chatTurns.length === 0 && !composer && (
          <div className="starter-chips" role="group" aria-label="Ways to begin">
            {["Work feels overwhelming", "Family pressure", "Not sure — just listen"].map((starter) => (
              <button key={starter} type="button" className="starter-chip" disabled={chatPending} onClick={() => setComposer(starter === "Not sure — just listen" ? "I'm not sure where to start. Can you just listen for a bit?" : starter)}>
                {starter}
              </button>
            ))}
          </div>
        )}
        <form className="chat-composer" onSubmit={(event) => { event.preventDefault(); sendChat(); }}>
          <label className="sr-only" htmlFor="chat-input">Your message</label>
          <textarea id="chat-input" rows={2} value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendChat(); } }} placeholder="Write a message…" />
          <div className="composer-actions"><span>Enter to send · Shift+Enter for a new line</span><div><button type="button" className={`mic-button${recordingState === "recording" ? " mic-live" : ""}`} disabled={chatPending || transcribing || recordingState === "processing"} onClick={toggleMicRecording} aria-label={recordingState === "recording" ? `Stop recording (${Math.floor(recordingElapsed / 60)}:${String(recordingElapsed % 60).padStart(2, "0")})` : "Record a voice message"}>{recordingState === "recording" ? `${Math.floor(recordingElapsed / 60)}:${String(recordingElapsed % 60).padStart(2, "0")}` : "●"}</button><SecondaryButton onClick={startRecording} disabled={chatPending || recordingState === "recording" || recordingState === "processing"}>Use voice</SecondaryButton><PrimaryButton type="submit" disabled={!composer.trim() || chatPending}>{chatPending ? "Thinking…" : "Send"}</PrimaryButton></div></div>
        </form>
      </section>
      <div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Explore quietly</SecondaryButton><button className="text-button" onClick={() => stateDispatch({ type: "OPEN_HELP" })}>How information is used</button><button className="text-button" onClick={() => { setChatTurns([]); setTopicChats((chats) => ({ ...chats, [spaceTopic]: [] })); setComposer(""); setUnderstandingConfirmed(false); setActiveSessionId(null); setSyncSession(null); }}>Start a fresh conversation</button></div>
      {null}
    </>;
  }

  function renderUnderstanding() {
    const statements = state.turns.filter((turn) => turn.speaker === "arjun");
    const otherThemes: ThemeId[] = ["family-expectations", "relationship-uncertainty", "work-pressure", "relocation", "belonging", "personal-autonomy", "communication", "hobbies"];
    const mappedThemes = [...new Set([...state.proposedThemes, ...state.confirmedThemes, ...state.rejectedThemes])];
    return <>
      <p className="lede">I may have missed something. Keep, change or set aside each possible connection.</p>
      <div className="understanding-map" aria-label="Your words, possible meaning and chosen support">
        <section className="context-layer context-words"><span className="context-eyebrow">01 · YOUR WORDS</span><h2>What you said</h2>
          {statements.length ? <ul className="statement-list">{statements.map((turn) => <li key={turn.id}><span className="source-ref">{turn.id.toUpperCase()}</span>“{turn.text}”</li>)}</ul> : <p>You can still browse without adding personal context.</p>}
        </section>
        <div className="context-thread" aria-hidden="true"><span/></div>
        <section className="context-layer context-interpretation"><span className="context-eyebrow">02 · POSSIBLE INTERPRETATION</span><h2>What might matter</h2>
          {state.mockTextNotice && <p className="small-note">Your typed words were not interpreted. Choose only what you want to use.</p>}
          <fieldset className="context-theme-list"><legend>These are suggestions, not conclusions</legend>{mappedThemes.length ? mappedThemes.map((theme) => {
            const isConfirmed = state.confirmedThemes.includes(theme);
            const isRejected = state.rejectedThemes.includes(theme) && !isConfirmed;
            return <label className={`context-theme ${isRejected ? "theme-rejected" : isConfirmed ? "theme-confirmed" : ""}`} key={theme}><input type="checkbox" checked={isConfirmed} onChange={() => stateDispatch({ type: "TOGGLE_THEME", theme })}/><span className="context-theme-name">{textForTheme(theme)}</span><span className="theme-status">{isRejected ? "You set this aside" : isConfirmed ? "Confirmed by you" : "Possible link"}</span></label>;
          }) : <p>No themes were inferred from your new words.</p>}</fieldset>
          <details className="other-theme-details"><summary>Add a different topic</summary><div className="theme-options">{otherThemes.filter((theme) => !mappedThemes.includes(theme)).map((theme) => <label className="check-row" key={theme}><input type="checkbox" checked={state.confirmedThemes.includes(theme)} onChange={() => stateDispatch({ type: "TOGGLE_THEME", theme })}/><span>{textForTheme(theme)}</span></label>)}</div></details>
          <p className="small-note">Still unknown: the relationship outcome, and whether Arjun has a trusted confidant.</p>
        </section>
        <div className="context-thread context-thread-confirmed" aria-hidden="true"><span/></div>
        <section className="context-layer context-need"><span className="context-eyebrow">03 · YOUR CHOICE</span><h2>What you want now</h2><p className="confirmed-need">{state.confirmedNeed || "Choose what kind of support would feel useful."}</p>
          <div className="radio-options" role="group" aria-label="Choose what would help now">
            {([
              ["human-perspective", "Hear lived experiences without a verdict"],
              ["quiet-reading", "Read quietly"],
              ["shared-activity", "Find people through shared interests"],
              ["not-sure", "I'm not sure yet"],
            ] as const).map(([need, label]) => <label className="radio-row" key={need}><input type="radio" name="supportNeed" checked={state.supportNeed === need} onChange={() => stateDispatch({ type: "SET_SUPPORT_NEED", need, label })}/><span>{label}</span></label>)}
          </div>
        </section>
      </div>
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "BACK" })}>Back to conversation</SecondaryButton><PrimaryButton onClick={() => stateDispatch({ type: "CONFIRM_UNDERSTANDING" })}>Find human perspectives</PrimaryButton></div>
    </>;
  }

  function renderDiscovery() {
    const compare = state.chapter === "relationships" && state.confirmedThemes.includes("family-expectations");
    const contextualCommunity = fixtures.communities.find((item) => item.id === "community.family-expectations");
    return <>
      <p className="lede">Read a conversation, explore a story, or leave without joining.</p>
      <CircleRecommendation themes={[...new Set([...state.confirmedThemes, ...state.proposedThemes, ...suggestedThemes])]} />
      <p className="small-note">Below: sample illustrations for exploring. Live circles with real members appear above when they match.</p>
      {state.chapter === "belonging" && <section className="new-chapter-banner"><span className="context-eyebrow">A FEW WEEKS LATER · FICTIONAL STORY</span><h2>New City, Feeling Lonely After Work</h2><p>{state.opening}</p><p>{state.carryPreviousContext && state.carriedTakeaway ? `You chose to bring this note: “${state.carriedTakeaway}”` : "You chose to start this chapter separately. Nothing from the earlier relationship conversation is used to shape these results."}</p><p className="small-note">This topic is about social connection, not an assumed cause or diagnosis.</p></section>}
      {state.quietReader && <Notice tone="private">Quiet reading · no alias, question or membership is needed to continue.</Notice>}
      {state.mockTextNotice && <Notice>Your new words weren&apos;t interpreted. These suggestions use only what you selected.</Notice>}
      {state.usefulness === "not-helpful" && <Notice>Thanks for saying so. You can choose a different kind of support, read another perspective, or stop here.</Notice>}
      {compare && contextualCommunity && <section className="relevance-compare" aria-labelledby="relevance-title"><div className="relevance-heading"><span className="context-eyebrow">WHY THIS COMMUNITY</span><h2 id="relevance-title">Not just similar words. Similar situations.</h2><p>No match scores—just the reasons behind this fictional comparison.</p></div><div className="relevance-rail">{!state.rejectedBaseline && <><article className="relevance-result relevance-keyword" id="source-C0"><span className="relevance-label">C0 · Broad topic result</span><h3>{fixtures.topicOnlyBaseline.name}</h3><p>{fixtures.topicOnlyBaseline.explanation}</p><small>Source {fixtures.topicOnlyBaseline.sourceIds.map((source) => <a className="source-link" href={`#source-${source}`} key={source}>{source}</a>)}</small><button className="text-button" onClick={() => stateDispatch({ type: "REJECT_BASELINE" })}>Not for me · change these results</button></article><span className="relevance-arrow" aria-hidden="true">→</span></>}<article className="relevance-result relevance-context" id="source-C1"><span className="relevance-label">C1 · Your confirmed context</span><h3>{contextualCommunity.name}</h3><p>You said the pressure comes from family and asked for firsthand perspectives without a verdict.</p><small>Grounded in <a className="source-link" href="#source-C1">C1 · {contextualCommunity.evidenceIds.join(" · ")}</a></small></article></div>{state.rejectedBaseline && <Notice>Feedback noted. Broad legal-topic suggestions are set aside; family-pressure experiences are shown first.</Notice>}</section>}
      {state.noMatch || recommended.length === 0 ? <section className="panel no-match"><h2>There isn&apos;t a close fit in these communities.</h2><p>You can browse the available stories or return to change what matters. No people or activity will be invented.</p><div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "SET_NO_MATCH", value: false })}>Browse all communities</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "BACK" })}>Change what you selected</SecondaryButton></div></section> : <div className="community-grid">
        {recommended.map((item) => <article className="community-card" key={item.id}>
          <div className="card-kicker">COMMUNITY</div><h2>{item.name}</h2><p>{item.purpose}</p>
          <p className="fit-reason"><strong>Why it may fit:</strong> {item.topicIds.filter((topic) => state.confirmedThemes.includes(topic as ThemeId)).map((topic) => themeLabels[topic as ThemeId] ?? topic).join(", ") || "Open browsing, with no personal context applied."}</p>
          <div className="chip-list">{item.topicIds.slice(0, 3).map((topic) => <span className="chip" key={topic}>{themeLabels[topic as ThemeId] ?? topic}</span>)}</div>
          <div className="card-actions"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_COMMUNITY", communityId: item.id })}>Explore community</SecondaryButton><button className="text-button" onClick={() => { stateDispatch({ type: "OPEN_COMMUNITY", communityId: item.id }); stateDispatch({ type: "SET_COMMUNITY_TAB", tab: "experiences" }); }}>Read experiences</button></div>
        </article>)}
      </div>}
      <div className="discovery-footer-actions"><SecondaryButton onClick={() => stateDispatch({ type: "SET_NO_MATCH", value: true })}>None of these feels relevant</SecondaryButton><button className="text-button" onClick={() => stateDispatch({ type: "OPEN_UNDERSTANDING" })}>Change themes</button><Link className="text-button" href={state.confirmedThemes.length ? `/communities?themes=${state.confirmedThemes.join(",")}` : "/communities"}>Browse live communities</Link></div>
    </>;
  }

  function renderCommunity() {
    if (!community) return <section className="panel"><h2>Choose a community to explore</h2><PrimaryButton onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Back to communities</PrimaryButton></section>;
    return <>
      <div className="community-intro panel"><div><span className="tag tag-human">COMMUNITY PERSPECTIVES</span><h2>{community.name}</h2><p>{community.purpose}</p></div><div className="community-status"><span className="status-dot"/> Reading available<br/>No live activity</div><div className="inline-actions"><SecondaryButton onClick={() => setJoinedGroups((groups) => groups.includes(community.id) ? groups.filter((id) => id !== community.id) : [...groups, community.id])}>{joinedGroups.includes(community.id) ? "Leave community" : "Join community"}</SecondaryButton><button className="text-button" onClick={() => setGroupReportOpen((open) => !open)}>Report a post</button></div></div>
      {joinedGroups.includes(community.id) && <Notice tone="private">Your choice applies in this browser only. No membership is shared with a group yet.</Notice>}
      {groupReportOpen && <section className="panel report-panel"><h2>Report a post</h2><label className="field-label" htmlFor="report-reason">What would you like reviewed?</label><select id="report-reason" defaultValue=""><option value="" disabled>Choose a reason</option><option>Pressuring someone to make a relationship decision</option><option>Personal attack or harassment</option><option>Requesting private details</option></select><div className="inline-actions"><PrimaryButton onClick={() => { setGroupReportSubmitted(true); setGroupReportOpen(false); setModerationDecision(""); }}>Submit report</PrimaryButton><SecondaryButton onClick={() => setGroupReportOpen(false)}>Cancel</SecondaryButton></div>{groupReportSubmitted && <div><Notice>Report saved in this browser only. No community team was notified.</Notice><button className="text-button" onClick={() => stateDispatch({ type: "OPEN_MODERATION" })}>Open review workspace</button></div>}</section>}
      {community.id === "community.family-expectations" && <Notice tone="human"><strong>Community host note · fictional role.</strong> People can disagree. Please speak from experience and avoid telling anyone what relationship decision to make. No live moderator is connected yet.</Notice>}
      <div className="why-panel"><strong>Why this community surfaced</strong><p>{state.confirmedThemes.length ? `You confirmed ${state.confirmedThemes.map((theme) => themeLabels[theme]).join(" and ")}. Related posts are grounded in ${community.evidenceIds.join(", ") || "the selected topics"}.` : "You chose to browse without sharing a personal topic."}</p></div>
      <div className="tab-list" role="tablist" aria-label={`${community.name} sections`} onKeyDown={(event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const current = communityTabs.findIndex((tab) => tab.id === state.communityTab);
        const offset = event.key === "ArrowRight" ? 1 : -1;
        const next = communityTabs[(current + offset + communityTabs.length) % communityTabs.length];
        stateDispatch({ type: "SET_COMMUNITY_TAB", tab: next.id });
        document.getElementById(`tab-${next.id}`)?.focus();
      }}>
        {communityTabs.map((tab) => <button key={tab.id} role="tab" aria-selected={state.communityTab === tab.id} aria-controls="community-tab-panel" id={`tab-${tab.id}`} tabIndex={state.communityTab === tab.id ? 0 : -1} className={state.communityTab === tab.id ? "tab selected" : "tab"} onClick={() => stateDispatch({ type: "SET_COMMUNITY_TAB", tab: tab.id })}>{tab.label}</button>)}
      </div>
      <section className="panel tab-panel" role="tabpanel" id="community-tab-panel" aria-labelledby={`tab-${state.communityTab}`}>
        {state.communityTab === "experiences" && <>
          {discussions.length > 0 && <div className="community-posts"><div className="panel-heading"><div><span className="tag tag-human">INSIDE THE COMMUNITY</span><h2>What people are talking about</h2></div></div>{discussions.map((discussion) => <article className="community-post" key={discussion.id} id={`source-${discussion.sourceId}`}><div className="post-meta"><span>{discussion.authorAlias}</span><span>{discussion.timeLabel ?? "Earlier"}</span><span className="source-ref">{discussion.sourceId}</span></div><h3>{discussion.prompt}</h3><p>{discussion.preview}</p>{discussion.reply && <blockquote className="post-reply"><span>{discussion.replyAuthor || "Another perspective"} · fictional reply</span>{discussion.reply}</blockquote>}</article>)}</div>}
          <div className="panel-heading"><div><span className="tag tag-human">FICTIONAL CONTRIBUTOR STORIES</span><h2>Different lives, shared questions</h2></div></div>
          {shownExperiences.length ? <div className="story-list">{shownExperiences.map((record) => {
            const person = fixtures.contributors.find((contributor) => contributor.id === record.contributorId);
            const publicSummary = record.id === "experience.ravi" ? state.contributorSummary : person?.approvedSummary;
            return <article className="story-card" key={record.id}><div><span className="tag tag-person">Fictional contributor · {person?.alias ?? "Contributor"}</span><h3>{record.milestones[0]?.title}</h3><p>{publicSummary ?? record.milestones[0]?.whatHappened}</p><p className="small-note">{record.id === "experience.ravi" && state.contributorAllowsQuestions ? "Ravi has agreed to receive one question in this story." : "Read-only story · no question route."}</p></div><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_EXPERIENCE", experienceId: record.id })}>Read experience</SecondaryButton></article>;
          })}</div> : <p>No approved story is available in this community yet. You can return to the community list.</p>}
        </>}
        {state.communityTab === "discussions" && <>
          <span className="tag tag-human">COMMUNITY DISCUSSIONS</span><h2>Questions people might explore</h2>
          {community.id === "community.family-expectations" && (() => {
            const selectedDay = historicalThread.days.find((day) => day.day === historicalDay)!;
            return <section className="historical-thread" aria-labelledby="historical-thread-title">
              <span className="tag tag-private">{historicalThread.label}</span>
              <h2 id="historical-thread-title">One thread, over time</h2>
              <p className="small-note">Arjun&apos;s correction is why this family-pressure thread is relevant. These fictional discussions show different perspectives. No live activity is connected.</p>
              <div className="historical-day-tabs" role="group" aria-label="Choose a day in this story">
                {historicalThread.days.map((day) => <button type="button" key={day.day} className={historicalDay === day.day ? "historical-day selected" : "historical-day"} aria-pressed={historicalDay === day.day} onClick={() => { setHistoricalDay(day.day); setHistoricalTriageOpen(false); }}>{day.day}<span>{day.title}</span></button>)}
              </div>
              <div className="historical-posts" aria-live="polite">
                {selectedDay.posts.map((post) => <article className="historical-post" key={`${historicalDay}-${post.role}`}><strong>{post.role}</strong><p>{post.text}</p></article>)}
                {historicalDay === "Day 9" && <aside className="host-boundary"><strong>Thread host · fictional human community role</strong><p>I can listen; I can’t decide for you. Please speak from your experience and avoid choosing for Arjun.</p></aside>}
                {historicalDay === "Day 16" && <aside className="unanswered-thread"><strong>Side thread · no replies yet</strong><p>There is no response shown to Dev&apos;s question. Silence can remain unresolved.</p></aside>}
                {historicalDay === "Day 9" && <div className="triage-trigger"><button type="button" className="text-button" onClick={() => setHistoricalTriageOpen((open) => !open)}>Review a directive reply</button>{historicalTriageOpen && <aside className="prepared-triage"><strong>Fictional human review · no report was sent</strong><p>Fictional moderator holds the directive reply from view while it is reviewed. This workflow does not contact or assign a real moderator.</p></aside>}</div>}
              </div>
              <Notice tone="human">Historical thread roles: peers share experience; the host sets a boundary; a moderator reviews reports. No live people or moderation are connected.</Notice>
              {historicalDay === "Day 16" && <section className="dev-choice-panel"><span className="context-eyebrow">ARJUN&apos;S OPTIONAL NEXT STEP · FICTIONAL STORY</span><p className="arjun-takeaway">“I can ask for time before deciding.”</p><div className="inline-actions"><SecondaryButton onClick={() => { stateDispatch({ type: "SET_INSIGHT_DRAFT", value: "I can ask for time before deciding." }); stateDispatch({ type: "APPROVE_INSIGHT" }); }}>Keep this takeaway privately</SecondaryButton><SecondaryButton onClick={() => { setDevContributionChoice("offer"); setDevContributionConsent(false); setDevContributionAdded(false); setDevContributionClose(false); }}>Offer one thing that helped</SecondaryButton><button type="button" className="text-button" onClick={() => { setDevContributionChoice("later"); setDevContributionConsent(false); setDevContributionAdded(false); setDevContributionClose(false); }}>Maybe later</button></div>
                {state.insightApproved && <p className="small-note" role="status">Arjun chose this in the browser session only: “{state.insightDraft}”</p>}
                {devContributionChoice === "offer" && <p className="small-note" role="status">Selected: Offer one thing that helped. This draft stays local until consent; nothing is sent.</p>}
                {devContributionChoice === "later" && <p className="small-note">Maybe later selected. The private reflection stays private.</p>}
                {devContributionChoice === "offer" && <div className="public-preview dev-bounded-preview"><strong>A fictional draft for Dev · fictional member · Family Expectations group only</strong><p>Alias: QuietRiver</p><label className="field-label" htmlFor="dev-local-draft">Edit the one part you may offer</label><textarea id="dev-local-draft" rows={3} value={devContributionText} onChange={(event) => { setDevContributionText(event.target.value); setDevContributionConsent(false); setDevContributionAdded(false); setDevContributionClose(false); }}/><p className="small-note">Private conversation excluded. No other context is included.</p><label className="consent-row"><input type="checkbox" checked={devContributionConsent} onChange={(event) => setDevContributionConsent(event.target.checked)} /><span>I reviewed this exact text and group audience.</span></label><PrimaryButton disabled={!devContributionConsent} onClick={() => setDevContributionAdded(true)}>Add to community</PrimaryButton><p className="small-note">Fictional content · this change stays in this browser.</p><p className="small-note">Nothing is sent to a real group or person.</p>{devContributionAdded && <p className="small-note" role="status">Added to this fictional community view. Nothing was sent to any real group or person.</p>}<SecondaryButton onClick={() => setDevContributionClose(true)}>Review my choices</SecondaryButton></div>}
                {devContributionClose && devContributionChoice === "offer" && <section className="agency-close" aria-label="Arjun's final local choices"><span className="tag tag-private">FICTIONAL STORY</span><h3>Arjun keeps the next step in his hands.</h3><div className="agency-close-grid"><article><strong>Kept privately in this browser session</strong><p>{state.insightApproved ? state.insightDraft : "I can ask for time before deciding."}</p><span>For this browser session only · not shared</span></article><article><strong>{devContributionAdded ? "Added to local browser state" : "Optional group draft · unsent"}</strong><p>One helpful thing for Dev · Family Expectations group · QuietRiver</p><span>Private context excluded</span></article></div><p className="agency-close-draft">“{devContributionText}”</p><p className="agency-close-boundary">Nothing is sent to a real group or person.</p><p className="small-note">{devContributionAdded ? "Consent recorded in this browser only. No real audience received it." : "Fictional local draft · consent unchecked · nothing sent."}</p></section>}
              </section>}
            </section>;
          })()}
          {discussions.length ? discussions.map((discussion) => <article className="discussion-card" key={discussion.id}><p className="discussion-author">{discussion.authorAlias} · {discussion.timeLabel ?? "Earlier"} · {discussion.sourceId}</p><h3>{discussion.prompt}</h3><p>{discussion.preview}</p>{discussion.reply && <blockquote className="post-reply"><span>{discussion.replyAuthor || "Another perspective"} · fictional reply</span>{discussion.reply}</blockquote>}</article>) : <p>No posts are included for this community yet. You can explore a different topic.</p>}
          {community.id === "community.family-expectations" && <article className="discussion-card dev-question"><p className="discussion-author">Dev · fictional member · several weeks later</p><h3>Does anyone know how to tell your parents what you want when they see it as disrespect?</h3><p>This is a fictional historical discussion, not a live post.</p></article>}
          {groupReplies.map((reply, index) => <article className="discussion-card" key={`local-reply-${index}`}><p className="discussion-author">Your group alias · fictional participant</p><p>{reply}</p><p className="small-note">Not published or visible to other people.</p></article>)}
          {joinedGroups.includes(community.id) && community.id === "community.family-expectations" ? <section className="panel group-reply-composer"><h3>Reply to Dev</h3><label className="field-label" htmlFor="group-reply">Your words, only if you choose to share</label><textarea id="group-reply" rows={4} value={groupReplyDraft} onChange={(event) => { setGroupReplyDraft(event.target.value); setGroupReplyPreview(false); setGroupReplyConsent(false); }} placeholder="I'm still figuring this out. One thing I tried was…"/><p className="small-note">Your private conversation is not included. This group reply stays in this browser only.</p><div className="inline-actions"><SecondaryButton onClick={() => setGroupReplyPreview(true)} disabled={!groupReplyDraft.trim()}>Review audience and text</SecondaryButton><button className="text-button" onClick={() => { setGroupReplyDraft(""); setGroupReplyPreview(false); setGroupReplyConsent(false); }}>Discard draft</button></div>{groupReplyPreview && <div className="public-preview"><strong>Group: {community.name}</strong><p>Alias: QuietRiver · this group only</p><p>Only this reply will be shared:</p><blockquote>{groupReplyDraft}</blockquote><label className="consent-row"><input type="checkbox" checked={groupReplyConsent} onChange={(event) => setGroupReplyConsent(event.target.checked)}/><span>I reviewed this exact text and group audience.</span></label><PrimaryButton onClick={() => { setGroupReplies((replies) => [...replies, groupReplyDraft.trim()]); setGroupReplyDraft(""); setGroupReplyPreview(false); setGroupReplyConsent(false); }} disabled={!groupReplyConsent}>Post in this community</PrimaryButton><p className="small-note">Nothing is sent to a real group.</p></div>}</section> : !joinedGroups.includes(community.id) && <Notice>Join community to draft a reply. Quiet reading remains available without joining.</Notice>}
        </>}
        {state.communityTab === "people" && <><span className="tag tag-human">CONTRIBUTOR ROLES</span><h2>People in this community</h2><ul className="member-list"><li><strong>Dev</strong><span>member · shares questions, no professional role</span></li><li><strong>Nisha</strong><span>member · lived experience</span></li><li><strong>Ravi</strong><span>member · group replies only</span></li><li><strong>Mira</strong><span>member · lived experience</span></li><li><strong>Ananya</strong><span>host · fictional trained moderator role</span></li></ul><p className="small-note">These are fictional fictional identities. No people are shown as online or available.</p></>}
        {state.communityTab === "guidelines" && <><span className="tag tag-private">COMMUNITY GUIDELINES</span><h2>Keep participation respectful</h2><ul className="guideline-list"><li>Experiences are perspectives, not instructions for someone else&apos;s choice.</li><li>Do not request private contact details or pressure someone to disclose.</li><li>Respect different decisions and leave when you want.</li><li>Use reporting for a human review process; no moderator is notified here.</li></ul><SecondaryButton onClick={() => stateDispatch({ type: "REPORT_EXAMPLE" })}>Report this content</SecondaryButton>{state.reportShown && <Notice>Report recorded in this browser only. No moderator was notified.</Notice>}</>}
      </section>
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Back to communities</SecondaryButton><button className="text-button" onClick={() => stateDispatch({ type: "OPEN_JOURNEY" })}>Open my journey</button></div>
    </>;
  }

  function renderExperience() {
    if (!experience) return <section className="panel"><h2>This story is no longer available.</h2><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Return to communities</SecondaryButton></section>;
    const person = fixtures.contributors.find((contributor) => contributor.id === experience.contributorId);
    const isRavi = experience.id === "experience.ravi";
    const privateQuestionsAllowed = person?.scope.anonymousQuestions === true && state.contributorAllowsQuestions && state.contributorPublished;
    return <>
      <div className="story-detail-header panel"><span className="tag tag-human">{experience.attributionLabel}</span><h2>{person?.alias ?? "Contributor"}</h2><p>{isRavi ? state.contributorSummary : person?.approvedSummary}</p><p className="small-note">One person&apos;s account, not a recommendation for your decision.</p></div>
      <section className="panel timeline-panel"><h2>What {person?.alias ?? "this contributor"} reported</h2><ol className="timeline">{experience.milestones.map((milestone) => <li key={milestone.id} id={`source-${milestone.id}`}><span className="timeline-time">{milestone.relativeTime}</span><h3>{milestone.title}</h3><p><strong>What happened:</strong> {milestone.whatHappened}</p><p><strong>What they tried:</strong> {milestone.whatIActuallyTried}</p>{milestone.whatHelped && <p><strong>What they reported helped:</strong> {milestone.whatHelped}</p>}{milestone.whatDidNotHelp && <p><strong>What they reported did not help:</strong> {milestone.whatDidNotHelp}</p>}<p className="source-id">Source: {milestone.id}</p></li>)}</ol></section>
      <div className="two-columns"><section className="panel story-overlap"><span className="tag tag-suggestion">{isRavi ? "WHERE YOUR EXPERIENCES MEET" : "WHAT THIS ACCOUNT COVERS"}</span><h2>{isRavi ? "Space to think before others decide" : experience.milestones[0]?.title}</h2>{isRavi ? <><p><strong>Arjun said:</strong> “{fixtures.leadPersona.private.utterances[2].text}”</p><p><strong>Ravi wrote:</strong> “{experience.milestones[1]?.whatIActuallyTried}”</p><p className="source-id">Grounded in Arjun u3 and Ravi {experience.milestones.map((milestone) => milestone.id).join(", ")}</p></> : <><p>{experience.milestones[0]?.whatHappened}</p><p><strong>{person?.alias} tried:</strong> {experience.milestones[0]?.whatIActuallyTried}</p><p className="source-id">Source: {experience.milestones.map((milestone) => milestone.id).join(", ")}</p></>}</section><section className="panel difference-panel"><span className="tag tag-private">WHERE YOUR LIVES DIFFER</span><h2>What may not carry over</h2><ul>{experience.importantDifferencesFromArjun.map((difference) => <li key={difference}>{difference}</li>)}</ul>{experience.unknowns.map((unknown) => <p key={unknown}><strong>Still unknown:</strong> {unknown}</p>)}</section></div>
      {isRavi && !privateQuestionsAllowed && <section className="no-recipient"><h2>Ravi accepts replies in the group only</h2><p>He isn&apos;t accepting private requests here. You can share a group reply, read Nisha&apos;s story, or keep reading quietly.</p><div className="inline-actions"><SecondaryButton onClick={() => { stateDispatch({ type: "CLOSE_EXPERIENCE" }); stateDispatch({ type: "SET_COMMUNITY_TAB", tab: "discussions" }); }}>See the group conversation</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_EXPERIENCE", experienceId: "experience.nisha" })}>Read Nisha&apos;s story</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "CONTINUE_AFTER_REPLY" })}>Reflect on what you read</SecondaryButton></div></section>}
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "CLOSE_EXPERIENCE" })}>Back to community</SecondaryButton>{isRavi && state.contributorAllowsQuestions && state.contributorPublished && !state.quietReader && <PrimaryButton onClick={() => stateDispatch({ type: "OPEN_GROUP_QUESTION" })}>Ask Ravi in the group</PrimaryButton>}<button className="text-button" onClick={() => stateDispatch({ type: "EXPLORE_DIFFERENT_PERSPECTIVE" })}>Not relevant to me</button></div>
    </>;
  }

  function renderQuestion() {
    return <>
      <p className="lede">If you want to ask, review exactly what this story contains. Ravi accepts questions in the group only, not by private message. Your earlier conversation isn&apos;t included.</p>
      <div className="question-layout"><section className="panel question-form">
        <label className="field-label" htmlFor="alias">Your alias</label><input id="alias" value={state.alias} onChange={(event) => stateDispatch({ type: "SET_ALIAS", value: event.target.value })} aria-invalid={state.alias.trim().length > 0 && !aliasValid} aria-describedby="alias-help alias-error" autoComplete="off"/><p id="alias-help" className="small-note">3–24 letters, numbers or underscores. An alias does not guarantee anonymity in a real service.</p>{state.alias.trim().length > 0 && !aliasValid && <p id="alias-error" className="field-error">Use 3–24 letters, numbers or underscores.</p>}
        <label className="field-label" htmlFor="question">Your question</label><textarea id="question" rows={4} maxLength={400} value={state.questionText} onChange={(event) => stateDispatch({ type: "SET_QUESTION_TEXT", value: event.target.value })} aria-invalid={state.questionText.trim().length > 0 && !questionValid} aria-describedby="question-help question-error"/><p id="question-help" className="small-note">Keep it to what you want Ravi to see. {state.questionText.length}/400</p>{state.questionText.trim().length > 0 && !questionValid && <p id="question-error" className="field-error">Add at least 12 characters, or cancel and keep reading.</p>}
        <label className="consent-row"><input type="checkbox" checked={state.questionConsent} onChange={(event) => stateDispatch({ type: "SET_QUESTION_CONSENT", value: event.target.checked })}/><span>I reviewed this exact alias, audience and question. Nothing is sent from this browser yet.</span></label>
      </section><aside className="panel recipient-preview" aria-live="polite"><span className="tag tag-private">EXACT SHARING DETAILS</span><h2>What would be shared</h2><dl><dt>Audience</dt><dd>Family Expectations group · Ravi may reply in group</dd><dt>Alias</dt><dd>{state.alias.trim() || "Not entered"}</dd><dt>Question</dt><dd>{state.questionText.trim() || "No question entered"}</dd></dl><p className="small-note">Your private conversation and journey are not included. No direct message is sent.</p><p className="small-note">Change the question on the left; only this exact wording changes.</p></aside></div>
      {state.error && <p className="error-message" role="alert">{state.error}</p>}
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "BACK" })}>Cancel · keep my draft</SecondaryButton><PrimaryButton onClick={() => stateDispatch({ type: "SEND_QUESTION" })} disabled={!aliasValid || !questionValid || !state.questionConsent}>View fictional response</PrimaryButton></div><p className="small-note">This fictional response is not live or generated by AI. It does not send a message or contact Ravi.</p>
    </>;
  }

  function renderReply() {
    return <>
      <Notice tone="human">Fictional group reply · Ravi is a fictional participant.</Notice>
      <section className="prepared-reply"><span className="context-eyebrow">FAMILY EXPECTATIONS GROUP · FICTIONAL STORY</span><blockquote>{fixtures.peerQuestionDraft.response.text}</blockquote><p>This original fictional response was not generated by Meta AI or sent by a person.</p></section>
      <section className="arjun-reaction"><span className="context-eyebrow">WHAT ARJUN NOTICED</span><p>“{fixtures.leadPersona.private.reaction}”</p></section>
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "BACK" })}>Back to question</SecondaryButton><PrimaryButton onClick={() => stateDispatch({ type: "CONTINUE_AFTER_REPLY" })}>Continue to reflection</PrimaryButton></div>
    </>;
  }

  function renderReflection() {
    const feedbackOptions = [
      ["perspective", "A new perspective"], ["understood", "Feeling understood"], ["action", "Something I'd like to try"], ["not-helpful", "Not helpful"], ["skip", "I'd rather skip"],
    ] as const;
    return <>
      <p className="lede">You don&apos;t need to solve the bigger question today. Keep only what feels useful to you.</p>
      <section className="takeaway-panel"><span className="context-eyebrow">YOUR TAKEAWAY</span><h2>Is there something you&apos;d like to carry forward?</h2><p>Arjun&apos;s relationship is still unresolved. He can name the support he wants without choosing an outcome.</p><label className="field-label" htmlFor="insight">Edit this, write your own, or leave it blank</label><textarea id="insight" rows={3} value={state.insightDraft} onChange={(event) => stateDispatch({ type: "SET_INSIGHT_DRAFT", value: event.target.value })}/><div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "APPROVE_INSIGHT" })} disabled={!state.insightDraft.trim()}>Keep privately</SecondaryButton><button className="text-button" onClick={() => stateDispatch({ type: "SET_INSIGHT_DRAFT", value: "" })}>Don&apos;t keep a note</button>{state.insightApproved && <span className="confirmation-text">Kept in this session only.</span>}</div></section>
      <section className="panel reflection-panel"><h2>Was any part of this useful?</h2><div className="feedback-options" role="group" aria-label="Was any part of this useful?">{feedbackOptions.map(([value, label]) => <button key={value} className={state.usefulness === value ? "feedback-option selected" : "feedback-option"} aria-pressed={state.usefulness === value} onClick={() => stateDispatch({ type: "SET_USEFULNESS", value })}>{label}</button>)}</div>
        {state.usefulness === "not-helpful" && <div className="alternative-support"><Notice>Thanks for saying so. What would feel better now?</Notice><div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "EXPLORE_DIFFERENT_PERSPECTIVE" })}>Read another perspective</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "RESTART" })}>Take a break</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_HELP" })}>Explore qualified support</SecondaryButton></div><p className="small-note">No listener or professional is contacted or booked from here.</p></div>}
        <label className="field-label" htmlFor="next-step">Choose an optional next step</label><select id="next-step" value={state.nextStep} onChange={(event) => stateDispatch({ type: "SET_NEXT_STEP", value: event.target.value })}><option value="">No step right now</option><option>Write down what I want from a conversation</option><option>Explore another perspective</option><option>Talk with someone I trust</option><option>Explore qualified support</option></select>
      </section>
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "BACK" })}>Back</SecondaryButton><PrimaryButton onClick={() => stateDispatch({ type: "OPEN_JOURNEY" })}>View my journey</PrimaryButton><button className="text-button" onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Keep exploring</button></div>
    </>;
  }

  function renderJourney() {
    const prior = state.priorChapter;
    const chapterOne = prior ?? {
      opening: state.opening || fixtures.leadPersona.private.opening,
      confirmedNeed: state.confirmedNeed,
      confirmedThemes: state.confirmedThemes,
      rejectedThemes: state.rejectedThemes,
      openedExperienceIds: state.openedExperienceIds,
      questionPayload: state.questionPayload,
      usefulness: state.usefulness,
      nextStep: state.nextStep,
      insightDraft: state.insightDraft,
      insightApproved: state.insightApproved,
    };
    const laterChapterActive = state.chapter === "belonging" && prior !== null;
    return <>
      <SavedChatsInJourney onResume={(payload) => { resumeSession(payload); stateDispatch({ type: "OPEN_CONVERSATION" }); }} />
      <p className="lede">Takeaways and choices from this browser session stay here. Saved chats are private to your account and can be resumed.</p>
      <section className="panel goal-panel"><span className="tag tag-private">YOUR CHOICE · RELATIONSHIPS</span><h2>Try opening a conversation with Dad</h2><p>A small possible action, not a measure of how well the conversation goes.</p><div className="feedback-options" role="group" aria-label="Update the action you chose">{goalStates.map(([value, label]) => <button key={value} className={goalStatus === value ? "feedback-option selected" : "feedback-option"} aria-pressed={goalStatus === value} onClick={() => setGoalStatus(value)}>{label}</button>)}</div><p className="small-note">Status stays in this browser session. It does not mean your life is improving or that a goal is complete.</p><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_CONTRIBUTE" })}>Review contribution choices</SecondaryButton></section>
      <section className="panel"><h2>Other parts of life</h2><div className="topic-cards"><button className="topic-card" onClick={() => { startSeparateTopic("work", ""); stateDispatch({ type: "OPEN_CONVERSATION" }); }}><strong>Work decisions</strong><span>{topicChats.work?.length ? "Resume this separate conversation" : "Start a separate topic"}</span></button><button className="topic-card" onClick={() => { startSeparateTopic("rent", ""); stateDispatch({ type: "OPEN_CONVERSATION" }); }}><strong>Rent and housing</strong><span>{topicChats.rent?.length ? "Resume this separate conversation" : "Start a separate topic"}</span></button><button className="topic-card" onClick={() => { startSeparateTopic("family", ""); stateDispatch({ type: "OPEN_CONVERSATION" }); }}><strong>Family and choices</strong><span>{topicChats.family?.length ? "Resume this separate conversation" : "Start a separate topic"}</span></button></div><p className="small-note">Each topic has a separate in-memory transcript for this session. Nothing is carried into another topic unless you choose to restate it.</p></section>
      <div className="journey-grid">
        <section className="panel"><span className="tag tag-private">CHAPTER 1 · RELATIONSHIPS</span><h2>Relationships and family expectations</h2><h3>What you first said</h3><p>“{chapterOne.opening}”</p><h3>What you confirmed</h3><p>{chapterOne.confirmedNeed || "No support need confirmed yet."}</p>{chapterOne.confirmedThemes.length > 0 && <p><strong>Confirmed themes:</strong> {chapterOne.confirmedThemes.map(textForTheme).join(" · ")}</p>}{chapterOne.rejectedThemes.length > 0 && <p><strong>Set aside:</strong> {chapterOne.rejectedThemes.map(textForTheme).join(" · ")}</p>}<h3>Perspectives you explored</h3>{chapterOne.openedExperienceIds.length ? <ul>{chapterOne.openedExperienceIds.map((id) => <li key={id}>{fixtures.experiences.find((item) => item.id === id)?.attributionLabel ?? "Fictional experience"}</li>)}</ul> : <p>No story opened in this session.</p>}{chapterOne.questionPayload && <p>You reviewed a fictional response after choosing the exact alias and question.</p>}{chapterOne.insightApproved && <div className="approved-note"><strong>Your private takeaway</strong><p>{chapterOne.insightDraft}</p></div>}{chapterOne.nextStep && <p><strong>Next step you chose:</strong> {chapterOne.nextStep}</p>}{chapterOne.usefulness && <p><strong>Your reflection:</strong> {feedbackLabel(chapterOne.usefulness)}</p>}</section>
        {laterChapterActive ? <section className="panel return-panel"><span className="tag tag-private">CHAPTER 2 · NEW CITY</span><h2>New City, Feeling Lonely After Work</h2><h3>What you shared</h3><p>“{state.opening}”</p><h3>What you want now</h3><p>{state.confirmedNeed}</p><p><strong>Topics you chose:</strong> {state.confirmedThemes.map(textForTheme).join(" · ")}</p>{state.carryPreviousContext && state.carriedTakeaway ? <div className="approved-note"><strong>You chose to carry this note forward</strong><p>{state.carriedTakeaway}</p></div> : <p>You started this chapter separately. The relationship conversation did not shape these topics.</p>}<SecondaryButton onClick={() => stateDispatch({ type: "OPEN_COMMUNITY", communityId: "community.moving-friends" })}>Explore New City, New Connections</SecondaryButton></section> : <section className="panel return-panel"><span className="context-eyebrow">A FEW WEEKS LATER · FICTIONAL STORY</span><h2>A different chapter begins</h2><p>“{fixtures.chapters.find((chapter) => chapter.id === "chapter.arjun-belonging")?.futureNote}”</p><p>Do you want to start separately, or bring a note you chose to keep?</p><div className="chapter-choice-actions"><PrimaryButton onClick={() => stateDispatch({ type: "START_FUTURE_CHAPTER", carryContext: false })}>Start separately</PrimaryButton><SecondaryButton onClick={() => stateDispatch({ type: "START_FUTURE_CHAPTER", carryContext: true })} disabled={!chapterOne.insightApproved}>Bring my selected takeaway</SecondaryButton></div>{!chapterOne.insightApproved && <p className="small-note">To bring context, first choose to keep a takeaway privately.</p>}</section>}
      </div>
      {!laterChapterActive && <section className="panel chapter-summary"><h2>Your selected next step</h2><p>{chapterOne.nextStep || "No next step selected."}</p>{chapterOne.usefulness && <p>Usefulness: {chapterOne.usefulness === "not-helpful" ? "Not helpful" : chapterOne.usefulness === "skip" ? "Skipped" : feedbackLabel(chapterOne.usefulness)}</p>}</section>}
      {laterChapterActive && <section className="panel chapter-summary"><h2>Chapter 2 next step</h2><p>{state.nextStep || "No next step selected in this chapter yet."}</p></section>}
      <section className="journey-close"><span className="tag tag-human">HARMONISE</span><h2>Find understanding. Find each other.</h2><p>Muse Spark can help reflect private words and suggest themes. People review those suggestions and choose what to share.</p><p className="small-note">Community members and stories remain fictional in this build. Private chat uses Meta only when you send a message; no live community or human support is connected.</p></section>
    </>;
  }

  function renderContributor() {
    return <>
      <p className="lede">See how a contributor chooses what to share and what to keep private.</p>
      <Notice tone="human">This fictional story does not publish or send anything.</Notice>
      <div className="two-columns"><section className="panel"><span className="tag tag-private">PRIVATE NOTES</span><h2>Ravi&apos;s writing</h2><label className="field-label" htmlFor="contributor-draft">What Ravi chose to write</label><textarea id="contributor-draft" rows={5} value={state.contributorDraft} onChange={(event) => stateDispatch({ type: "SET_CONTRIBUTOR_DRAFT", value: event.target.value })}/><p className="small-note">These notes stay in this browser and are not sent to AI.</p><h3>Possible story sections</h3><ul><li>What happened</li><li>What I tried</li><li>What I found helpful or unhelpful</li><li>What remains unknown</li></ul></section>
        <section className="panel"><span className="tag tag-person">YOUR SHARING CHOICES</span><h2>Summary others could see</h2><label className="field-label" htmlFor="contributor-summary">Edit the shareable version</label><textarea id="contributor-summary" rows={5} value={state.contributorSummary} onChange={(event) => stateDispatch({ type: "SET_CONTRIBUTOR_SUMMARY", value: event.target.value })}/><label className="check-row"><input type="checkbox" checked={state.contributorDiscoverable} onChange={(event) => stateDispatch({ type: "SET_CONTRIBUTOR_SCOPE", discoverable: event.target.checked, questions: event.target.checked && state.contributorAllowsQuestions })}/><span>Include this story in community discovery</span></label><label className="check-row"><input type="checkbox" checked={state.contributorAllowsQuestions} disabled={!state.contributorDiscoverable} onChange={(event) => stateDispatch({ type: "SET_CONTRIBUTOR_SCOPE", discoverable: state.contributorDiscoverable, questions: event.target.checked })}/><span>Allow one question in this fictional story</span></label><p className="small-note">Never included: real name, location, contact details or private notes.</p><div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_CONTRIBUTOR_PREVIEW" })}>Review what could be shared</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "APPROVE_CONTRIBUTOR" })}>Approve this summary</SecondaryButton></div>{state.contributorApproved && <Notice>Choice recorded for this session. You still control whether it appears in discovery.</Notice>}
        {state.contributorPreviewOpen && <div className="public-preview"><strong>What others would see · fictional</strong><p>{state.contributorSummary}</p><p>Allowed scope: story discovery{state.contributorAllowsQuestions ? " and anonymous questions" : " only"}.</p><p>Excluded: private draft, raw notes, contact and location details.</p></div>}
        {state.error && <p className="error-message" role="alert">{state.error}</p>}
        <div className="inline-actions"><PrimaryButton onClick={() => stateDispatch({ type: "PUBLISH_CONTRIBUTOR" })} disabled={!state.contributorApproved}>Apply choices to this scenario</PrimaryButton><SecondaryButton onClick={() => stateDispatch({ type: "REVOKE_CONTRIBUTOR" })}>Remove from discovery</SecondaryButton></div>{!state.contributorPublished && <Notice tone="private">Ravi&apos;s story and question option are removed from this scenario&apos;s discovery.</Notice>}{state.contributorPublished && <p className="confirmation-text">The approved story is available in this scenario.</p>}</section></div>
    </>;
  }

  function renderConnections() {
    const statusText = {
      none: "No requests are open.",
      pending: "Pending in this browser only; no person has been contacted.",
      accepted: "Marked accepted in this browser only; no real connection was made.",
      declined: "Marked declined in this browser only; no real request was sent.",
      blocked: "Blocked in this browser. This state prevents reopening the fictional request.",
    }[connectionStatus];
    return <>
      <p className="lede">Connections are optional and mutual. A group-only preference cannot be bypassed with a private message.</p>
      <Notice tone="private">These fictional states stay in this browser session. They do not contact fictional contributors or real people.</Notice>
      <section className="panel"><span className="tag tag-human">GROUP-ONLY BY CHOICE</span><h2>Ravi accepts replies in the group</h2><p>Ravi&apos;s fictional preference does not allow private messages. You can read his story or reply in the group, if you join. No private request button is available.</p><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_DISCOVERY" })}>Browse communities</SecondaryButton></section>
      <section className="panel"><span className="tag tag-private">CONNECTION STATUS</span><h2>What mutual consent could look like</h2><p>{statusText}</p>{connectionStatus === "none" && <SecondaryButton onClick={() => setConnectionStatus("pending")}>View a fictional incoming request</SecondaryButton>}{connectionStatus === "pending" && <div className="connection-request"><p><strong>Dev · fictional member · Family Expectations group only</strong></p><p>“Would you like to continue this conversation in the group?”</p><p>Audience: group discussion only. This is not a private-message request.</p><div className="inline-actions"><PrimaryButton onClick={() => setConnectionStatus("accepted")}>Accept group conversation</PrimaryButton><SecondaryButton onClick={() => setConnectionStatus("declined")}>Decline</SecondaryButton><button className="text-button" onClick={() => setConnectionStatus("blocked")}>Block this fictional member</button></div></div>}{connectionStatus === "accepted" && <div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_COMMUNITY", communityId: "community.family-expectations" })}>Continue in the group</SecondaryButton><button className="text-button" onClick={() => setConnectionStatus("blocked")}>Block this fictional member</button></div>}{connectionStatus === "declined" && <button className="text-button" onClick={() => setConnectionStatus("none")}>Clear this browser state</button>}{connectionStatus === "blocked" && <Notice>Blocked. This request cannot be opened again unless you reset the scenario.</Notice>}</section>
    </>;
  }

  function renderProfessional() {
    return <>
      <p className="lede">Some situations deserve specialized support. You can explore options without sharing this conversation.</p>
      <Notice tone="private">No provider directory or credential checks are connected. No appointment can be requested here.</Notice>
      <section className="panel"><span className="tag tag-suggestion">PROVIDER AVAILABILITY</span><h2>We don&apos;t have a verified provider for these preferences yet.</h2><p>We cannot verify clinicians, coaches or service availability in this current build. Do not treat fictional titles or qualifications as verified.</p><a className="text-button-link" href="https://112.gov.in/" target="_blank" rel="noreferrer">India emergency resource · verify current availability for your location</a></section>
      <section className="panel"><h2>Professional applications</h2><p>In a real service, credentials and scope would be reviewed before someone appears as a verified provider.</p><details><summary>Application status · fictional</summary><p>Status: pending review · fictional only. No identity or qualifications were submitted.</p></details></section>
      <section className="panel support-return"><h2>No verified provider here</h2><p>You can return to the fictional peer perspectives without sending this conversation anywhere.</p><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_COMMUNITY", communityId: "community.family-expectations" })}>Return to peer perspectives</SecondaryButton></section>
      <div className="action-row"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_HELP" })}>Back to Find Support</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_MODERATION" })}>Open fictional moderator workspace</SecondaryButton></div>
    </>;
  }

  function renderModeration() {
    async function triageReportedPost() {
      if (triageLoading) return;
      setTriageLoading(true);
      setTriageResult(null);
      try {
        const response = await fetch("/api/moderation/triage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: fixtures.reportingWorkflow.flaggedText }),
        });
        const result: unknown = await response.json().catch(() => null);
        if (!response.ok || !result || typeof result !== "object" || typeof (result as Record<string, unknown>).severity !== "string") {
          setTriageResult({ concern: "unavailable", severity: "unavailable", rationale: "AI triage could not run. A moderator should assess the report directly.", recommendedAction: "human-review" });
          return;
        }
        setTriageResult(result as { concern: string; severity: string; rationale: string; recommendedAction: string });
      } catch {
        setTriageResult({ concern: "unavailable", severity: "unavailable", rationale: "AI triage could not run. A moderator should assess the report directly.", recommendedAction: "human-review" });
      } finally {
        setTriageLoading(false);
      }
    }

    return <>
      <p className="lede">A report can be reviewed by an authorized person. A host message alone does not mean moderation happened.</p>
      <Notice tone="private">This demo sends the reported post text to Meta for triage when you choose to run it. AI only prioritizes review; it cannot hide a post or make a moderation decision.</Notice>
      <section className="panel moderation-case"><span className="tag tag-suggestion">FICTIONAL REPORTED POST</span><h2>Potentially directive advice</h2><blockquote>“{fixtures.reportingWorkflow.flaggedText}”</blockquote><p><strong>Report reason:</strong> {fixtures.reportingWorkflow.possibleConcern}</p><p><strong>AI triage:</strong> Use the result as a review aid. A person must decide what happens.</p>{triageResult ? <div className="moderation-audit" role="status"><strong>{triageResult.severity === "urgent" ? "Urgent review" : triageResult.severity === "review" ? "Human review suggested" : triageResult.severity === "low" ? "No clear concern found" : "Triage unavailable"}</strong><p>Concern: {triageResult.concern}</p><p>{triageResult.rationale}</p><p>Suggested next step: {triageResult.recommendedAction}. This is not an enforcement action.</p></div> : <div className="inline-actions"><PrimaryButton onClick={() => { void triageReportedPost(); }} disabled={triageLoading}>{triageLoading ? "Reviewing…" : "Run Meta AI triage"}</PrimaryButton></div>}{!moderationDecision ? <div className="inline-actions"><PrimaryButton onClick={() => setModerationDecision("Revision requested by the fictional reviewer")}>Request revision</PrimaryButton><SecondaryButton onClick={() => setModerationDecision("Post hidden in this browser session")}>Remove this fictional post</SecondaryButton><button className="text-button" onClick={() => setModerationDecision("No action in this browser session")}>No action</button></div> : <div className="moderation-audit"><strong>Human review choice recorded</strong><p>{moderationDecision}</p><p>Audit scope: this browser session only. No post or account changed.</p><button className="text-button" onClick={() => setModerationDecision("")}>Reset this review</button></div>}</section>
    </>;
  }

  function renderHelp() {
    return <>
      <p className="lede">Different kinds of support have different roles. Harmonise does not provide or verify any of them.</p>
      <div className="role-grid help-grid"><article className="panel"><span className="tag tag-human">PEER CONTRIBUTOR</span><h2>Lived experience</h2><p>A person sharing what they experienced. Their story is not professional advice.</p></article><article className="panel"><span className="tag tag-person">TRAINED LISTENER</span><h2>Listening support</h2><p>A separate role with training that would need verification in a real service. No listener is available here.</p></article><article className="panel"><span className="tag tag-suggestion">MODERATOR</span><h2>Community review</h2><p>A human role for community reports. No moderator is connected to receive reports yet.</p></article><article className="panel"><span className="tag tag-private">QUALIFIED PROFESSIONAL</span><h2>Qualified support</h2><p>A separate path for people who want qualified help. No provider is verified or bookable here.</p></article></div>
      <div className="inline-actions"><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_PROFESSIONAL" })}>Explore professional support</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_MODERATION" })}>Review a reported post</SecondaryButton><SecondaryButton onClick={() => stateDispatch({ type: "OPEN_CONNECTIONS" })}>Connection choices</SecondaryButton></div>
      <section className="panel urgent-panel"><h2>If you may be in immediate danger</h2><p>Contact local emergency services or someone you trust. In India, emergency number 112 is listed in the supplied project guidance; confirm local availability before relying on any service information.</p><p>No messages are monitored and safety is not assessed here.</p></section>
      <p className="small-note">Leaving the page is a navigation convenience. It does not erase browser history or activity on a shared device.</p>
      <section className="panel" aria-label="How Harmonise works"><h2>How Harmonise works</h2><p>Harmonise is a private-first peer reflection space: talk things through privately, review a tentative understanding, then decide for yourself whether to explore communities.</p><h3>What is sent to Meta, and when</h3><ul><li>Chat messages — only when you press Send, for a Muse Spark response.</li><li>Voice recordings — only when you choose Transcribe with Meta; the transcript stays editable before sending.</li><li>Adviser messages — only when you send them from the adviser screen.</li><li>Reported-post text — only when a review flow runs AI triage.</li></ul><p>Copies already sent to Meta cannot be erased by Harmonise.</p><h3>Limitations</h3><ul><li>Messages here are never monitored, and safety is never assessed in this demo space.</li><li>AI suggestions are tentative: they never decide, diagnose, or take action.</li><li>Community content in this demo story is fictional unless you are browsing live communities.</li></ul><h3>Alternatives</h3><p>If you want something else: a trusted person, local support services, a qualified professional, or a verified helpline such as <a href="https://findahelpline.com/" target="_blank" rel="noreferrer">findahelpline.com</a>.</p><p><Link href="/communities">Browse live communities</Link> · <Link href="/moderation">Moderation review (reviewers only)</Link></p></section>
    </>;
  }

  function renderCurrentScreen() {
    switch (state.screen) {
      case "entry": return <div className="entry-first-use"><div className="entry-first-layout"><div className="entry-copy"><span className="tag tag-private">Start with a private thought</span><p className="small-note">Arjun&apos;s fictional story · Meta AI chat when configured</p><p className="entry-audience-note">For adults facing family pressure.</p><p className="entry-audience-promise">Think it through privately, review a tentative reflection, then choose whether to share.</p><div className="entry-first-actions"><PrimaryButton onClick={() => stateDispatch({ type: "START_PATH", path: "talk" })}>Start privately</PrimaryButton><SecondaryButton onClick={() => stateDispatch({ type: "START_PATH", path: "quiet" })}>Explore lived experiences</SecondaryButton></div><p className="small-note">Your chat is sent to Meta only when you send a message. Nothing is posted to a community automatically.</p></div><HumanConnectionIllustration/></div></div>;
      case "conversation": return renderConversation();
      case "understanding": return renderUnderstanding();
      case "discovery": return renderDiscovery();
      case "community": return renderCommunity();
      case "experience": return renderExperience();
      case "question": return renderQuestion();
      case "reply": return renderReply();
      case "reflection": return renderReflection();
      case "journey": return renderJourney();
      case "contribute": return renderContributor();
      case "help": return renderHelp();
      case "connections": return renderConnections();
      case "professional": return renderProfessional();
      case "moderation": return renderModeration();
    }
  }

  return <main className="harmonise-app">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="app-header"><div className="header-inner"><Brand/><div className="header-status">Sample community · {modelLive ? "Live Meta AI chat" : "Meta AI chat when configured"}</div><div className="header-actions"><button className="text-button" onClick={restartJourney}>Restart</button><Link className="leave-link" href="/">Home</Link></div></div></header>
    {state.screen !== "entry" && <nav className="primary-nav" aria-label="Main navigation">{navItems.map((item) => <button key={item.screen} className={state.screen === item.screen || (item.screen === "discovery" && ["community", "experience", "question", "reply", "reflection"].includes(state.screen)) || (item.screen === "help" && ["professional", "moderation"].includes(state.screen)) ? "nav-item active" : "nav-item"} aria-current={state.screen === item.screen ? "page" : undefined} onClick={() => navigate(item.screen)}>{item.label}</button>)}</nav>}
    <section id="main-content" className="app-main" aria-labelledby="page-title">
      <div className={`page-topline ${state.screen === "entry" ? "entry-topline" : ""}`}><div><span className="page-kicker">{state.screen === "entry" ? "ARJUN · A FICTIONAL STORY" : "HARMONISE"}</span><h1 id="page-title" className={state.screen === "entry" ? "entry-headline" : undefined} ref={headingRef} tabIndex={-1}>{appHeading(state)}</h1></div>{state.screen !== "entry" && state.screen !== "conversation" && <button className="text-button back-action" onClick={() => stateDispatch({ type: "BACK" })}>← Back</button>}</div>
      <div key={state.screen} className="screen-content">{renderCurrentScreen()}</div>
      {state.error && state.screen !== "question" && state.screen !== "contribute" && <p className="error-message" role="alert">{state.error}</p>}
    </section>
    <footer className="app-footer"><span>Harmonise</span><span>Fictional community · Meta AI chat · no live peer messaging or human support</span><button className="footer-link" onClick={() => stateDispatch({ type: "OPEN_HELP" })}>Help &amp; safety</button></footer>
  </main>;
}

function feedbackLabel(value: Exclude<HarmoniseState["usefulness"], null>) {
  const labels = { perspective: "A new perspective", understood: "Feeling understood", action: "Something I'd like to try", "not-helpful": "Not helpful", skip: "Skipped" };
  return labels[value];
}
