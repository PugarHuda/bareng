# On-chain proof runbook — close gap #1 before the finale

The single most valuable thing left: **one real transaction hash.** Everything is scaffolded
and demo-mode; nothing has settled on-chain. This turns that from a vague to-do into one
command. Do this the moment you have Particle keys.

## Why this matters
A judge asking "show me a real tx" is the fastest way to expose a scaffolded submission. One
settled UA transfer on Arbitrum answers it — and because `scripts/prove-onchain.mjs` reuses the
exact `lib/universalAccount.ts` the app uses, a green run means the live UI path is real too.

## Prereqs (the part that needs you)
1. Particle keys in `.env.local` (`NEXT_PUBLIC_PARTICLE_PROJECT_ID/_CLIENT_KEY/_APP_ID`).
2. `OWNER_PRIVATE_KEY` in `.env.local` — a **throwaway** EOA that owns the pot UA.
   Fund it with a little **USDC on Arbitrum** (≈$1) and a few cents of ETH for gas
   (or rely on the UA paymaster if your Particle project sponsors gas).

## Run it
```bash
npm run prove:onchain                 # self-transfer 0.01 USDC (safe smoke test)
npm run prove:onchain 0xRecipient 0.5 # pay someone 0.5 USDC
```
Success prints `✓ Sent. transactionId: 0x…`. Screenshot that **and** the settled tx on Arbiscan.

## If it fails on "7702 authorization"
The first tx per chain in 7702 mode needs an EIP-7702 authorization (`sendTransaction`'s 3rd
arg, `authorizations?: EIP7702Authorization[]`). That exact API is the **one documented unknown**
(`docs/ARCHITECTURE.md`, open `ponytail:` in `lib/universalAccount.ts`). Confirm it at Particle
Office Hours, add the authorization, re-run. Everything else in the path is already wired.

## Then prove it in the UI (for the demo video)
1. `npm run dev` → the login card replaces the demo banner.
2. **Continue with Google** (Magic) → owner EOA → Universal Account.
3. Do a spend on the dashboard → it routes through the UA and settles on Arbitrum.
4. Record the screen with the tx confirming. That clip is your submission's proof.

## Definition of done for gap #1
- [ ] `npm run prove:onchain` prints a real `transactionId`.
- [ ] Tx visible/settled on Arbiscan.
- [ ] One UI spend recorded on video with the real settlement.
