import type { ReactNode } from "react";
import "./connect.css";
import { ConnectProvider } from "@/lib/connect/session";

export default function ConnectLayout({ children }: { children: ReactNode }) {
  return <ConnectProvider>{children}</ConnectProvider>;
}
