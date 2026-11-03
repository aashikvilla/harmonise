"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/connect/session";
import { CoachDashboardPreview } from "@/components/connect/coaches";
import SharedBrand from "@/components/connect/brand";

function Brand() {
  return <SharedBrand tagline="Human growth, shared." />;
}

function displayNameFor(email: string): string {
  const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  if (!local) return "Member";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

type MeResult = { id: string; email?: string } | null;

async function fetchMe(): Promise<MeResult> {
  try {
    const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as { id?: unknown; email?: unknown } | null;
    if (!body || typeof body.id !== "string") return null;
    return { id: body.id, email: typeof body.email === "string" ? body.email : undefined };
  } catch {
    return null;
  }
}

function MemberForm() {
  const { dispatch } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [adult, setAdult] = useState(false);
  const [providerConsent, setProviderConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (me) setSignedInEmail(me.email ?? "");
      setChecking(false);
    })();
    return () => { cancelled = true; };
  }, []);

  function enterSpace(address: string) {
    dispatch({ type: "enter", displayName: displayNameFor(address), nameMode: "alias", email: address, demo: false });
    router.push("/connect/member");
  }

  function disclosuresOk(): boolean {
    if (!adult) {
      setError("Please confirm you are 18 or older.");
      return false;
    }
    if (!providerConsent) {
      setError("Please confirm that your message will be sent to Meta Muse Spark.");
      return false;
    }
    return true;
  }

  async function sendCode() {
    if (busy) return;
    if (!disclosuresOk()) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (response.ok) {
        setCodeSent(true);
      } else if (response.status === 429) {
        setError("Too many code requests. Wait a minute and try again.");
      } else {
        setError("The sign-in code could not be sent. Check the email and try again.");
      }
    } catch {
      setError("The sign-in code could not be sent. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      if (!response.ok) {
        setError("That code did not match or has expired. Resend a fresh code and use the latest email.");
        return;
      }
      const me = await fetchMe();
      enterSpace(me?.email ?? email.trim());
    } catch {
      setError("Sign-in could not be confirmed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function switchAccount() {
    setBusy(true);
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } catch {
      /* The sign-in form still shows. */
    }
    setSignedInEmail(null);
    setBusy(false);
  }

  function submitSend(event: FormEvent) {
    event.preventDefault();
    void sendCode();
  }

  function submitVerify(event: FormEvent) {
    event.preventDefault();
    void verifyCode();
  }

  if (checking) {
    return <p className="cx-note" role="status">Checking your sign-in…</p>;
  }

  if (signedInEmail !== null) {
    return (
      <div>
        <p className="cx-note">You are signed in{signedInEmail ? ` as ${signedInEmail}` : ""}.</p>
        <div className="cx-cta-row">
          <button type="button" className="cx-btn cx-btn-primary cx-btn-block" onClick={() => enterSpace(signedInEmail)}>
            Continue to your space
          </button>
        </div>
        <div className="cx-cta-row">
          <button type="button" className="cx-btn cx-btn-soft cx-btn-block" disabled={busy} onClick={() => void switchAccount()}>
            Use a different account
          </button>
        </div>
      </div>
    );
  }

  if (!codeSent) {
    return (
      <form onSubmit={submitSend} noValidate aria-label="Member email sign in">
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-member-email">Email for a sign-in code</label>
          <input
            id="cx-member-email"
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
        <label className="cx-check-row">
          <input type="checkbox" checked={providerConsent} onChange={(event) => setProviderConsent(event.target.checked)} />
          <span>I understand my message will be sent to Meta Muse Spark for a response.</span>
        </label>
        {error ? <p className="cx-error" role="alert">{error}</p> : null}
        <div className="cx-disclaimer">
          A private account: your conversations are stored for you alone and expire after 90 days without use.
          Nothing is shared with any community without your explicit review.
          Harmonise is not therapy, diagnosis, legal advice, financial advice, or emergency response.
        </div>
        <div className="cx-cta-row">
          <button type="submit" disabled={busy || email.trim().length === 0} className="cx-btn cx-btn-primary cx-btn-block">
            {busy ? "Sending…" : "Email me a code"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitVerify} noValidate aria-label="Member code verification">
      <p className="cx-note">A code is on its way to {email.trim()}. Codes expire quickly — always use the most recent email.</p>
      <div className="cx-field">
        <label className="cx-label" htmlFor="cx-member-code">6-digit code from your email</label>
        <input
          id="cx-member-code"
          className="cx-input"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
        />
      </div>
      {error ? <p className="cx-error" role="alert">{error}</p> : null}
      <div className="cx-cta-row">
        <button type="submit" disabled={busy || code.trim().length === 0} className="cx-btn cx-btn-primary cx-btn-block">
          {busy ? "Checking…" : "Sign in and continue to chat"}
        </button>
      </div>
      <div className="cx-cta-row">
        <button type="button" className="cx-btn cx-btn-soft cx-btn-block" disabled={busy} onClick={() => void sendCode()}>
          Resend code
        </button>
      </div>
      <div className="cx-cta-row">
        <button
          type="button"
          className="cx-btn cx-btn-soft cx-btn-block"
          disabled={busy}
          onClick={() => {
            setCodeSent(false);
            setCode("");
            setError(null);
          }}
        >
          Use a different email
        </button>
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
                <div><strong>Sign in with email</strong><span>A one-time code — no password and no shared account.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">2</span>
                <div><strong>Chat privately</strong><span>Meta Muse Spark reflects what it heard and offers next steps.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">3</span>
                <div><strong>You choose a circle</strong><span>Communities appear only after you ask to see them.</span></div>
              </li>
            </ol>
            <div className="cx-privacy-list">
              <p>Private by design</p>
              <ul>
                <li>Meta Muse Spark generates general guidance from the message you send.</li>
                <li>Your conversation is not posted to a community.</li>
                <li>Your account is private: conversations stay with you and expire after 90 days without use.</li>
                <li>Circles appear after you ask, and joining is always your choice.</li>
                <li>Raw conversation should never automatically become a public profile or community post.</li>
              </ul>
            </div>
          </div>
          <section className="cx-gate-card cx-card-white" aria-label="Enter Harmonise">
            <p className="cx-kicker">Member sign-in</p>
            <h2>Continue with your private account</h2>
            <div className="cx-path-tabs" role="tablist" aria-label="Entry path">
              <button
                type="button"
                role="tab"
                aria-selected={path === "member"}
                className="cx-path-tab"
                onClick={() => setPath("member")}
              >
                Member sign-in
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
