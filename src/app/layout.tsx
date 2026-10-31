import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harmonise — Find understanding, on your terms",
  description: "Talk privately, explore human experiences and communities, and choose what to share, on your terms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
