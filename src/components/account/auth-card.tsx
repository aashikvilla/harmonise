"use client";

import { useState, type FormEvent } from "react";

/** Email/password auth shared by communities, reviewer access, and saved sessions. */
export default function AuthCard({ onSignedIn, heading }: { onSignedIn: () => void; heading: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password, action: "sign-in" }),
      });
      if (response.ok) onSignedIn();
      else if (response.status === 429) setError("Too many attempts. Wait a minute and try again.");
      else setError("Email or password was not recognized.");
    } catch {
      setError("Sign-in is temporarily unavailable. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel session-panel" aria-label={heading}>
      <span className="context-eyebrow">PRIVATE ACCOUNT</span>
      <h2>{heading}</h2>
      <p className="small-note">Sign in with your email and password. Your private conversation is never shared with a community unless you choose to share it.</p>
      <form onSubmit={(event) => void submit(event)}>
        <label className="field-label" htmlFor="auth-email">Email</label>
        <input id="auth-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
        <label className="field-label" htmlFor="auth-password">Password</label>
        <input id="auth-password" type="password" autoComplete="current-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="notice" role="alert">{error}</p>}
        <div className="inline-actions">
          <button type="submit" className="button button-primary" disabled={busy || !email.trim() || password.length < 12}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </section>
  );
}
