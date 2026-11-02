"use client";

import { useState } from "react";

async function api(path: string, init?: RequestInit): Promise<{ status: number }> {
  try {
    const response = await fetch(path, { credentials: "include", ...init });
    await response.json().catch(() => null);
    return { status: response.status };
  } catch {
    return { status: 0 };
  }
}

/** Email-code sign-in. Used by saved sessions and real communities. */
export default function AuthCard({ onSignedIn, heading }: { onSignedIn: () => void; heading: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function sendCode() {
    setBusy(true);
    setError("");
    const result = await api("/api/auth/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (result.status === 200) {
      setCodeSent(true);
    } else if (result.status === 429) {
      setError("Too many code requests. Wait a minute and try again.");
    } else {
      setError("The sign-in code could not be sent. Try again.");
    }
  }

  async function verifyCode() {
    setBusy(true);
    setError("");
    const result = await api("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    setBusy(false);
    if (result.status === 200) {
      onSignedIn();
    } else {
      setError("That code did not match. Check the latest email and try again.");
    }
  }

  return (
    <section className="panel session-panel" aria-label={heading}>
      <span className="context-eyebrow">OPTIONAL ACCOUNT · PRIVATE ONLY</span>
      <h2>{heading}</h2>
      <p className="small-note">
        With an account, your private conversations are stored for you alone and expire after 90 days without use.
        Nothing is shared with any community without your explicit review. You can export or delete everything at any time.
      </p>
      <label className="field-label" htmlFor="auth-email">Email for a sign-in code</label>
      <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      {codeSent && (
        <>
          <label className="field-label" htmlFor="auth-email-code">6-digit code from your email</label>
          <input id="auth-email-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
        </>
      )}
      {error && <p className="notice">{error}</p>}
      <div className="inline-actions">
        {!codeSent ? (
          <button type="button" className="button button-primary" disabled={busy || !email.trim()} onClick={() => void sendCode()}>
            {busy ? "Sending…" : "Email me a code"}
          </button>
        ) : (
          <button type="button" className="button button-primary" disabled={busy || !code.trim()} onClick={() => void verifyCode()}>
            {busy ? "Checking…" : "Sign in"}
          </button>
        )}
      </div>
    </section>
  );
}
