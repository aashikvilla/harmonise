import type { Metadata } from "next";
import Link from "next/link";
import RealCommunityList from "@/components/community/real-community-list";

export const metadata: Metadata = {
  title: "harmonize. — Real communities",
  description: "Browse live Harmonise communities with real members and real posts.",
};

export default function CommunitiesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm underline">
        ← Home
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">harmonize. · live pilot</p>
      <h1 className="mt-1 text-4xl font-semibold">Communities</h1>
      <p className="mt-2 max-w-2xl text-[var(--muted)]">
        Real memberships, real posts, and human moderators. Counts below come from the database — never samples.
      </p>
      <div className="mt-6">
        <RealCommunityList />
      </div>
    </main>
  );
}
