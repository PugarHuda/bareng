# Bareng — money, together

> One shared Universal Account. Each member gets a spending limit via an **EIP-7702 session key**.
> Top up from any token on any chain, spend, and **settle on Arbitrum** — no gas, no seed phrase.

UXmaxx Hackathon submission. **Main track: Universal Accounts (EIP-7702).**
**▶ Live demo:** [bareng-jade.vercel.app](https://bareng-jade.vercel.app) (runs keyless — no wallet needed) ·
**🖥️ Pitch deck:** [`/deck`](https://bareng-jade.vercel.app/deck) (keyboard-navigable).

**✅ Proven on-chain — 7 real artifacts** (every partner mechanism settles on-chain, not a mockup):

| # | What | Where | Tx |
|---|---|---|---|
| 1 | Shared-UA spend | Arbitrum | [`0x40a4722a…`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7) |
| 2 | 7702 cap enforced (ZeroDev Kernel7702) | Sepolia | [`0x73ad50…`](https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036) |
| 3 | Aave v3 DeFi supply (approve+supply) | Arbitrum | [`0x7b5698c0…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad) |
| 4 | x402 agent payment (EIP-3009) | Arbitrum | [`0x4870c99a…`](https://arbiscan.io/tx/0x4870c99abff9c1e2aeaec80ca39df1e25f78fc5ba3195cd0d6b9fad14f3ad67e) |
| 5 | Private stealth sweep (gasless EIP-3009) | Arbitrum | [`0xb338f36d…`](https://arbiscan.io/tx/0xb338f36d10db2af93df49db33181c469c6ea552e782618fe25e78ac92e7f3ebe) |
| 6 | Dashboard receipts (×4, real settlements) | Arbitrum | [`0x4a5d673b…`](https://arbiscan.io/tx/0x4a5d673b7bc109372a68264d83888124749338e21f58b97eb814faae3d0176e1) |
| 7 | Cross-chain rail (ZeroDev SRA, registered) | Arbitrum | [`0x0b72F6cD…`](https://arbiscan.io/address/0x0b72F6cD65c80CD9003128746B42c7dAe738D895) |

Runs on Particle UA SDK **v2.0.3**. Uses all five featured partners — Particle, Magic, Arbitrum as the
real core; ZeroDev (SRA + Kernel7702 cap) and Openfort/x402 (real EIP-3009 handshake, settled) as real
integrations + bounty targets. **Read `docs/ARCHITECTURE.md` for the honest account model** (the UA is
single-owner; per-member caps are owner-signed + app-side, not chain-enforced on the UA — don't
overclaim that; ZeroDev/x402 don't compose into the UA, but every one is a real, tested, on-chain-settled
mechanism).

**Docs:** [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`INTEGRATION.md`](docs/INTEGRATION.md) ·
[`DEMO.md`](docs/DEMO.md) · [`ONCHAIN_PROOF.md`](docs/ONCHAIN_PROOF.md) ·
[`SUBMISSION.md`](docs/SUBMISSION.md) · [`WORKSHOP_NOTES.md`](docs/WORKSHOP_NOTES.md) · [`SECURITY.md`](SECURITY.md)

> _"Bareng"_ is Indonesian for _"together"_ — the product is a shared group wallet that
> puts the spirit of **gotong royong** (communal cooperation) onchain.

## Why this wins

- **Prominent 7702 use (30%):** the account itself is EIP-7702 (Universal Account in 7702 mode);
  per-member caps are owner-signed 7702 grants, with a working ZeroDev reference for on-chain
  enforcement (`lib/zerodev.ts`).
- **UX (40%):** Google login, one balance, zero thought about chains or gas. Keyboard-focusable,
  reduced-motion-aware.
- **Cross-chain requirement:** top up on Base/Polygon → settle on Arbitrum via Universal Accounts.
- **White space:** Particle's ecosystem has no shared / multi-user account product — everything
  is single-user (UniversalX, MYX, Overtime, etc.). Bareng owns that gap.
- **Gotong royong as a primitive (not just a wallet):** **arisan** (rotating savings circle with a
  *verifiable fair draw*), **split-the-bill / settle-up** (debt netting → fewest transfers), and
  **transparent group receipts** with a "where the pot goes" breakdown — everyday shared-money
  rituals, on-chain. Scan-to-join and scan-to-pay QR for the phone-first flow.

## Run

```bash
npm install
cp .env.example .env.local   # fill in Particle + Magic keys
npm run dev                  # http://localhost:3000
npm test                     # checks the limit logic (no keys/network needed)
```

The UI runs with mock data even without keys — the limit logic (`lib/limits.ts`) is real;
only the on-chain call is stubbed.

## Code map

| File | What it does | Status |
|---|---|---|
| `lib/limits.ts` | Per-member spend cap (pure, money path) | ✅ done + tested |
| `lib/sessionKey.ts` | Owner-signed EIP-712 7702 spend-cap grant | ✅ done + tested |
| `lib/bareng.ts` | Glue: shared account + `spend()` (grant + cap gate) | ✅ done + tested |
| `lib/handles.ts` | Username handles + shareable pot links (pay/join by @handle) | ✅ done + tested |
| `lib/stealth.ts` | Stealth addresses (ERC-5564) for private receive/payout | ✅ done + tested |
| `lib/arisan.ts` | Arisan/ROSCA — rotating savings circle (trustless, fair rotation) | ✅ done + tested |
| `lib/draw.ts` | Verifiable fair draw (keccak-seeded) — provably-fair Arisan order | ✅ done + tested |
| `lib/settle.ts` | Split-the-bill / settle-up — debt netting, fewest transfers | ✅ done + tested |
| `lib/qr.ts` | QR codes (join pot / scan-to-pay one-time address) | ✅ done |
| `lib/receipts.ts` | Transparent group receipts (tagged, auditable spends) | ✅ done + tested |
| `lib/insights.ts` | "Where the pot goes" — spend aggregated by category / member | ✅ done + tested |
| `lib/yield.ts` | Idle-balance yield → Aave v3 approve+supply batch (via UA) | ✅ done + tested |
| `lib/zerodev.ts` | ZeroDev Kernel7702 spend-cap call-policy (standalone reference) | ✅ proven on Sepolia |
| `lib/x402.ts` | x402 flow: 402 → pay → retry, bounded by the cap | ✅ done + tested |
| `lib/x402pay.ts` | **Real** x402 payment: EIP-3009 `transferWithAuthorization` sign + verify | ✅ done + tested (5) |
| `app/api/x402/route.ts` | **Real x402 endpoint** — 402, then verifies the signed payment → 200 | ✅ verified e2e (402→sign→200; tampered→402) |
| `scripts/prove-x402.mjs` | **x402 settled on-chain** — UA broadcasts EIP-3009 transferWithAuthorization | ✅ **settled** ([tx `0x4870c9…`](https://arbiscan.io/tx/0x4870c99abff9c1e2aeaec80ca39df1e25f78fc5ba3195cd0d6b9fad14f3ad67e)) |
| `scripts/prove-sweep.mjs` | **Stealth sweep settled on-chain** — private receive auto-swept into the pot | ✅ **settled** ([tx `0xb338f3…`](https://arbiscan.io/tx/0xb338f36d10db2af93df49db33181c469c6ea552e782618fe25e78ac92e7f3ebe)) |
| `lib/sweep.ts` | Stealth-sweep detection + **gasless EIP-3009 sweep authorization** (Openfort) | ✅ done + tested (4) |
| `lib/magic.ts` | Google/email login (Magic) → EOA + signer | 🟡 needs `NEXT_PUBLIC_MAGIC_KEY` |
| `lib/universalAccount.ts` | UA init + cross-chain transfer (Arbitrum) | ✅ proven on-chain |
| `app/page.tsx` | Landing page (neobrutalism — hero, 6-card proof wall, features, CTA) | ✅ runs visually |
| `app/deck/page.tsx` | **Pitch deck** (`/deck`) — 11 keyboard-navigable neobrutalism slides | ✅ QA'd (nav, dots, mobile) |
| `app/app/page.tsx` | Dashboard (balance, members, pay-by-handle, receipts, top-up) | ✅ runs visually |
| `app/admin/page.tsx` | Invite by @handle + sign the 7702 grant | ✅ runs visually |
| `app/agent/page.tsx` | x402 agent wallet — hits the real `/api/x402`, signs EIP-3009, cap-bounded | ✅ real handshake, runs live |
| `app/receive/page.tsx` | Private receive — live one-time stealth addresses | ✅ runs visually |
| `app/earn/page.tsx` | Earn on idle balance — builds the **real** Aave v3 approve+supply batch | ✅ real batch shown · same one settled ([tx `0x7b56…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad)) |
| `app/arisan/page.tsx` | Arisan — rotating savings circle + verifiable fair draw | ✅ runs visually |
| `app/split/page.tsx` | Split & settle up — debt netting to fewest UA transfers | ✅ runs visually |
| `scripts/prove-onchain.mjs` | On-chain UA spend harness — **proven, settled a real tx** | ✅ done |
| `scripts/prove-aave.mjs` | UA Aave v3 supply (real DeFi call, Arbitrum) | ✅ **settled** ([tx `0x7b5698c0…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad)) |
| `scripts/prove-crosschain.mjs` | Cross-chain harness (USDC Arbitrum→Base) | 🟡 ready · needs ~$3–4 |
| `scripts/prove-zerodev-sepolia.mjs` | ZeroDev cap enforced on-chain (Sepolia, gasless) | ✅ over-cap **rejected**, within-cap **settled** ([tx `0x73ad50…`](https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036)) |
| `scripts/prove-sra.mjs` | ZeroDev **Smart Routing Address** — the pot's cross-chain deposit rail | ✅ **created + registered** (`0x0b72F6cD…`, 3 routes → Arbitrum) · shown in the pot card |
| `scripts/seed-receipts.mjs` | Seeds the dashboard feed with **real** UA settlements (self-transfers) | ✅ **4/4 settled** on Arbitrum · each receipt links to Arbiscan |
| `scripts/prove-sra-deposit.mjs` | **End-to-end cross-chain deposit** via the SRA (deposit + monitor + recover) | ✅ built · validated live (SRA verified, status/preflight work) · 🟡 one command from a settled cross-chain tx — needs ~1 USDC + gas on Base/Optimism |

`npm test` → **73 passing** (pure logic + money path). `next build` clean · **neobrutalism** UI ·
routes `/` (landing) `/deck` (pitch) `/app` (dashboard) `/admin /agent /receive /earn /arisan /split` ·
`/api/x402` (real x402 endpoint) · custom error + 404 boundaries. **QA:** a 38-case Playwright sweep
(outcome assertions + adversarial inputs + responsive + a11y) passes clean; it caught and we fixed a
real double-click double-spend (re-entrancy guarded with a ref, not lagging React state).

### Borrowed from PIVY (Sui Overflow 2025 payment-track winner)

Two layers, both built:

1. **@handles + shareable links** (PIVY's UX win) — pay/join by `@handle`, never a raw
   address. The "no wallet doxxing" feel with no cryptography.
2. **Stealth addresses (ERC-5564)** for private money movement: receiving from *outside*
   the pot, and paying *out* to a member's personal address, both via fresh one-time
   addresses so the pot's Universal Account stays unlinkable on-chain. Real secp256k1
   derivation via audited `@noble` libs — `npm test` proves the recipient recovers the
   controlling key and a stranger cannot.

## Status

Every partner mechanism that can settle on-chain **does** (7 artifacts above). x402 is a real
EIP-3009 handshake settled on-chain; the stealth sweep is a real gasless EIP-3009 sweep settled
on-chain; `/earn` builds the real Aave v3 batch; the ZeroDev SRA cross-chain rail is registered. Magic
login is wired + verified. 73 unit tests + a Playwright QA sweep, all green.

**The one remaining on-chain step** is a *settled* cross-chain deposit — blocked only by source funds
on another chain (all funds are Arbitrum-only). The harness is one command away:
`npm run prove:sra-deposit base 1` fires the moment `~1 USDC` + a little gas lands on Base/Optimism at
the owner EOA. Also open: record the demo video (shot-list in `docs/SUBMISSION_ANSWERS.md`).

**Known upstream issue:** Particle v2.0.3's UA cross-chain balance check is bugged (counts only the
destination chain for 7702 accounts) — reproduced, corroborated in the hackathon Discord. We route
cross-chain through the ZeroDev SRA instead.

## On-chain proof harnesses

`npm run prove:onchain` · `prove:aave` · `prove:zerodev` · `prove:x402` · `prove:sweep` · `prove:sra` ·
`prove:sra-deposit` — each settles or registers a real artifact (see the table up top).

## Deadlines

- **Jun 29, 23:59** — Milestone 1: project outline + team + idea
- **Jul 5, 23:59** — Milestone 2: mid-hackathon checkpoint
- **Jul 30, 16:00** — Finale & live pitch

> Pitch line: _"We put **gotong royong** onchain — one shared balance, real spending limits,
> zero crypto friction."_
