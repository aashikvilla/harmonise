"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/connect/session";
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
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
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
    dispatch({ type: "enter", displayName: displayNameFor(address), nameMode: "alias", email: address });
    router.push("/connect/member");
  }

  function disclosuresOk(): boolean {
    if (!adult) {
      setError("Please confirm you are 18 or older.");
      return false;
    }
    if (!providerConsent) {
      setError("Please confirm the AI processing notice before creating an account.");
      return false;
    }
    return true;
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (mode === "sign-up" && !disclosuresOk()) return;
    if (password.length < 12) {
      setError("Use a password with at least 12 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          action: mode,
          ...(mode === "sign-up" ? { adultConfirmed: adult, aiNoticeAccepted: providerConsent } : {}),
        }),
      });
      if (response.ok) {
        const me = await fetchMe();
        enterSpace(me?.email ?? email.trim());
      } else if (response.status === 429) {
        setError("Too many attempts. Wait a minute and try again.");
      } else if (response.status === 409) {
        setError("Email confirmation is still enabled for this project. Try again after confirmation is turned off in Supabase Auth settings.");
      } else {
        setError(mode === "sign-up" ? "We could not create this account. Check the email and password, or try signing in." : "Email or password was not recognized.");
      }
    } catch {
      setError("Sign-in is temporarily unavailable. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  async function continueWithDemo() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
      if (response.ok) {
        enterSpace("demo@harmonise.example");
      } else {
        setError("The demo account is not available right now. Please try again later.");
      }
    } catch {
      setError("The demo account is not available right now. Please try again later.");
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

  return (
      <form onSubmit={(event) => void submitPassword(event)} noValidate aria-label="Member email and password sign in">
        <div className="cx-path-tabs" role="group" aria-label="Account action">
          <button type="button" className="cx-path-tab" aria-pressed={mode === "sign-in"} onClick={() => { setMode("sign-in"); setError(null); }}>Sign in</button>
          <button type="button" className="cx-path-tab" aria-pressed={mode === "sign-up"} onClick={() => { setMode("sign-up"); setError(null); }}>Create account</button>
        </div>
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-member-email">Email</label>
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
        <div className="cx-field">
          <label className="cx-label" htmlFor="cx-member-password">Password</label>
          <input id="cx-member-password" className="cx-input" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 12 characters" />
        </div>
        {mode === "sign-up" ? <>
          <label className="cx-check-row"><input type="checkbox" checked={adult} onChange={(event) => setAdult(event.target.checked)} /><span>I confirm I am 18 or older.</span></label>
          <label className="cx-check-row"><input type="checkbox" checked={providerConsent} onChange={(event) => setProviderConsent(event.target.checked)} /><span>I understand that when I ask for AI guidance, my message is sent to Meta for a response.</span></label>
        </> : null}
        {error ? <p className="cx-error" role="alert">{error}</p> : null}
        <div className="cx-disclaimer">
          Adviser conversations remain in this browser session and are not saved to your account. Nothing is shared
          with a community unless you review and choose to post it.
          Harmonise is not therapy, diagnosis, legal advice, financial advice, or emergency response.
        </div>
        <div className="cx-cta-row">
          <button type="submit" disabled={busy || email.trim().length === 0 || password.length < 12 || (mode === "sign-up" && (!adult || !providerConsent))} className="cx-btn cx-btn-primary cx-btn-block">
            {busy ? "Working…" : mode === "sign-up" ? "Create account" : "Sign in"}
          </button>
        </div>
      <div className="cx-cta-row">
          <button type="button" disabled={busy} className="cx-btn cx-btn-soft cx-btn-block" onClick={() => void continueWithDemo()}>
            {busy ? "Opening demo…" : "Continue with demo account"}
          </button>
        </div>
        <p className="cx-note">This is a shared demo account. Use fictional details only; activity may be visible to other demo visitors.</p>
      </form>
    );
}

export default function Onboarding() {
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
                <div><strong>Email and password</strong><span>Create your private account or sign in securely.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">2</span>
                <div><strong>Chat privately</strong><span>Meta Muse offers reflections and next steps when you ask.</span></div>
              </li>
              <li>
                <span className="cx-flow-num" aria-hidden="true">3</span>
                <div><strong>You choose a circle</strong><span>Communities appear only after you ask to see them.</span></div>
              </li>
            </ol>
            <div className="cx-privacy-list">
              <p>Private by design</p>
              <ul>
                <li>Meta Muse generates general guidance from the message you choose to send.</li>
                <li>Your conversation is not posted to a community.</li>
                <li>Adviser messages are not saved to your account or posted to a community.</li>
                <li>Circles appear after you ask, and joining is always your choice.</li>
                <li>Raw conversation should never automatically become a public profile or community post.</li>
              </ul>
            </div>
          </div>
          <section className="cx-gate-card cx-card-white" aria-label="Enter Harmonise">
            <p className="cx-kicker">Member sign-in</p>
            <h2>Continue with your private account</h2>
            <MemberForm />
          </section>
        </div>
      </div>
    </main>
  );
}
