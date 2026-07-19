# Submission readiness — UXmaxx finale (Jul 30, 2026)

What's done, what's on you, and how to take Bareng live. Pitch script is in `DEMO.md`;
integration depth in `INTEGRATION.md`.

## Status at a glance
- ✅ **Live:** https://bareng-jade.vercel.app (public, demo mode) · repo https://github.com/PugarHuda/bareng
- ✅ Builds clean (`next build`), typechecks (`tsc`), tests pass (`npm test`, 46/46).
- ✅ Runs in demo mode with no keys — all six routes (`/`, `/admin`, `/agent`, `/receive`, `/earn`, `/arisan`) serve.
- ✅ **Proven on-chain** — `prove:onchain` settled a real shared-UA spend on Arbitrum One:
  [tx `0x40a4722a…d50f7`](https://arbiscan.io/tx/0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7).
- ✅ Core spine, real + coherent: **Particle** UA (single-owner, chain-abstracted balance,
  7702 mode + Arbitrum settle), **Magic** (social login → EOA/signer), **Arbitrum** (settlement).
- 🟡 **ZeroDev** + **Openfort/x402** are working **reference implementations + bounty targets**,
  NOT composed into the UA (the UA has no session-key API) — see `docs/ARCHITECTURE.md`. Present
  them honestly as such; don't claim they enforce caps on the UA.
- 🟡 Live on-chain path needs API keys (below) — code is wired, it flips on when keys exist.

## Go live — the part that needs YOU (keys)
1. Copy env: `cp .env.example .env.local`.
2. Fill it in:
   - **Particle** — https://dashboard.particle.network → `NEXT_PUBLIC_PARTICLE_PROJECT_ID`,
     `_CLIENT_KEY`, `_APP_ID`.
   - **Magic** — https://dashboard.magic.link → publishable key → `NEXT_PUBLIC_MAGIC_KEY`.
   - **ZeroDev** — https://dashboard.zerodev.app → bundler/paymaster RPC → `NEXT_PUBLIC_ZERODEV_RPC`.
   - **Openfort** — https://dashboard.openfort.io → x402 facilitator URL → `NEXT_PUBLIC_OPENFORT_FACILITATOR`.
3. `npm run dev` → the login card replaces the "Demo mode" banner; **Continue with Google**
   now mints a real Magic wallet → Universal Account, and a spend settles on Arbitrum.
4. To run an interactive login yourself in this session, type: `! npm run dev`

## Confirm at Particle/ZeroDev Office Hours (the only open questions)
1. ~~**7702-mode init** / first-tx authorization~~ — **RESOLVED by preflight.** A real
   `sendTransaction(tx, signature)` against the funded-keys UA was accepted by Particle's infra
   (only failed on "insufficient balance for gas"); the EIP-7702 authorization is handled
   server-side, no 3rd arg needed. No longer an open question.
2. **Composition** — does the ZeroDev Kernel7702 `regular` permission validator compose with
   the Particle UA? `createMemberKernel` currently casts the options (`lib/zerodev.ts`).
3. **Bounty stacking** — does the ZeroDev bounty stack with the UA track? Exact per-partner
   prize amounts live on the Encode dashboard (public total: $15.5K).

## Pre-finale checklist
- [x] Particle keys valid; `prove:onchain` preflighted (init→build→sign→send all pass).
- [x] **Proven one on-chain tx:** UA funded, `prove:onchain` settled 0.01 USDC on Arbitrum One —
  tx `0x40a4722a3fc52590465576743df759c644a207317763b5e6a9c5cc88c77d50f7` (block 485190402, SUCCESS,
  via EntryPoint 4337 v0.7). The headline gap is closed.
- [ ] Real cross-chain proof: top up from a non-Arbitrum chain → show it settle on Arbitrum.
- [ ] Rehearse the `DEMO.md` flow to ~2–3 min; land the "over limit is refused — owner-signed
  7702 cap, verified" beat (app-side enforcement; don't say the UA enforces it on-chain).
- [ ] Submission form: repo link, demo video/screens, the five-partner story, team.
- [ ] One "why it wins" slide: UX (40%) + prominent 7702 (30%) + the multi-user white space.

## The architecture reality (read `docs/ARCHITECTURE.md` before pitching)
The Particle UA is **single-owner with no on-chain session-key API**. So per-member caps are
owner-signed grants enforced **app-side**, not chain-enforced on the UA. ZeroDev/x402 are
standalone reference impls. The honest, winning story leans on **UX (40%) + the 7702 account +
cross-chain balance** — all real — not on chain-enforced per-member caps. **Before finale, prove
ONE real on-chain spend end-to-end (one tx hash) — that beats five scaffolded integrations.**
Harness `npm run prove:onchain` (runbook in `docs/ONCHAIN_PROOF.md`) is **network-tested against
real Particle keys** — the full path runs; it just needs the UA deposit to settle.

## Known ceilings (say them if asked — they read as intent, not gaps)
- On-chain cap is **per-transaction** (ZeroDev call-policy); the **rolling weekly total** is
  app-side (`lib/limits.ts`) — ZeroDev has no cumulative-token-per-period policy.
- Handle registry + demo clock are in-memory (`lib/handles.ts`, fixed `NOW`) — fine for the
  demo; upgrade paths are noted in the code.
