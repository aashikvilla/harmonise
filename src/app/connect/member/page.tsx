import type { Metadata } from "next";
import MemberShell from "@/components/connect/member-shell";

export const metadata: Metadata = {
  title: "Harmonise — Your space",
  description:
    "Talk privately with the Harmonise Adviser, track your journey, join peer circles by choice, and meet Support Coaches.",
  openGraph: {
    title: "Harmonise — Your space",
    description:
      "Talk privately with the Harmonise Adviser, track your journey, join peer circles by choice, and meet Support Coaches.",
    type: "website",
  },
};

export default function MemberPage() {
  return <MemberShell />;
}
