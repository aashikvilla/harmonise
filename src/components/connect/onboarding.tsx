"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession, type NameMode } from "@/lib/connect/session";
import { CoachDashboardPreview } from "@/components/connect/coaches";

function Brand() {
  return (
    <div className="cx-brand" aria-label="Harmonise">
      <span className="cx-brand-mark" aria-hidden="true">H</span>
      <span>
        <span className="cx-brand-name">Harmonise<em>.</em></span>
        <span className="cx-tagline" style={{ display: "block" }}>Human growth, shared.</span>
      </span>
    </div>
  );
}

function MemberForm() {
  const { dispatch } = useSession();
  const router = useRouter();
  const [nameMode, setNameMode] = useState<NameMode>("alias");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) {
      setError(nameMode === "alias" ? "Choose an alias to continue." : "Enter your name to continue.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (!adult) {
      setError("Please confirm you are 18 or older.");
      return;
    }
    dispatch({ type: "enter", displayName: name.trim(), nameMode, email: email.trim(), demo: false });
    router.push("/connect/member");
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Member entry">
      <div className="cx-field" role="radiogroup" aria-label="How should Harmonise know you?">
        <label className="cx-radio-row">
          <input type="radio" name="nameMode" checked={nameMode === "alias"} onChange={() => setNameMode("alias")} />
          <span><strong>Use an alias.</strong> Stay private; direct 1:1 coach requests stay off.</span>
        </label>
        <label className="cx-radio-row">
          <input type="radio" name="nameMode" checked={nameMode === "real"} onChange={() => setNameMode("real")} />
          <span><strong>Use my real name.</strong> Enables coach introduction previews.</span>
        </label>
      </div>
      <div className="cx-field">
        <label className="cx-label" htmlFor="cx-entry-name">{nameMode === "alias" ? "Your alias" : "Your name"}</label>
        <input
          id="cx-entry-name"
          className="cx-input"
          type="text"
          autoComplete="nickname"
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={nameMode === "alias" ? "e.g. Quiet Fern" : "e.g. Jordan Lee"}
        />
      </div>
      <div className="cx-field">
        <label className="cx-label" htmlFor="cx-entry-email">Email</label>
        <input
          id="cx-entry-email"
          className="cx-input"
          type="email"
          autoComplete="email"
          maxLength={120}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <label className="cx-check-row">
        <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
        <span>I confirm I am 18 or older.</span>
      </label>
      {error ? <p className="cx-error" role="alert">{error}</p> : null}
      <div className="cx-disclaimer">
        Prototype only: Harmonise is not therapy, diagnosis, legal advice, financial advice, or emergency response.
        No real account is created and entries reset on refresh.
      </div>
      <div className="cx-cta-row">
        <button type="submit" className="cx-btn cx-btn-primary cx-btn-block">Find support</button>
      </div>
    </form>
  );
}

function CoachPath() {
  const [email, setEmail] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid coach email to preview the portal.");
      return;
    }
    setError(null);
    setPreview(true);
  }

  return (
    <div>
      <form onSubmit={submit} noValidate aria-label="Support Coach entry">
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-coach-email">Coach email</label>
          <input
            id="cx-coach-email"
            className="cx-input"
            type="email"
            autoComplete="email"
            maxLength={120}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="coach@example.com"
          />
        </div>
        {error ? <p className="cx-error" role="alert">{error}</p> : null}
        <div className="cx-cta-row">
          <button type="submit" className="cx-btn cx-btn-dark cx-btn-block">Give support</button>
        </div>
      </form>
      {preview ? (
        <div className="cx-coach-preview">
          <CoachDashboardPreview />
        </div>
      ) : null}
    </div>
  );
}

export default function Onboarding() {
  const { dispatch } = useSession();
  const router = useRouter();
  const [path, setPath] = useState<"member" | "coach">("member");

  function exploreDemo() {
    dispatch({ type: "enter", displayName: "Guest explorer", nameMode: "alias", email: "", demo: true });
    router.push("/connect/member");
  }

  return (
    <main className="cx-gate">
      <div className="cx-gate-inner">
        <Brand />
        <div className="cx-gate-grid">
          <div className="cx-gate-hero">
            <p className="cx-kicker">A space for unfinished thoughts</p>
            <h1>
              Share something difficult. <em>Get a way forward.</em> Choose connection.
            </h1>
            <p className="cx-lede">
              I share something difficult. Harmonise listens. It gives me a practical way forward. I decide whether
              I want to meet people who have lived something similar.
            </p>
            <ol className="cx-flow">
              <li>
                <span className="cx-flow-num" aria-hidden="true">1</span>
                <div><strong>Listen</strong><span>Explain privately, in your own words. Nothing is posted.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">2</span>
                <div><strong>Advise</strong><span>A live AI reflects what it heard and offers next steps.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">3</span>
                <div><strong>You choose connection</strong><span>Communities appear only after you ask to see them.</span></div>
              </li>
            </ol>
            <div className="cx-privacy-list">
              <p>Private by design</p>
              <ul>
                <li>Your message is sent to a live AI model to generate general guidance.</li>
                <li>Your conversation is not posted to a community.</li>
                <li>This prototype does not store conversations in an app database.</li>
                <li>Community joining is always explicit and consent-based.</li>
                <li>Raw conversation should never automatically become a public profile or community post.</li>
              </ul>
            </div>
          </div>
          <section className="cx-gate-card cx-card-white" aria-label="Enter Harmonise">
            <p className="cx-kicker">Prototype entry</p>
            <h2>Begin, on your terms</h2>
            <div className="cx-path-tabs" role="tablist" aria-label="Entry path">
              <button
                type="button"
                role="tab"
                aria-selected={path === "member"}
                className="cx-path-tab"
                onClick={() => setPath("member")}
              >
                Find support
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={path === "coach"}
                className="cx-path-tab"
                onClick={() => setPath("coach")}
              >
                Give support
              </button>
            </div>
            {path === "member" ? <MemberForm /> : <CoachPath />}
            <div className="cx-demo-row">
              <button type="button" className="cx-btn cx-btn-ghost" onClick={exploreDemo}>
                Explore without entering details
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
