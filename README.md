# Bareng — money, together

> One shared Universal Account. Each member gets a spending limit via an **EIP-7702 session key**.
> Top up from any token on any chain, spend, and **settle on Arbitrum** — no gas, no seed phrase.

UXmaxx Hackathon submission. **Main track: Universal Accounts (EIP-7702).**
Stacking: Arbitrum bounty ($2k) + Magic Labs bonus ($500).

> _"Bareng"_ is Indonesian for _"together"_ — the product is a shared group wallet that
> puts the spirit of **gotong royong** (communal cooperation) onchain.

## Why this wins

- **Prominent 7702 use (30%):** per-member session keys with spend caps — the 7702
  capability almost nobody actually ships.
- **UX (40%):** Google login, one balance, zero thought about chains or gas.
- **Cross-chain requirement:** top up on Base/Polygon → settle on Arbitrum via Universal Accounts.
- **White space:** Particle's ecosystem has no shared / multi-user account product — everything
  is single-user (UniversalX, MYX, Overtime, etc.). Bareng owns that gap.

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
| `lib/handles.ts` | Username handles + shareable pot links (pay/join by @handle) | ✅ done + tested |
| `lib/stealth.ts` | Stealth addresses (ERC-5564) for private receive/payout | ✅ done + tested |
| `lib/magic.ts` | Google/email login (Magic) → EOA | 🟡 needs `NEXT_PUBLIC_MAGIC_KEY` |
| `lib/universalAccount.ts` | UA init + cross-chain transfer (Arbitrum) | 🟡 needs Particle keys |
| `lib/bareng.ts` | Glue: shared account + spend() | ✅ |
| `app/page.tsx` | Dashboard (balance, members, limit-aware spend) | ✅ runs visually |
| `app/admin/page.tsx` | Invite members by @handle + set weekly limit | ✅ runs visually |
| `app/receive/page.tsx` | Private receive — live one-time stealth addresses | ✅ runs visually |

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

1. **Add keys** to `.env.local` (Particle + Magic) — the login → UA → spend path is already
   wired (`lib/session.ts`, `app/page.tsx`); it goes live the moment keys are present.
2. **Particle Office Hours (Jun 29):** confirm the **EIP-7702 mode** flag on `UniversalAccount`
   and how per-member session keys work (native UA vs. a ZeroDev layer). Only open question.
3. Add a real payee input (spend currently settles to the signed-in address as a self-test).
4. Connect the stealth sweep: announce on-chain + sweep the one-time address into the UA
   (same `sendShared` flow).
5. Demo: top up from a non-Arbitrum chain → show it settle on Arbitrum (cross-chain proof).

## Deadlines

- **Jun 29, 23:59** — Milestone 1: project outline + team + idea
- **Jul 5, 23:59** — Milestone 2: mid-hackathon checkpoint
- **Jul 30, 16:00** — Finale & live pitch

> Pitch line: _"We put **gotong royong** onchain — one shared balance, real spending limits,
> zero crypto friction."_
