# Submission form — final, paste-ready answers

Copy each field into the UXmaxx form. Everything here survives a judge follow-up (see
`ARCHITECTURE.md`). Trim to the form's length limits as needed.

---

## Track
**Main track: Universal Accounts Track** (built prominently on Particle Universal Accounts in
EIP-7702 mode + Magic wallet). Also pursuing the **Arbitrum ($2000)** and **Magic Labs ($500)**
bonus challenges.
*(Alternative if you'd rather hedge the cross-chain requirement: General Track + ZeroDev SRA
subtrack — we have a real, registered Smart Routing Address. See "Cross-chain" below.)*

## Project name
**Bareng** — Indonesian for "together".

## Tagline (one line)
A shared group wallet: one Universal Account, one cross-chain balance, and every member gets their
own spending limit. Gotong royong, onchain — no chains, no gas, no seed phrase.

## Elevator pitch (2–3 sentences)
Group money — patungan, arisan, a shared trip, a household pot — still runs on group chats,
spreadsheets, and manual transfers. Crypto already has the infrastructure to fix this, but every
product in the ecosystem is single-user. Bareng is the shared, multi-user account: a Particle
Universal Account (EIP-7702) holds one cross-chain balance, each member has an owner-signed 7702
spending limit, and it feels like a normal money app.

## The problem
Shared money is universal (Indonesia has arisan and patungan; everyone splits bills and runs group
funds) but on-chain it's clumsy: separate wallets, manual bridging, gas tokens, seed phrases. And
nobody has built the *multi-user* account — which is exactly where per-member limits stop being
decorative and become essential.

## What it does
- **One shared Universal Account, one balance across chains.** Top up from any token on any chain;
  spends settle on **Arbitrum**. The user never picks a chain or holds gas.
- **Per-member spend caps** as **owner-signed EIP-712 / EIP-7702 grants** — real cryptographic
  authorization, verified on every spend and bound to the pot owner (a member can't forge one).
- **Pay by @handle**, not addresses. Shareable pot links + QR to join or pay.
- **Arisan** (rotating savings circle) with a **verifiable fair draw** — who collects the pot first
  is derived from a public seed anyone can recompute, so it can't be rigged.
- **Split & settle up** — nets who-owes-whom down to the fewest transfers.
- **Transparent receipts** + a live "where the pot goes" breakdown.
- **Private receive** — one-time stealth addresses (ERC-5564) keep the pot unlinkable.
- **Cross-chain deposit rail** — a ZeroDev Smart Routing Address: send USDC to one address from any
  chain and it lands in the pot on Arbitrum.

## How it uses Universal Accounts + EIP-7702 (the 30% criterion)
The account **is** EIP-7702: the owner's Magic EOA is upgraded in place into a Universal Account —
no new address, no smart-account deployment. That single account holds the cross-chain unified
balance (the whole product depends on it) and every spend settles through it. Per-member caps are
owner-signed 7702 grants (`lib/sessionKey.ts`). A real shared-UA spend settled on Arbitrum:
[`0x40a4722a…d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7).

## Cross-chain (honest)
The UA is chain-abstracted by design — the app's "deposit / top up from any chain → unified on
Arbitrum" flow shows it. A *settled* cross-chain UA transfer is blocked by a **Particle v2.0.3 bug**,
not our code: delivering 0.3 USDC to Base while the UA holds 1.12 on Arbitrum still returns
"Insufficient primary token balance" (v2 counts only destination-chain holdings for 7702 accounts —
reproduced by other teams in the hackathon Discord). So we also shipped a **working** cross-chain
rail: a real, registered **ZeroDev Smart Routing Address** for the pot
(`0x0b72F6cD65c80CD9003128746B42c7dAe738D895`, routes from Base/Optimism/Arbitrum → the pot).

## Tech / integrations (all five partners)
- **Particle Universal Accounts** (core) — UA in EIP-7702 mode, cross-chain unified balance, Arbitrum settle.
- **Magic** (core) — Google/email login mints the seedless EOA that owns the account; wired + verified end-to-end (OAuth reaches Google consent, returns a wallet).
- **Arbitrum** (core) — every spend settles here; a real UA spend + a real Aave v3 supply settled on Arbitrum One.
- **ZeroDev** — Kernel7702 spend-cap call-policy (proven on Sepolia) + Smart Routing Address (working cross-chain deposit).
- **Openfort / x402** — a 7702-capped key as a safe x402 agent wallet (`/agent`).
- Stack: Next.js 16 · React 19 · TypeScript · viem + ethers · 66 unit tests on the money paths · neobrutalism UI, keyless demo.

## On-chain proof (verify on the explorers)
1. **Shared-UA spend** — Arbitrum One, [`0x40a4722a…d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7)
2. **Per-member 7702 cap enforced** — ZeroDev Kernel7702 on Sepolia (over-cap rejected at validation, within-cap settled), [`0x73ad508a…`](https://sepolia.etherscan.io/tx/0x73ad508a14d435a652ebb402de5bc25a4748a43d20700e48a80239b14db34036)
3. **UA DeFi contract call** — Aave v3 supply on Arbitrum, [`0x7b5698c0…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad)
4. **ZeroDev SRA** — registered cross-chain deposit address `0x0b72F6cD65c80CD9003128746B42c7dAe738D895`

## Links
- **Live demo:** https://bareng-jade.vercel.app (runs keyless — no wallet needed)
- **Code:** https://github.com/PugarHuda/bareng
- **Pitch page:** https://claude.ai/code/artifact/087c0710-fe26-402f-b3d1-41211ebe6065
- **Demo video:** _[paste your recording — follow the shot-list in SUBMISSION_ANSWERS.md]_

## Honest note (say it before a judge asks)
The mechanisms are real and three transactions have settled on-chain; the deployed site runs in
**demo mode (keyless)** so judges can try it without a wallet, and the live Magic path is wired +
verified. Per-member caps are owner-signed and enforced app-side (the Particle UA is single-owner
with no on-chain session-key API — confirmed by Particle's own devrel). We don't claim on-chain
per-member enforcement on the UA. This honesty survives follow-up; the collapsed claim doesn't.

## Team
Pugar Huda Mantoro. _(add teammates if any)_

---

## Bonus challenge answers

### Arbitrum "Road to Open House London" ($2000)
Bareng feels like a consumer money app; **Arbitrum is the invisible backend**. Users log in with
Google (no MetaMask, no seed phrase), see one balance, and spend by @handle — every spend settles on
**Arbitrum One** (real txs: UA spend `0x40a4…`, Aave supply `0x7b56…`). No wallet, gas, bridge, or
chain choice is ever surfaced. Walletless onboarding + account abstraction (EIP-7702) + Arbitrum as
the settlement layer = a consumer product that just happens to run onchain.

### Magic Labs ($500)
Onboarding is **"Continue with Google" → a wallet, instantly** — no MetaMask, no seed phrase. Magic's
embedded wallet mints the seedless EOA that becomes the user's Universal Account (`lib/magic.ts`,
`@magic-ext/oauth2`). Verified end-to-end: the OAuth flow reaches Google's consent and returns a
wallet; a fresh account's first spend signs its EIP-7702 authorization inline (magic-sdk v33 supports
chainId 0 — no pre-delegation, no ETH). Accessible (WCAG-AA contrast, keyboard-navigable) and
mobile-first. It feels like a modern consumer app, not a crypto app.
