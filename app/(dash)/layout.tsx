"use client";

// Shared dashboard shell for every /app-section page: a neobrutalism sidebar on desktop, a
// scrollable top nav on mobile, with the active route highlighted. The landing (`/`) is outside
// this group, so it stays sidebar-free.

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/app", label: "Overview", emoji: "🏠", color: "var(--yellow)" },
  { href: "/arisan", label: "Arisan", emoji: "🎲", color: "var(--purple)" },
  { href: "/split", label: "Split", emoji: "🧾", color: "var(--green)" },
  { href: "/receive", label: "Receive", emoji: "🕶️", color: "var(--pink)" },
  { href: "/agent", label: "Agent", emoji: "🤖", color: "var(--orange)" },
  { href: "/earn", label: "Earn", emoji: "📈", color: "var(--lime)" },
  { href: "/admin", label: "Manage pot", emoji: "⚙️", color: "var(--blue)" },
];

export default function DashLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="mx-auto flex w-full max-w-6xl md:gap-6 md:p-6">
      {/* Desktop sidebar */}
      <aside className="sticky top-6 hidden h-[calc(100dvh-3rem)] w-56 shrink-0 md:block">
        <div className="neo flex h-full flex-col rounded-2xl bg-[var(--panel)] p-4">
          <Link href="/" className="mb-5 flex items-center gap-2">
            <span className="neo-flat grid h-9 w-9 place-items-center rounded-lg bg-[var(--yellow)] text-lg font-black">B</span>
            <span className="text-xl font-black tracking-tight">Bareng</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-2">
            {NAV.map((n) => {
              const active = path === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`neo-btn flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-black ${active ? "" : "bg-[var(--panel)]"}`}
                  style={active ? { background: n.color } : undefined}
                >
                  <span aria-hidden>{n.emoji}</span> {n.label}
                </Link>
              );
            })}
          </nav>
          <Link href="/" className="neo-btn mt-3 rounded-lg bg-[var(--panel)] px-3 py-2 text-center text-sm text-black">
            ← Home
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="w-full min-w-0">
        {/* Mobile top nav */}
        <div className="sticky top-0 z-10 flex items-center gap-2 overflow-x-auto border-b-[3px] border-black bg-[var(--bg)] px-4 py-3 md:hidden">
          <Link href="/" className="shrink-0 pr-1 text-lg font-black">Bareng</Link>
          {NAV.map((n) => {
            const active = path === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`neo-btn shrink-0 rounded-lg px-3 py-1.5 text-xs text-black ${active ? "" : "bg-[var(--panel)]"}`}
                style={active ? { background: n.color } : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}
