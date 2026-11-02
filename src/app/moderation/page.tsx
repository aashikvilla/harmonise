import type { Metadata } from "next";
import Link from "next/link";
import ReviewerQueue from "@/components/moderation/reviewer-queue";

export const metadata: Metadata = {
  title: "harmonize. — Moderation review",
  description: "Human moderation queue for Harmonise reviewers.",
  robots: { index: false, follow: false },
};

export default function ModerationPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/communities" className="text-sm underline">
        ← Communities
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">harmonize. · reviewers only</p>
      <h1 className="mt-1 text-4xl font-semibold">Moderation review</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Reported posts reach authorized humans with full context. AI suggestions advise; only people decide.
      </p>
      <div className="mt-6">
        <ReviewerQueue />
      </div>
    </main>
  );
}
