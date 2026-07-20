# Bareng — money, together

> One shared Universal Account. Each member gets a spending limit via an **EIP-7702 session key**.
> Top up from any token on any chain, spend, and **settle on Arbitrum** — no gas, no seed phrase.

UXmaxx Hackathon submission. **Main track: Universal Accounts (EIP-7702).**
**▶ Live demo:** [bareng-jade.vercel.app](https://bareng-jade.vercel.app) (runs keyless — no wallet needed).
**✅ Proven on-chain (3 artifacts):** (1) a real shared-UA spend settled on Arbitrum One —
[tx `0x40a4722a…d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7);
(2) the per-member **7702 cap enforced on-chain** via ZeroDev Kernel7702 — over-cap
**rejected at validation**, within-cap **settled on Sepolia**
[tx `0x73ad50…b34036`](https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036);
(3) a real **DeFi contract call** — the UA supplied USDC into **Aave v3 on Arbitrum** (approve+supply
batched, 7702-delegated in place), [tx `0x7b5698c0…606dad`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad).
Runs on Particle UA SDK **v2.0.3** (the supported version; v1.1.1's contract-call path had a bug).
Uses all five featured partners — Particle, Magic, Arbitrum as the real core; ZeroDev and
Openfort/x402 as working reference impls + bounty targets. **Read `docs/ARCHITECTURE.md` for the
honest account model** (the UA is single-owner; per-member caps are owner-signed + app-side, not
chain-enforced on the UA — don't overclaim that).

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
| `lib/x402.ts` | x402 agent payments bounded by the cap (reference) | ✅ tested · gated |
| `lib/sweep.ts` | Stealth-sweep detection + ready-to-broadcast sweep tx (Openfort) | ✅ done + tested |
| `lib/magic.ts` | Google/email login (Magic) → EOA + signer | 🟡 needs `NEXT_PUBLIC_MAGIC_KEY` |
| `lib/universalAccount.ts` | UA init + cross-chain transfer (Arbitrum) | ✅ proven on-chain |
| `app/page.tsx` | Landing page (neobrutalism — hero, on-chain proofs, features, CTA) | ✅ runs visually |
| `app/app/page.tsx` | Dashboard (balance, members, pay-by-handle, receipts, top-up) | ✅ runs visually |
| `app/admin/page.tsx` | Invite by @handle + sign the 7702 grant | ✅ runs visually |
| `app/agent/page.tsx` | x402 agent wallet bounded by the cap | ✅ runs visually |
| `app/receive/page.tsx` | Private receive — live one-time stealth addresses | ✅ runs visually |
| `app/earn/page.tsx` | Earn on idle balance (Aave v3, keep-liquid slider) | ✅ runs visually |
| `app/arisan/page.tsx` | Arisan — rotating savings circle + verifiable fair draw | ✅ runs visually |
| `app/split/page.tsx` | Split & settle up — debt netting to fewest UA transfers | ✅ runs visually |
| `scripts/prove-onchain.mjs` | On-chain UA spend harness — **proven, settled a real tx** | ✅ done |
| `scripts/prove-aave.mjs` | UA Aave v3 supply (real DeFi call, Arbitrum) | ✅ **settled** ([tx `0x7b5698c0…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad)) |
| `scripts/prove-crosschain.mjs` | Cross-chain harness (USDC Arbitrum→Base) | 🟡 ready · needs ~$3–4 |
| `scripts/prove-zerodev-sepolia.mjs` | ZeroDev cap enforced on-chain (Sepolia, gasless) | ✅ over-cap **rejected**, within-cap **settled** ([tx `0x73ad50…`](https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036)) |
| `scripts/prove-sra.mjs` | ZeroDev **Smart Routing Address** — the pot's cross-chain deposit rail | ✅ **created + registered** (`0x0b72F6cD…`, 3 routes → Arbitrum) · shown in the pot card |
| `scripts/seed-receipts.mjs` | Seeds the dashboard feed with **real** UA settlements (self-transfers) | ✅ **4/4 settled** on Arbitrum · each receipt links to Arbiscan |

`npm test` → 66 passing (pure logic + money path). `next build` clean · **neobrutalism** UI · routes `/` (landing) `/app` (dashboard) `/admin /agent /receive /earn /arisan /split` · custom error + 404 boundaries.

### Borrowed from PIVY (Sui Overflow 2025 payment-track winner)

Two layers, both built:

1. **@handles + shareable links** (PIVY's UX win) — pay/join by `@handle`, never a raw
   address. The "no wallet doxxing" feel with no cryptography.
2. **Stealth addresses (ERC-5564)** for private money movement: receiving from *outside*
   the pot, and paying *out* to a member's personal address, both via fresh one-time
   addresses so the pot's Universal Account stays unlinkable on-chain. Real secp256k1
   derivation via audited `@noble` libs — `npm test` proves the recipient recovers the
   controlling key and a stranger cannot.

## To do (in priority order)

1. ✅ **DONE — a real UA spend settled on Arbitrum One.** `npm run prove:onchain` sent 0.01 USDC
   from the shared Universal Account; tx
   [`0x40a4722a…d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7)
   (block 485190402, SUCCESS, via EntryPoint 4337 v0.7). The UA is no longer just wired — it spends
   on-chain. See `docs/ONCHAIN_PROOF.md`.
2. **Add keys** to `.env.local` (Particle + Magic) → the login → UA → spend path goes live.
3. **Particle Office Hours:** the EIP-7702 first-tx authorization is **resolved** (on v2.0.3 an
   undelegated EOA's first tx signs the auth as `sendTransaction`'s 3rd arg; delegated → 2-arg). Still worth asking:
   whether the UA exposes native session keys (would close the on-chain-cap gap).
4. Wire the stealth sweep tx (detection is done in `lib/sweep.ts`) and real cross-chain top-up
   (the dashboard button is currently a labeled demo).
5. Record a demo video; confirm Milestone 2 status + submission format.

## Deadlines

- **Jun 29, 23:59** — Milestone 1: project outline + team + idea
- **Jul 5, 23:59** — Milestone 2: mid-hackathon checkpoint
- **Jul 30, 16:00** — Finale & live pitch

> Pitch line: _"We put **gotong royong** onchain — one shared balance, real spending limits,
> zero crypto friction."_
