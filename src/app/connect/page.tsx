import type { Metadata } from "next";
import Onboarding from "@/components/connect/onboarding";

const description =
  "Share something difficult privately. Harmonise listens, offers a practical way forward, and — only with your consent — connects you with peer communities who understand.";

export const metadata: Metadata = {
  title: "Harmonise — Human growth, shared.",
  description,
  openGraph: {
    title: "Harmonise — Human growth, shared.",
    description,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Harmonise — Human growth, shared.",
    description,
  },
};

export default function ConnectPage() {
  return <Onboarding />;
}
