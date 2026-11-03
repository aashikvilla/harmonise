import type { Metadata } from "next";
import RealCommunityList from "@/components/community/real-community-list";
import ProductHeader from "@/components/product-header";

export const metadata: Metadata = {
  title: "harmonize. — Real communities",
  description: "Browse live Harmonise communities with real members and real posts.",
};

export default function CommunitiesPage() {
  return (
    <div className="product-page">
      <ProductHeader current="communities" />
      <main className="product-page-content">
        <p className="product-page-kicker">A place to be understood</p>
        <h1 className="serif-head">Communities</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Real memberships and posts from the database. Reports enter a review queue; communities are not monitored continuously.
        </p>
        <div className="mt-8"><RealCommunityList /></div>
      </main>
    </div>
  );
}
