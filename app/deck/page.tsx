"use client";

// Pitch deck at /deck — a keyboard-navigable, neobrutalism slide deck. ←/→ or space, click zones,
// or the dots. Content is the real project: 7 on-chain artifacts and all five partners.

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
// Neobrutalism box for the architecture diagram: hard offset shadow drawn as a second rect,
// matching the .neo CSS the rest of the deck uses.
const DBox = ({ x, y, w, h, fill }: { x: number; y: number; w: number; h: number; fill: string }) => (
  <>
    <rect x={x + 6} y={y + 6} width={w} height={h} rx="12" fill="#111" />
    <rect x={x} y={y} width={w} height={h} rx="12" fill={fill} stroke="#111" strokeWidth="3" />
  </>
);
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
  // 3 — Live demo (the recorded walkthrough, so the pitch never leaves the deck)
  // The deck remounts the slide on every change (key={i}), so autoPlay restarts it from 0 on
  // arrival and unmounting stops it — no play/pause state to keep in sync.
  () => (
    <div>
      <Eyebrow>Live demo · 79 seconds</Eyebrow>
      {/* Breaks out of the deck's max-w-4xl: at max-w-4xl on a 1080p projector the recorded UI
          downscales past legibility. Capped by height so it still fits above the deck chrome. */}
      <div className="relative z-10 mx-[calc(50%-45vw)] w-[90vw] max-w-[1240px] neo overflow-hidden rounded-2xl bg-black">
        {/* Not muted: the clip carries its own voiceover, and the presenter stays silent over it.
            Chrome allows sound-on autoplay once the page has user activation, which arriving here
            by keypress provides. If a browser still blocks it the clip sits paused on frame 0 with
            its controls showing, which is recoverable with one click — unlike muting, which would
            play a silent video while the presenter waits for narration that never comes. */}
        <video
          src="/live-demo.mp4"
          autoPlay
          playsInline
          controls
          className="mx-auto block max-h-[66vh] w-full object-contain"
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {["1 · Pay by @handle", "2 · The 7702 cap refuses", "3 · Arisan fair draw", "4 · Split · Receive · Earn · Agent"].map((t) => (
          <span key={t} className={`${chip} bg-[var(--lime)]`}>{t}</span>
        ))}
      </div>
    </div>
  ),
  // 4 — Solution
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
  // 5 — How 7702 works
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
    </div>
  ),
  // 6 — Proof wall
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
  // 7 — Features
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
  // 8 — Partners
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
  // 9 — How it works
  // Replaced a "why this wins" slide that graded itself against the judging rubric. This one is
  // also the prop to open when a judge asks where the cap actually lives.
  () => (
    <div>
      <Eyebrow>How it works</Eyebrow>
      <H>One account. <span className="bg-[var(--yellow)] px-1 [box-decoration-break:clone]">No member holds a key.</span></H>
      {/* Same breakout as the demo slide: at max-w-4xl the diagram wastes half a 1080p projector,
          and this is the slide to open when a judge asks where the cap lives. */}
      <svg
        viewBox="0 0 940 360"
        className="mt-6 mx-[calc(50%-45vw)] max-h-[46vh] w-[90vw] max-w-[1240px]"
        role="img"
        aria-label="Members send owner-signed 7702 grants to one Universal Account, which settles on Arbitrum. A Smart Routing Address feeds it from other chains."
      >
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#111" />
          </marker>
        </defs>

        {/* members */}
        {[["@budi", 24], ["@sari", 80], ["@dewi", 136]].map(([label, y]) => (
          <g key={label as string}>
            <DBox x={8} y={y as number} w={140} h={44} fill="var(--blue)" />
            <text x={78} y={(y as number) + 29} textAnchor="middle" fontSize="21" fontWeight="800" fill="#111">{label}</text>
          </g>
        ))}

        {/* grant arrow */}
        <line x1={158} y1={102} x2={318} y2={102} stroke="#111" strokeWidth="3" markerEnd="url(#ah)" />
        <text x={238} y={70} textAnchor="middle" fontSize="19" fontWeight="800" fill="#111">owner-signed</text>
        <text x={238} y={90} textAnchor="middle" fontSize="19" fontWeight="800" fill="#111">7702 grant</text>
        <text x={238} y={140} textAnchor="middle" fontSize="15" fontWeight="700" fill="#111" opacity="0.72">cap · token · period</text>

        {/* the account */}
        <DBox x={330} y={26} w={270} h={152} fill="var(--yellow)" />
        <text x={465} y={62} textAnchor="middle" fontSize="15" fontWeight="800" fill="#111" opacity="0.7">ONE</text>
        <text x={465} y={95} textAnchor="middle" fontSize="26" fontWeight="900" fill="#111">Universal Account</text>
        <text x={465} y={126} textAnchor="middle" fontSize="16" fontWeight="700" fill="#111">EIP-7702, upgraded in place</text>
        <text x={465} y={152} textAnchor="middle" fontSize="16" fontWeight="700" fill="#111" opacity="0.72">holds the cross-chain balance</text>

        {/* settlement */}
        <line x1={610} y1={102} x2={678} y2={102} stroke="#111" strokeWidth="3" markerEnd="url(#ah)" />
        <text x={644} y={86} textAnchor="middle" fontSize="15" fontWeight="800" fill="#111">settles</text>
        <DBox x={690} y={68} w={240} h={70} fill="var(--green)" />
        <text x={810} y={112} textAnchor="middle" fontSize="26" fontWeight="900" fill="#111">ARBITRUM</text>

        {/* cross-chain deposits */}
        <DBox x={30} y={266} w={230} h={56} fill="var(--panel)" />
        <text x={145} y={300} textAnchor="middle" fontSize="18" fontWeight="800" fill="#111">Base · Optimism</text>
        <line x1={270} y1={294} x2={318} y2={294} stroke="#111" strokeWidth="3" markerEnd="url(#ah)" />
        <DBox x={330} y={266} w={270} h={56} fill="var(--purple)" />
        <text x={465} y={300} textAnchor="middle" fontSize="19" fontWeight="800" fill="#111">Smart Routing Address</text>
        <line x1={465} y1={260} x2={465} y2={192} stroke="#111" strokeWidth="3" markerEnd="url(#ah)" />
      </svg>
      <p className="mt-4 text-base font-bold text-[var(--ink)]/80">
        Members hold no key. The owner&apos;s key signs every settlement, and the grant is what authorizes it.
      </p>
    </div>
  ),
  // 10 — Ask / CTA
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
  const [full, setFull] = useState(false);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((x) => Math.max(0, Math.min(n - 1, x + d))), [n]);

  // Real fullscreen, not just F11: a presenter remote sends arrow keys, not F11, and browser
  // chrome stays visible in some setups. Track the event rather than our own click, so pressing
  // Escape (which we never see as a keydown here) still flips the label back.
  const toggleFull = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const onFs = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setI(0);
      else if (e.key === "End") setI(n - 1);
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFull(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, n, toggleFull]);

  return (
    <main className="relative flex min-h-dvh flex-col">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3 text-sm font-black">
        <Link href="/" className="flex items-center gap-2">
          <span className="neo-flat grid h-7 w-7 place-items-center rounded-md bg-[var(--yellow)] text-sm font-black">B</span>
          Bareng
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFull}
            aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
            title="Fullscreen (F)"
            className="neo-btn rounded-lg bg-[var(--panel)] px-3 py-1 text-xs text-black"
          >
            {full ? "✕ Exit" : "⛶ Fullscreen"}
          </button>
          <span className="tabular-nums text-[var(--ink)]/60">{i + 1} / {n}</span>
        </div>
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
