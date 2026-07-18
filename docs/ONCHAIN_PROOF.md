# On-chain proof runbook — ✅ DONE

## ✅ RESULT (2026-07-18) — gap closed
A real shared-Universal-Account spend settled on **Arbitrum One**:

- **txHash:** [`0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7)
- **block** 485190402 · **status** SUCCESS · settled via **EntryPoint 4337 v0.7** (`0x5FF1…2789`)
- Sender = the UA `0x14eB…a22c` · 0.01 USDC · gas paid from the UA's USDC balance.
- The EIP-7702 first-tx authorization was **handled by Particle's infra** — plain
  `sendTransaction(tx, signature)` (2 args) was accepted; no 3rd-arg authorization needed.
- `npm run prove:onchain` now auto-polls `getTransaction` and prints the txHash + Arbiscan link.

The rest of this file is the original runbook, kept for reference.

---

The single most valuable thing left *was*: **one real transaction hash.** This turned that from a
vague to-do into one command.

## Why this matters
A judge asking "show me a real tx" is the fastest way to expose a scaffolded submission. One
settled UA transfer on Arbitrum answers it. `scripts/prove-onchain.mjs` reuses the exact
`lib/universalAccount.ts` the app uses, so it's the right starting point — **but it has never
touched the network.** Treat the first run as debugging, not a guaranteed green: expect to
iterate on the 7702 authorization (below), the signer contract, and the response shape.

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
