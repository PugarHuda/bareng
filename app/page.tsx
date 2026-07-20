import Link from "next/link";

const ARB = "https://arbiscan.io/tx/";
const SEP = "https://sepolia.etherscan.io/tx/";

const ADDR = "https://arbiscan.io/address/";

const PROOFS = [
  { color: "var(--green)", label: "Shared-UA spend", chain: "Arbitrum One", hash: "0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7", short: "0x40a4…d50f7", url: ARB },
  { color: "var(--blue)", label: "7702 cap enforced", chain: "Sepolia", hash: "0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036", short: "0x73ad…b34036", url: SEP },
  { color: "var(--pink)", label: "Aave v3 DeFi lend", chain: "Arbitrum One", hash: "0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad", short: "0x7b56…606dad", url: ARB },
  { color: "var(--orange)", label: "x402 agent payment", chain: "Arbitrum One", hash: "0x4870c99abff9c1e2aeaec80ca39df1e25f78fc5ba3195cd0d6b9fad14f3ad67e", short: "0x4870…d67e", url: ARB },
  { color: "var(--yellow)", label: "Private stealth sweep", chain: "Arbitrum One", hash: "0xb338f36d10db2af93df49db33181c469c6ea552e782618fe25e78ac92e7f3ebe", short: "0xb338…3ebe", url: ARB },
  { color: "var(--purple)", label: "Cross-chain rail", chain: "ZeroDev SRA", hash: "0x0b72F6cD65c80CD9003128746B42c7dAe738D895", short: "0x0b72…D895", url: ADDR },
];

const FEATURES = [
  { c: "var(--yellow)", emoji: "🫙", t: "One shared pot", d: "A single Universal Account holds one balance across every chain. Top up from anywhere, spend from one purse." },
  { c: "var(--blue)", emoji: "🔒", t: "Per-member caps", d: "Each member's spend limit is a real owner-signed EIP-7702 grant — verified crypto, not an app promise." },
  { c: "var(--pink)", emoji: "🎲", t: "Arisan", d: "Indonesia's rotating savings circle, trustless — with a verifiable fair draw nobody can rig." },
  { c: "var(--green)", emoji: "🧾", t: "Split & settle up", d: "Log who fronted what; it nets down to the fewest transfers, settled through the shared account." },
  { c: "var(--purple)", emoji: "🕶️", t: "Private receive", d: "Every payment lands on a fresh one-time stealth address — the pot stays unlinkable on-chain." },
  { c: "var(--orange)", emoji: "🤖", t: "Agent wallet", d: "A capped 7702 key doubles as an x402 agent that pays per-request but physically can't drain the pot." },
];

const PARTNERS = ["Particle", "Magic", "Arbitrum", "ZeroDev", "Openfort"];

export default function Landing() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
      {/* Nav */}
      <nav className="neo-sm mb-8 flex items-center justify-between rounded-xl bg-[var(--panel)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="neo-flat grid h-9 w-9 place-items-center rounded-lg bg-[var(--yellow)] text-lg font-black">B</span>
          <span className="text-xl font-black tracking-tight">Bareng</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/deck" className="neo-btn rounded-lg bg-[var(--panel)] px-4 py-2 text-sm text-black">Pitch ↗</Link>
          <Link href="/app" className="neo-btn rounded-lg bg-[var(--blue)] px-4 py-2 text-sm text-black">Open app →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="grid gap-6 md:grid-cols-[1.3fr_1fr] md:items-center">
        <div className="neo-rise">
          <span className="neo-tag inline-block rounded-md bg-[var(--lime)] px-2 py-1 text-xs">UXmaxx · Universal Accounts (7702)</span>
          <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Money,<br />
            <span className="bg-[var(--pink)] px-1 [box-decoration-break:clone]">together.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg font-medium text-[var(--ink)]/80">
            A shared group wallet: <b>one Universal Account, one cross-chain balance</b>, and every member
            gets their own spending limit. It feels like a normal money app — no chains, no gas, no seed phrase.
          </p>
          <p className="mt-2 max-w-md text-sm font-semibold text-[var(--ink)]/60">
            <i>Bareng</i> = &ldquo;together&rdquo; in Indonesian. Gotong royong, onchain.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="neo-btn rounded-lg bg-[var(--yellow)] px-5 py-3 text-black">Open the app →</Link>
            <a href={ARB + PROOFS[0].hash} target="_blank" rel="noopener noreferrer" className="neo-btn rounded-lg bg-[var(--panel)] px-5 py-3 text-black">
              ✓ See it on-chain ↗
            </a>
          </div>
        </div>
        {/* Hero card — the pot */}
        <div className="neo neo-rise rotate-1 rounded-2xl bg-[var(--panel)] p-5" style={{ animationDelay: "0.12s" }}>
          <p className="neo-label text-xs text-[var(--ink)]/60">Group pot · @lunchsquad</p>
          <p className="mt-2 text-4xl font-black">$420.00</p>
          <p className="text-sm font-bold text-[var(--ink)]/60">≈ Rp 6.846.000</p>
          <div className="mt-4 flex flex-col gap-2">
            {[["@budi", "$100/wk", "var(--green)"], ["@sari", "$50/wk", "var(--blue)"], ["@dewi", "$25/wk", "var(--pink)"]].map(([h, cap, c]) => (
              <div key={h} className="neo-sm flex items-center justify-between rounded-lg px-3 py-2" style={{ background: c as string }}>
                <span className="font-black text-black">{h}</span>
                <span className="neo-tag rounded bg-[var(--panel)] px-2 py-0.5 text-[10px]">{cap}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="mt-14">
        <h2 className="text-2xl font-black tracking-tight">Not a mockup — <span className="bg-[var(--green)] px-1">proven on-chain</span></h2>
        <p className="mt-1 font-medium text-[var(--ink)]/70">Five real transactions settled, plus a live cross-chain deposit rail. Click any to verify on the explorer.</p>
        <div className="neo-stagger mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROOFS.map((p) => (
            <a key={p.hash} href={p.url + p.hash} target="_blank" rel="noopener noreferrer" className="neo-btn rounded-xl bg-[var(--panel)] p-4 text-black">
              <span className="neo-tag inline-block rounded px-2 py-0.5 text-[10px]" style={{ background: p.color }}>{p.chain}</span>
              <p className="mt-2 text-base font-black">{p.label}</p>
              <p className="mt-1 font-mono text-xs font-bold text-[var(--ink)]/60">{p.short} ↗</p>
            </a>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mt-14">
        <h2 className="text-2xl font-black tracking-tight">Gotong royong, as a primitive</h2>
        <div className="neo-stagger mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="neo rounded-xl p-4" style={{ background: f.c }}>
              <div className="neo-flat grid h-11 w-11 place-items-center rounded-lg bg-[var(--panel)] text-xl">{f.emoji}</div>
              <p className="mt-3 text-lg font-black text-black">{f.t}</p>
              <p className="mt-1 text-sm font-medium text-black/80">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="mt-14">
        <div className="neo rounded-2xl bg-[var(--purple)] p-6">
          <p className="neo-label text-sm text-black/70">Built with — all five, used for real</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {PARTNERS.map((p) => (
              <span key={p} className="neo-sm rounded-lg bg-[var(--panel)] px-4 py-2 text-base font-black">{p}</span>
            ))}
          </div>
          <p className="mt-4 max-w-2xl text-sm font-semibold text-black/70">
            Particle Universal Accounts + Magic login + Arbitrum settlement are the real core. ZeroDev &amp;
            Openfort/x402 are working reference implementations. Per-member caps are owner-signed &amp;
            app-side — we don&apos;t overclaim on-chain enforcement on the UA.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14">
        <div className="neo -rotate-1 rounded-2xl bg-[var(--yellow)] p-8 text-center">
          <h2 className="text-3xl font-black tracking-tight text-black">Try it — no wallet needed.</h2>
          <p className="mt-2 font-bold text-black/70">The demo runs keyless. One balance, real limits, real privacy.</p>
          <Link href="/app" className="neo-btn mt-5 inline-block rounded-lg bg-[var(--panel)] px-6 py-3 text-black">Open the app →</Link>
        </div>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t-[3px] border-black pt-5 pb-8 text-sm font-bold">
        <span>Bareng — money, together</span>
        <a href="https://github.com/PugarHuda/bareng" target="_blank" rel="noopener noreferrer" className="underline decoration-[3px]">GitHub ↗</a>
      </footer>
    </main>
  );
}
