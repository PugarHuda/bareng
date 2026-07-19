# Submission — ready-to-paste answers + recording shot-list

Copy these into the UXmaxx submission form. All claims here are honest and survive a judge
follow-up (see `ARCHITECTURE.md`). Links live at the bottom.

## Project name
**Bareng** — Indonesian for "together".

## One-liner
A shared group wallet: one Universal Account, one cross-chain balance, and each member gets their
own spending limit via an EIP-7702 session key. Gotong royong, onchain.

## The problem
Group money — patungan (chip-ins), arisan (rotating savings), shared trips, a household pot — runs
on group chats, spreadsheets, and manual transfers. Crypto already has the infrastructure to fix
this (chain-abstracted balances, account abstraction, 7702), but every product in the ecosystem is
**single-user**. Nobody has built the shared, multi-user account — which is exactly where per-member
limits stop being decorative and become essential.

## What it does
- **One shared Universal Account** holds a single balance across chains. Top up from any token on
  any chain; it lands as one balance and spends settle on **Arbitrum** — the user never picks a
  chain or holds gas.
- **Per-member spend caps** as **owner-signed EIP-712 / EIP-7702 grants** — real cryptographic
  authorization, verified on every spend (and bound to the pot owner, so no member can forge one).
- **Pay by @handle**, not addresses. Shareable pot links + **QR** to join or pay.
- **Arisan** (rotating savings circle) with a **verifiable fair draw** — who collects the pot first
  is derived from a public seed anyone can recompute, so it can't be rigged.
- **Split & settle up** — log who fronted what; it nets down to the fewest transfers.
- **Transparent receipts** with a live "where the pot goes" category breakdown.
- **Private receive** — one-time stealth addresses (ERC-5564) keep the pot unlinkable on-chain.
- **Capped agent wallet** — a member's 7702-capped key doubles as an x402 agent that pays
  per-request but physically can't exceed the cap.

## Partners used (all five — framed honestly)
- **Particle · Universal Accounts** *(core)* — the account runs in **EIP-7702 mode** and holds the
  cross-chain unified balance. This is the spine; a shared pot is impossible without it.
- **Magic** *(core)* — Google/email login mints the seedless EOA that owns the account and signs.
- **Arbitrum** *(core)* — every spend settles here. **A real shared-UA spend has settled on
  Arbitrum One** (tx below).
- **ZeroDev · Kernel7702** *(reference)* — a working Kernel7702 call-policy (`USDC.transfer ≤ cap`)
  showing the path to chain-enforced caps. **Standalone reference — a different account from the
  UA; it does not enforce on the UA itself.**
- **Openfort · x402** *(reference)* — the capped key as a safe agent wallet. Cap guard is real +
  tested; settlement is abstracted.

## Honest architecture note (say it before a judge asks)
The Particle UA is **single-owner with no on-chain session-key API**, so per-member caps are
**owner-signed grants enforced app-side** — real crypto, app-level authorization. We do **not**
claim ZeroDev/x402 enforce caps on the UA. The win is UX + the 7702 account + the real cross-chain
balance — all real.

## On-chain proof — THREE settled artifacts
1. **Shared-UA spend** on Arbitrum One — `0x40a4722a…d50f7` (block 485190402, SUCCESS, EntryPoint
   v0.7). https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7
2. **7702 cap enforced on-chain** (ZeroDev Kernel7702, Sepolia) — over-cap rejected at validation,
   within-cap settled `0x73ad508a…b34036`. https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036
3. **Real DeFi contract call** — the UA supplied USDC into **Aave v3 on Arbitrum** (approve+supply
   batched, EOA 7702-delegated in place) — `0x7b5698c0…606dad` (block 485521607, SUCCESS, 12 logs).
   https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad

Built on Particle UA SDK **v2.0.3** (the supported version). Confirmed on the hackathon Discord that
per-member spend rules can't be *universally* enforced on-chain in the UA path — matching our honest
architecture (caps are owner-signed + app-side; ZeroDev shows the chain-enforced path standalone).

## Tech
Next.js 16 · React 19 · TypeScript · viem + ethers · Particle Universal Account SDK · Magic SDK ·
ZeroDev SDK. **66 unit tests** on the money paths; `next build` clean; runs keyless in demo mode.

## Links
- **Live demo:** https://bareng-jade.vercel.app (runs keyless — no wallet needed)
- **Code:** https://github.com/PugarHuda/bareng
- **Pitch page:** https://claude.ai/code/artifact/087c0710-fe26-402f-b3d1-41211ebe6065
- **On-chain proof:** the Arbiscan link above

---

## Recording shot-list (≈2–3 min, follows DEMO.md)
Record `bareng-jade.vercel.app` in demo mode. ~15s per beat.

1. **Dashboard** — pot @lunchsquad, balance + **Rp** line. Tap the green **✓ settled on Arbitrum**
   badge → Arbiscan. Line: *"a real spend already settled on-chain."*
2. **Where the pot goes** — point at the category breakdown. *"Transparent shared money."*
3. **Pay @dewi $30** as @budi → settles, remaining drops. *"Pay by handle."*
4. **@sari → drag to $60 → Over limit**, blocked. *"Owner-signed 7702 cap, verified."*
5. **Top up from Base +$50** → *"funds enter on any chain, land as one balance."*
6. **Share / QR** → scan-to-join.
7. **/split** — add an expense → *"nets to the fewest transfers."*
8. **/arisan** — tap **🎲 Fair draw** → *"provably-fair order."* Then pay in → one collects. *"Arisan,
   trustless on-chain — gotong royong itself."*
9. **/receive** — Generate ×2 (two different one-time addresses + scan-to-pay QR) → Verify ✓.
10. **/agent** — 402 → pays within cap → 200; over cap → refused before paying.
11. **/earn** — keep-liquid slider → yield projection.
Close: *"One shared balance, real per-person limits, real privacy — no gas, no chains, no seed phrases."*
