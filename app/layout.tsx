import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bareng — money, together",
  description: "One shared balance for your group. Any token, any chain. No gas, no seed phrase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
