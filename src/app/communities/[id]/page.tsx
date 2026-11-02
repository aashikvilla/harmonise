import type { Metadata } from "next";
import Link from "next/link";
import RealCommunityDetail from "@/components/community/real-community-detail";

export const metadata: Metadata = {
  title: "harmonize. — Community",
  description: "Read and share posts in a live Harmonise community.",
};

export default async function CommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/communities" className="text-sm underline">
        ← All communities
      </Link>
      <div className="mt-6">
        <RealCommunityDetail communityId={id} />
      </div>
    </main>
  );
}
