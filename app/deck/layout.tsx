import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bareng — Pitch deck",
  description:
    "A shared group wallet: one Universal Account, per-member EIP-7702 limits. Proven on-chain across 7 real artifacts. Keyboard-navigable pitch deck.",
  openGraph: {
    title: "Bareng — Pitch deck",
    description: "A shared group wallet, proven on-chain across 7 real artifacts.",
    url: "/deck",
    siteName: "Bareng",
    type: "website",
  },
};

export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return children;
}
