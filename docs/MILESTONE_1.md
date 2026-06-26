# Milestone 1 — Project outline (due Jun 29, 23:59)

**Project:** Bareng — money, together
**Track:** Universal Accounts (EIP-7702) · stacking Arbitrum bounty + Magic Labs bonus
**Builder:** Pugar Huda Mantoro (open to teammates)
**Repo:** local (Next.js 16 app, builds clean, `npm test` 14/14)

## One-liner
A shared group wallet: one Universal Account holds a single cross-chain balance, and each
member gets their own spending limit via an EIP-7702 session key. Gotong royong, onchain —
and it feels like a normal money app.

## Problem
Group money is broken both ways. Web2 (Splitwise, joint accounts) is easy but custodial,
fiat-locked, and can't give someone a wallet that *only* spends $50/week. Web3 (multisigs)
has real onchain limits but brutal UX — every member needs a wallet, gas, the right chain,
and signs everything. Nobody normal uses it.

## Solution
Bareng takes the ease of the first and the onchain limits of the second, and hides every
chain / gas / seed-phrase detail:
1. **Login** with Google/email (Magic) → seedless EOA.
2. That EOA becomes a **Particle Universal Account in EIP-7702 mode** → one balance, any chain.
3. **Invite members by @handle**; each gets a 7702 session key scoped to a weekly cap.
4. **Top up** from any token on any chain; **spend** within your cap → **settles on Arbitrum**,
   no gas/bridge UI.
5. **Private receive/payout** via one-time stealth addresses (ERC-5564) so the pot's UA
   stays unlinkable on-chain.

## How we use the tech (real primitives)
- **Particle Universal Accounts SDK** — chain-abstracted balance + cross-chain settle (core).
- **EIP-7702** — EOA upgraded in place; per-member session-key spend caps (the differentiator).
- **Magic** — embedded wallet + social login (onboarding + signer).
- **Arbitrum** — invisible backend settlement layer.
- **ERC-5564 stealth addresses** — our `@noble`-based implementation for private money flow.

See `docs/INTEGRATION.md` for the honest depth breakdown.

## Built so far
- Per-member weekly spend limits (pure + tested), @handles + shareable links, ERC-5564
  stealth derivation (tested against real `@noble` v3), Magic login wired to the UA + a real
  cross-chain spend path. Dashboard, admin (invite + set limit), and private-receive screens.
- `npm install` clean · `npm test` 14/14 · `next build` clean · routes `/ /admin /receive`.

## Next (post-keys)
1. Add Particle + Magic keys → go live.
2. **Confirm 7702-mode init + move per-member limits to on-chain session keys** (Office
   Hours, Jun 29) — the key to the "prominent 7702 use" score.
3. Cross-chain top-up demo (fund on a non-Arbitrum chain → settle on Arbitrum).

## Why it wins
White space: Particle's ecosystem has no shared/multi-user account product (UniversalX, MYX,
Overtime, etc. are all single-user). Bareng owns that gap, scores on UX (40%) and prominent
7702 use (30%), and stacks Arbitrum ($2k) + Magic ($500).
