import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-dm-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Harmonise — Find understanding, on your terms",
  description: "Talk privately, explore human experiences and communities, and choose what to share, on your terms.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}><body>{children}</body></html>;
}
