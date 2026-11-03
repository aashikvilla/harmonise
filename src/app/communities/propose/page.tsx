import type { Metadata } from "next";
import Link from "next/link";
import CommunityProposalForm from "@/components/community/community-proposal-form";

export const metadata: Metadata = {
  title: "harmonize. — Suggest a community",
  description: "Suggest a community for human review.",
};

export default function ProposeCommunityPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/communities" className="text-sm underline">← All communities</Link>
      <p className="product-page-kicker mt-6">harmonize. · community proposal</p>
      <h1 className="serif-head mt-1 text-4xl">Make room for a new circle</h1>
      <p className="mt-3 mb-6 max-w-2xl text-[var(--muted)]">Tell us who it would help and what the space is for. A human reviews every proposal before it can open.</p>
      <CommunityProposalForm />
    </main>
  );
}
