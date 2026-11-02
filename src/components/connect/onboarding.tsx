"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/connect/session";
import { CoachDashboardPreview } from "@/components/connect/coaches";
import SharedBrand from "@/components/connect/brand";

const DEMO_EMAIL = "demo@harmonise.example";
const DEMO_PASSWORD = "MuseDemo2026!";
const DEMO_DISPLAY_NAME = "Quiet Fern";

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function Brand() {
  return <SharedBrand tagline="Human growth, shared." />;
}
function OneTapDemo() {
  const { dispatch } = useSession();
  const router = useRouter();

  function enter() {
    dispatch({ type: "enter", displayName: DEMO_DISPLAY_NAME, nameMode: "alias", email: DEMO_EMAIL, demo: true });
    router.push("/connect/member");
  }

  return (
    <div className="cx-onetap">
      <button type="button" className="cx-btn cx-btn-primary cx-btn-block" onClick={enter}>
        Try the demo in one tap
      </button>
      <p className="cx-note">
        One tap confirms you are 18 or older and that demo messages are sent to Meta Muse Spark. Shared demo
        account — nothing is saved. Prefer the manual sign-in below instead.
      </p>
    </div>
  );
}

function MemberForm() {
  const { dispatch } = useSession();
  const router = useRouter();
  const ready = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [adult, setAdult] = useState(false);
  const [providerConsent, setProviderConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setError("Those demo credentials do not match. Use the credentials shown above.");
      return;
    }
    if (!adult) {
      setError("Please confirm you are 18 or older.");
      return;
    }
    if (!providerConsent) {
      setError("Please confirm that your message will be sent to Meta Muse Spark.");
      return;
    }
    dispatch({ type: "enter", displayName: DEMO_DISPLAY_NAME, nameMode: "alias", email: DEMO_EMAIL, demo: true });
    router.push("/connect/member");
  }

  return (
    <div>
      <OneTapDemo />
      <div className="cx-demo-credentials" aria-label="Demo credentials">
        <p className="cx-demo-title">Demo account</p>
        <dl>
          <div><dt>Email</dt><dd>{DEMO_EMAIL}</dd></div>
          <div><dt>Password</dt><dd>{DEMO_PASSWORD}</dd></div>
        </dl>
        <p>These shared demo credentials are not a private or real account.</p>
      </div>
      <form onSubmit={submit} noValidate aria-label="Demo account sign in">
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-demo-email">Demo email</label>
          <input
            id="cx-demo-email"
            className="cx-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-demo-password">Demo password</label>
          <input
            id="cx-demo-password"
            className="cx-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <label className="cx-check-row">
          <input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} />
          <span>I confirm I am 18 or older.</span>
        </label>
        <label className="cx-check-row">
          <input type="checkbox" checked={providerConsent} onChange={(event) => setProviderConsent(event.target.checked)} />
          <span>I understand my message will be sent to Meta Muse Spark for a response.</span>
        </label>
        {error ? <p className="cx-error" role="alert">{error}</p> : null}
        <div className="cx-disclaimer">
          Demo only: sign-in and circle membership stay in this browser session. No account, conversation, or community
          post is written to Supabase. Use fictional details; do not enter information that identifies you.
          Harmonise is not therapy, diagnosis, legal advice, financial advice, or emergency response.
        </div>
        <div className="cx-cta-row">
          <button type="submit" disabled={!ready} className="cx-btn cx-btn-primary cx-btn-block">
            Sign in and continue to chat
          </button>
        </div>
      </form>
    </div>
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
  const [path, setPath] = useState<"member" | "coach">("member");

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
              I share something difficult. harmonize listens. It gives me a practical way forward. I decide whether
              I want to meet people who have lived something similar.
            </p>
            <ol className="cx-flow">
              <li>
                <span className="cx-flow-num" aria-hidden="true">1</span>
                <div><strong>Sign in to the demo</strong><span>Use the shared demo credentials; no new account is created.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">2</span>
                <div><strong>Chat privately</strong><span>Meta Muse Spark reflects what it heard and offers next steps.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">3</span>
                <div><strong>You choose a circle</strong><span>Sample communities appear only after you ask to see them.</span></div>
              </li>
            </ol>
            <div className="cx-privacy-list">
              <p>Private by design</p>
              <ul>
                <li>Meta Muse Spark generates general guidance from the message you send.</li>
                <li>Your conversation is not posted to a community.</li>
                <li>Demo chat and circle membership stay in this browser session, not the app database.</li>
                <li>Sample circles appear after you ask and joining is your choice.</li>
                <li>Raw conversation should never automatically become a public profile or community post.</li>
              </ul>
            </div>
          </div>
          <section className="cx-gate-card cx-card-white" aria-label="Enter Harmonise">
            <p className="cx-kicker">Demo sign-in</p>
            <h2>Continue without creating an account</h2>
            <div className="cx-path-tabs" role="tablist" aria-label="Entry path">
              <button
                type="button"
                role="tab"
                aria-selected={path === "member"}
                className="cx-path-tab"
                onClick={() => setPath("member")}
              >
                Member demo
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={path === "coach"}
                className="cx-path-tab"
                onClick={() => setPath("coach")}
              >
                Coach preview
              </button>
            </div>
            {path === "member" ? <MemberForm /> : <CoachPath />}
          </section>
        </div>
      </div>
    </main>
  );
}
