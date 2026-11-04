"use client";

import { useState, type FormEvent } from "react";
import { detectCrisis } from "@/lib/connect/catalog";
import { MAX_MESSAGE_LENGTH, type AdviceResult, type HistoryTurn } from "@/lib/connect/advice";
import { useSession } from "@/lib/connect/session";
import { CommunityCard, type RealCommunity } from "@/components/connect/community-cards";

const AI_DISCLAIMER = "AI can be wrong. Use your judgment and consult a qualified professional for legal, medical, or financial decisions.";

type Exchange = {
  id: number;
  userText: string;
  status: "thinking" | "advice" | "error" | "crisis";
  advice: AdviceResult | null;
  matching: boolean;
  revealed: boolean;
};

let nextId = 1;

function isAdvicePayload(value: unknown): value is AdviceResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.reflection === "string" &&
    typeof record.perspective === "string" &&
    Array.isArray(record.steps) &&
    Array.isArray(record.matches)
  );
}

function modelLabel(model?: string): string {
  if (!model) return "Meta AI";
  if (model.startsWith("muse-wonder")) return "Meta Muse Wonder";
  if (model.startsWith("muse-spark")) return "Meta Muse Spark";
  return `Meta ${model}`;
}

export default function Adviser() {
  const { dispatch } = useSession();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [liveCommunities, setLiveCommunities] = useState<RealCommunity[] | null>(null);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [communityError, setCommunityError] = useState(false);

  function updateExchange(id: number, patch: Partial<Exchange>) {
    setExchanges((current) => current.map((exchange) => (exchange.id === id ? { ...exchange, ...patch } : exchange)));
  }

  async function requestAdvice(id: number, message: string, history: HistoryTurn[]) {
    try {
      const response = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (payload && typeof payload === "object" && (payload as Record<string, unknown>).crisis === true) {
        updateExchange(id, { status: "crisis" });
        dispatch({ type: "urgent", open: true });
        return;
      }
      if (!response.ok || !isAdvicePayload(payload)) {
        updateExchange(id, { status: "error" });
        return;
      }
      updateExchange(id, { status: "advice", advice: payload });
    } catch {
      updateExchange(id, { status: "error" });
    }
  }

  function historyFor(excludeId: number): HistoryTurn[] {
    const turns: HistoryTurn[] = [];
    for (const exchange of exchanges) {
      if (exchange.id === excludeId || turns.length >= 4) continue;
      turns.push({ role: "user", text: exchange.userText.slice(0, 800) });
      if (exchange.advice) {
        turns.push({
          role: "adviser",
          text: `${exchange.advice.reflection} ${exchange.advice.steps.join(" ")}`.slice(0, 800),
        });
      }
    }
    return turns.slice(-4);
  }

  function send(event: FormEvent) {
    event.preventDefault();
    const message = draft.trim();
    if (message.length === 0 || sending) return;
    setDraft("");
    setSending(true);
    if (detectCrisis(message)) {
      const id = nextId++;
      setExchanges((current) => [...current, { id, userText: message, status: "crisis", advice: null, matching: false, revealed: false }]);
      dispatch({ type: "urgent", open: true });
      setSending(false);
      return;
    }
    const id = nextId++;
    setExchanges((current) => [...current, { id, userText: message, status: "thinking", advice: null, matching: false, revealed: false }]);
    const history = historyFor(id);
    void requestAdvice(id, message, history).finally(() => setSending(false));
  }

  function retry(exchange: Exchange) {
    updateExchange(exchange.id, { status: "thinking" });
    setSending(true);
    void requestAdvice(exchange.id, exchange.userText, historyFor(exchange.id)).finally(() => setSending(false));
  }

  async function loadLiveCommunities() {
    try {
      const response = await fetch("/api/communities", { credentials: "include" });
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok && payload && typeof payload === "object" && Array.isArray((payload as { communities?: unknown }).communities)) {
        const communities = (payload as { communities: RealCommunity[] }).communities;
        setLiveCommunities(communities);
        return true;
      }
      setCommunityError(true);
      return false;
    } catch {
      setCommunityError(true);
      return false;
    }
  }

  async function joinLiveCommunity(id: string, alias: string): Promise<boolean> {
    if (alias.length < 2) return false;
    try {
      const response = await fetch(`/api/communities/${id}/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== "object" || !("membership" in payload)) return false;
      setJoinedIds((current) => (current.includes(id) ? current : [...current, id]));
      setLiveCommunities((current) =>
        current ? current.map((community) => (community.id === id ? { ...community, joined: true } : community)) : current,
      );
      return true;
    } catch {
      return false;
    }
  }

  async function reveal(exchange: Exchange) {
    updateExchange(exchange.id, { matching: true });
    setCommunityError(false);
    await loadLiveCommunities();
    updateExchange(exchange.id, { matching: false, revealed: true });
  }

  return (
    <section className="cx-adviser cx-card-white" aria-label="harmonize adviser">
      <div className="cx-adviser-head">
        <h2>harmonize adviser</h2>
        <p>Listens · reasons · offers a way forward</p>
      </div>
      <div className="cx-chat" aria-live="polite">
        {exchanges.length === 0 ? (
          <div className="cx-empty">
            <span className="cx-orb" aria-hidden="true" />
            <p>
              I&rsquo;m listening. Share what is happening in your own words. I&rsquo;ll reflect what I heard and
              offer practical next steps first. Communities only appear after you choose to see them.
            </p>
          </div>
        ) : null}
        {exchanges.map((exchange) => (
          <div key={exchange.id} style={{ display: "contents" }}>
            <p className="cx-msg-user">{exchange.userText}</p>
            {exchange.status === "thinking" ? (
              <div className="cx-thinking" role="status" aria-label="Adviser is thinking">
                <span className="cx-dots" aria-hidden="true"><i /><i /><i /></span>
                <div>
                  <strong>Preparing a useful next step</strong>
                  <span>Understanding context before offering solutions…</span>
                </div>
              </div>
            ) : null}
            {exchange.status === "advice" && exchange.advice ? (
              <div className="cx-msg-adviser">
                <p className="cx-ai-note">Generated by {modelLabel(exchange.advice.model)}</p>
                <p className="cx-reflection">{exchange.advice.reflection}</p>
                <ol className="cx-steps">
                  {exchange.advice.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
                <p className="cx-perspective">{exchange.advice.perspective}</p>
                <p className="cx-ai-note">{AI_DISCLAIMER}</p>
                {exchange.advice.matches.length > 0 && !exchange.revealed && !exchange.matching ? (
                  <div className="cx-consent">
                    <h3>Solutions first.</h3>
                    <p>Take a moment with the guidance. Your matches stay hidden until you ask.</p>
                    <button type="button" className="cx-btn cx-btn-primary" onClick={() => void reveal(exchange)}>
                      I&rsquo;ve read this — show relevant communities
                    </button>
                  </div>
                ) : null}
                {exchange.matching ? (
                  <div className="cx-matching" role="status" aria-label="Finding communities that may understand">
                    <p>Finding voices that may understand…</p>
                    <div className="cx-match-bar" aria-hidden="true" />
                  </div>
                ) : null}
                {exchange.revealed && liveCommunities === null && !communityError ? (
                  <p className="cx-note" role="status">Loading live communities…</p>
                ) : exchange.revealed ? (
                  <div>
                    <h3 className="cx-reveal-head">Communities that may understand</h3>
                    {communityError ? <div className="cx-retry" role="alert"><p>Live communities could not be loaded. Your AI guidance is still available.</p><button type="button" className="cx-btn cx-btn-soft" onClick={() => void loadLiveCommunities()}>Retry community loading</button></div> : null}
                    <div className="cx-cards">
                      {liveCommunities !== null ? exchange.advice.matches.map((match) => (
                        <CommunityCard
                          key={match.id}
                          community={liveCommunities?.find((community) => community.id === match.id) ?? null}
                          reason={match.reason}
                          joined={joinedIds.includes(match.id) || (liveCommunities?.find((community) => community.id === match.id)?.joined ?? false)}
                          onJoin={joinLiveCommunity}
                          onOpen={() => dispatch({ type: "set-tab", tab: "circles" })}
                        />
                      )) : null}
                    </div>
                  </div>
                ) : null}
                {exchange.advice.matches.length === 0 ? (
                  <p className="cx-no-match">No strong community match yet. Keep talking and Harmonise will continue listening.</p>
                ) : null}
              </div>
            ) : null}
            {exchange.status === "error" ? (
              <div className="cx-retry" role="alert">
                <p style={{ margin: 0 }}>The live adviser could not respond just now. Please try again.</p>
                <button type="button" className="cx-btn cx-btn-soft" onClick={() => retry(exchange)}>
                  Try again
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <form className="cx-composer" onSubmit={send} aria-label="Message the adviser">
        <div className="cx-composer-row">
          <label className="cx-label" htmlFor="cx-adviser-draft" style={{ position: "absolute", left: "-9999px" }}>
            Share what is happening
          </label>
          <textarea
            id="cx-adviser-draft"
            className="cx-textarea"
            value={draft}
            maxLength={MAX_MESSAGE_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share what is happening, in your own words…"
          />
          <button type="submit" className="cx-btn cx-btn-primary" disabled={sending || draft.trim().length === 0}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
        <div className="cx-composer-meta">
          <span>Your message is sent to Meta Muse for general guidance. The adviser uses Muse Wonder with Spark fallback.</span>
          <span>{draft.trim().length}/{MAX_MESSAGE_LENGTH}</span>
        </div>
      </form>
    </section>
  );
}
