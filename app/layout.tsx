import "./globals.css";
import type { Metadata } from "next";

const DESC =
  "A shared group wallet: one Universal Account, one cross-chain balance, and every member gets their own EIP-7702 spending limit. No gas, no seed phrase.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bareng-jade.vercel.app"),
  title: "Bareng — money, together",
  description: DESC,
  keywords: ["Universal Account", "EIP-7702", "shared wallet", "account abstraction", "Arbitrum", "arisan", "gotong royong"],
  openGraph: {
    title: "Bareng — money, together",
    description: DESC,
    url: "/",
    siteName: "Bareng",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Bareng — money, together", description: DESC },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
