"use client";

// Pitch deck at /deck — a keyboard-navigable, neobrutalism slide deck. ←/→ or space, click zones,
// or the dots. Content is the real project (7 on-chain artifacts, all five partners, honest scope).

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const ARB = "https://arbiscan.io/tx/";
const PROOFS = [
  { c: "var(--green)", t: "Shared-UA spend", chain: "Arbitrum", tx: "0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7" },
  { c: "var(--blue)", t: "7702 cap enforced", chain: "Sepolia", tx: "0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036", exp: "https://sepolia.etherscan.io/tx/" },
  { c: "var(--pink)", t: "Aave v3 DeFi lend", chain: "Arbitrum", tx: "0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad" },
  { c: "var(--orange)", t: "x402 agent payment", chain: "Arbitrum", tx: "0x4870c99abff9c1e2aeaec80ca39df1e25f78fc5ba3195cd0d6b9fad14f3ad67e" },
  { c: "var(--yellow)", t: "Private stealth sweep", chain: "Arbitrum", tx: "0xb338f36d10db2af93df49db33181c469c6ea552e782618fe25e78ac92e7f3ebe" },
  { c: "var(--purple)", t: "Dashboard receipts (×4)", chain: "Arbitrum", tx: "0x4a5d673b7bc109372a68264d83888124749338e21f58b97eb814faae3d0176e1" },
];
const PARTNERS = [
  { n: "Particle", c: "var(--yellow)", d: "Universal Account in EIP-7702 mode — the cross-chain balance. Core." },
  { n: "Magic", c: "var(--blue)", d: "Google login → a seedless EOA. No wallet, no seed phrase. Core." },
  { n: "Arbitrum", c: "var(--green)", d: "Every spend settles here. 5 real txs. Core." },
  { n: "ZeroDev", c: "var(--purple)", d: "Kernel7702 cap (on-chain, Sepolia) + a working cross-chain SRA." },
  { n: "Openfort / x402", c: "var(--orange)", d: "Real x402 handshake — EIP-3009 signed + verified, settled on-chain." },
];

const chip = "neo-tag inline-block rounded-md px-2 py-1 text-xs";
const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-4xl font-black leading-[0.98] tracking-tight sm:text-5xl">{children}</h2>;
const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="neo-label mb-3 text-sm text-[var(--ink)]/60">{children}</p>;

const SLIDES: (() => React.ReactNode)[] = [
  // 1 — Title
  () => (
    <div className="text-center">
      <span className="neo-flat mx-auto grid h-16 w-16 place-items-center rounded-xl bg-[var(--yellow)] text-3xl font-black">B</span>
      <h1 className="mt-6 text-6xl font-black leading-[1.15] tracking-tight sm:text-7xl">
        Money,<br /><span className="bg-[var(--pink)] px-2 [box-decoration-break:clone]">together.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-xl text-lg font-semibold text-[var(--ink)]/80">
        A shared group wallet: <b>one Universal Account</b>, and every member gets their own
        <b> EIP-7702 spending limit</b>. It feels like a normal money app.
      </p>
      <span className={`${chip} mt-6 bg-[var(--lime)]`}>UXmaxx · Universal Accounts (7702)</span>
    </div>
  ),
  // 2 — Problem
  () => (
    <div>
      <Eyebrow>The problem</Eyebrow>
      <H>Group money is everywhere.<br />On-chain, it&apos;s a mess.</H>
      <p className="mt-6 max-w-2xl text-lg font-medium text-[var(--ink)]/80">
        Patungan, arisan, a shared trip, a household pot — all still run on group chats, spreadsheets,
        and manual transfers. Crypto has the pieces to fix this, but <b>every product is single-user.</b>
      </p>
      <div className="mt-8 neo rounded-2xl bg-[var(--pink)] p-5 text-lg font-black text-black">
        Nobody has built the shared, multi-user account — exactly where per-member limits become essential.
      </div>
    </div>
  ),
  // 3 — Solution
  () => (
    <div>
      <Eyebrow>The solution</Eyebrow>
      <H>One shared account.<br />Real per-person limits.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[["🫙", "One balance", "A single Universal Account across every chain — top up from anywhere."],
          ["🔒", "Per-member caps", "Each member's limit is an owner-signed 7702 grant — real crypto."],
          ["✨", "Feels like Web2", "Google login, no gas, no seed phrase, no chain to pick."]].map(([e, t, d]) => (
          <div key={t} className="neo rounded-2xl bg-[var(--panel)] p-5">
            <div className="text-3xl">{e}</div>
            <p className="mt-2 text-xl font-black">{t}</p>
            <p className="mt-1 text-sm font-medium text-black/70">{d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 4 — How 7702 works
  () => (
    <div>
      <Eyebrow>How it uses EIP-7702 (the 30%)</Eyebrow>
      <H>The account <span className="bg-[var(--yellow)] px-1">is</span> 7702.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="neo rounded-2xl bg-[var(--blue)] p-5 text-black">
          <p className="text-xl font-black">Upgraded in place</p>
          <p className="mt-2 font-medium">The owner&apos;s Magic EOA becomes a Universal Account — no new address, no smart-account deploy. That one account holds the cross-chain balance.</p>
        </div>
        <div className="neo rounded-2xl bg-[var(--green)] p-5 text-black">
          <p className="text-xl font-black">Caps are signed grants</p>
          <p className="mt-2 font-medium">Each member&apos;s cap is an owner-signed EIP-712 / 7702 permission, verified on every spend — bound to the pot owner, so nobody can forge one.</p>
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-[var(--ink)]/60">Honest note: the Particle UA is single-owner, so caps are enforced app-side — real crypto, app-level authorization. We don&apos;t overclaim on-chain enforcement on the UA.</p>
    </div>
  ),
  // 5 — Proof wall
  () => (
    <div>
      <Eyebrow>Not a mockup</Eyebrow>
      <H><span className="bg-[var(--green)] px-1">Seven</span> things settled on-chain.</H>
      <p className="mt-3 font-medium text-[var(--ink)]/70">Most teams don&apos;t have one. Click any to verify.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {PROOFS.map((p) => (
          <a key={p.tx} href={(p.exp ?? ARB) + p.tx} target="_blank" rel="noopener noreferrer" className="neo-btn rounded-xl bg-[var(--panel)] p-4 text-black">
            <span className={`${chip}`} style={{ background: p.c }}>{p.chain}</span>
            <p className="mt-2 font-black">{p.t}</p>
            <p className="mt-1 font-mono text-xs font-bold text-[var(--ink)]/60">{p.tx.slice(0, 8)}…{p.tx.slice(-4)} ↗</p>
          </a>
        ))}
      </div>
    </div>
  ),
  // 6 — Features
  () => (
    <div>
      <Eyebrow>Gotong royong, as a primitive</Eyebrow>
      <H>Everyday shared-money rituals, on-chain.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[["🎲", "Arisan", "Rotating savings circle with a verifiable fair draw nobody can rig."],
          ["🧾", "Split & settle", "Nets who-owes-whom down to the fewest transfers."],
          ["🕶️", "Private receive", "One-time stealth addresses — auto-swept into the pot on-chain."],
          ["🤖", "Agent wallet", "A capped 7702 key pays via x402 but can't drain the pot."],
          ["📈", "Earn", "Idle balance supplied into Aave v3 — one tap from liquid."],
          ["@", "Pay by handle", "Shareable pot links + QR. Never a raw address."]].map(([e, t, d]) => (
          <div key={t} className="neo-sm rounded-xl bg-[var(--panel)] p-4">
            <div className="text-2xl">{e}</div>
            <p className="mt-1 font-black">{t}</p>
            <p className="mt-1 text-sm font-medium text-black/70">{d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 7 — Partners
  () => (
    <div>
      <Eyebrow>Built with — all five, for real</Eyebrow>
      <H>Every partner is a real integration.</H>
      <div className="mt-8 flex flex-col gap-3">
        {PARTNERS.map((p) => (
          <div key={p.n} className="neo-sm flex items-center gap-4 rounded-xl bg-[var(--panel)] p-4">
            <span className="neo-flat grid h-12 w-28 shrink-0 place-items-center rounded-lg text-sm font-black" style={{ background: p.c }}>{p.n}</span>
            <p className="text-sm font-semibold text-black/80">{p.d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 8 — Honest edge
  () => (
    <div>
      <Eyebrow>The honest edge</Eyebrow>
      <H>Survives a judge&apos;s follow-up.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="neo rounded-2xl bg-[var(--green)] p-5 text-black">
          <p className="text-lg font-black">✓ Real</p>
          <p className="mt-2 text-sm font-medium">7 on-chain txs. Every mechanism (7702, x402, sweep, Aave) settles on-chain. 73 tests.</p>
        </div>
        <div className="neo rounded-2xl bg-[var(--yellow)] p-5 text-black">
          <p className="text-lg font-black">◐ Demo mode</p>
          <p className="mt-2 text-sm font-medium">The live site runs keyless so judges try it without a wallet. Magic login is wired + verified.</p>
        </div>
        <div className="neo rounded-2xl bg-[var(--panel)] p-5 text-black">
          <p className="text-lg font-black">○ Needs funds</p>
          <p className="mt-2 text-sm font-medium">A cross-chain SRA deposit is one command away — it just needs source funds on Base.</p>
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-[var(--ink)]/60">We never claim what we can&apos;t show. That&apos;s the whole pitch.</p>
    </div>
  ),
  // 9 — Cross-chain
  () => (
    <div>
      <Eyebrow>Cross-chain, honestly</Eyebrow>
      <H>Bugged upstream — so we shipped a rail that works.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="neo rounded-2xl bg-[var(--pink)] p-5 text-black">
          <p className="text-xl font-black">Particle v2 is bugged</p>
          <p className="mt-2 font-medium">Its 7702 cross-chain balance check counts only the destination chain — reproduced, and corroborated by other teams in the Discord. Not our code.</p>
        </div>
        <div className="neo rounded-2xl bg-[var(--purple)] p-5 text-black">
          <p className="text-xl font-black">ZeroDev SRA works</p>
          <p className="mt-2 font-medium">A registered Smart Routing Address for the pot (routes from Base/Optimism → Arbitrum). Deposit harness is one command from a live settlement.</p>
        </div>
      </div>
    </div>
  ),
  // 10 — Why we win
  () => (
    <div>
      <Eyebrow>Why this wins</Eyebrow>
      <H>UX that hides the chain, on a real 7702 account.</H>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[["Prominent 7702 (30%)", "The account itself is EIP-7702; caps are owner-signed grants. Proven on-chain."],
          ["UX (40%)", "Google login, one balance, zero thought about chains or gas. WCAG-AA, mobile-first."],
          ["White space", "Particle's ecosystem has no multi-user account. We own that gap."],
          ["Regional fit", "Arisan + gotong royong put a real cultural ritual on-chain."]].map(([t, d]) => (
          <div key={t} className="neo-sm rounded-xl bg-[var(--panel)] p-5">
            <p className="text-xl font-black">{t}</p>
            <p className="mt-2 text-sm font-medium text-black/70">{d}</p>
          </div>
        ))}
      </div>
    </div>
  ),
  // 11 — Ask / CTA
  () => (
    <div className="text-center">
      <Eyebrow>The ask</Eyebrow>
      <h2 className="text-5xl font-black tracking-tight">Money, together.</h2>
      <p className="mx-auto mt-5 max-w-xl text-lg font-semibold text-[var(--ink)]/80">
        Universal Accounts Track · Arbitrum &amp; Magic bonuses. A shared balance, real per-person limits,
        real privacy — no gas, no chains, no seed phrases.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/app" className="neo-btn rounded-lg bg-[var(--yellow)] px-6 py-3 text-black">Open the app →</Link>
        <a href="https://github.com/PugarHuda/bareng" target="_blank" rel="noopener noreferrer" className="neo-btn rounded-lg bg-[var(--panel)] px-6 py-3 text-black">GitHub ↗</a>
        <Link href="/" className="neo-btn rounded-lg bg-[var(--panel)] px-6 py-3 text-black">Landing →</Link>
      </div>
    </div>
  ),
];

export default function Deck() {
  const [i, setI] = useState(0);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, n]);

  return (
    <main className="relative flex min-h-dvh flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3 text-sm font-black">
        <Link href="/" className="flex items-center gap-2">
          <span className="neo-flat grid h-7 w-7 place-items-center rounded-md bg-[var(--yellow)] text-sm font-black">B</span>
          Bareng
        </Link>
        <span className="tabular-nums text-[var(--ink)]/60">{i + 1} / {n}</span>
      </div>

      {/* slide */}
      <section className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-4">
        <div key={i} className="neo-rise w-full">{SLIDES[i]()}</div>
      </section>

      {/* click zones (desktop): left third = prev, right two-thirds = next */}
      <button aria-label="Previous slide" onClick={() => go(-1)} className="absolute left-0 top-16 bottom-16 w-1/4 cursor-w-resize opacity-0" />
      <button aria-label="Next slide" onClick={() => go(1)} className="absolute right-0 top-16 bottom-16 w-1/4 cursor-e-resize opacity-0" />

      {/* controls */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <button onClick={() => go(-1)} disabled={i === 0} className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm text-black disabled:opacity-40">← Prev</button>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {SLIDES.map((_, k) => (
            <button key={k} aria-label={`Go to slide ${k + 1}`} onClick={() => setI(k)}
              className={`h-3 w-3 rounded-full border-2 border-black transition ${k === i ? "bg-black" : "bg-transparent"}`} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={i === n - 1} className="neo-btn rounded-lg bg-[var(--blue)] px-4 py-2 text-sm text-black disabled:opacity-40">Next →</button>
      </div>
    </main>
  );
}
