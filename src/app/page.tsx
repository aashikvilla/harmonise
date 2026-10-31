import HarmonizeHomepage from "@/components/harmonize-homepage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "harmonize. — A Space for Unfinished Thoughts",
  description:
    "Talk things through privately. Discover people who understand. Find your own way forward, one conversation at a time.",
};

export default function Home() {
  return <HarmonizeHomepage />;
}
