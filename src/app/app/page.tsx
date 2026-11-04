import type { Metadata } from "next";
import LiveConversation from "@/components/live-conversation";

export const metadata: Metadata = {
  title: "harmonize. — Private conversation",
  description: "A private AI guided conversation, saved to your account and shared only when you choose.",
};

export default function ProductPage() {
  return <LiveConversation />;
}
