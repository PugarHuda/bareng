# Architecture — the honest account model

Written after a hard look at whether the pieces actually compose. They don't all compose the
way earlier docs implied. This is the truthful version; other docs now defer to it.

## The one account: a single-owner Particle Universal Account

The pot **is one Particle Universal Account**, owned by one EOA (the organizer's Magic wallet),
running in **EIP-7702 mode** (the EOA acts as the account in place — real Particle capability).
It holds the cross-chain unified balance and settles on Arbitrum.

The UA SDK surface is small and single-owner:
`createTransferTransaction` → `sendTransaction(tx, ownerSignature, authorizations?)`. **There is
no session-key, policy, delegation, or spend-limit API in the UA SDK.** One owner signs; that's it.

## What this means for per-member caps (the honest tiering)

| Layer | Reality |
|---|---|
| **App-side cap** (`lib/limits.ts`) | ✅ Real, pure, tested. The running enforcement today. |
| **Owner-signed grant** (`lib/sessionKey.ts`) | ✅ Real EIP-712 crypto. An **app-level authorization** the app verifies — it is the exact payload a 7702 session key *would* carry, but the Particle UA does not consume it on-chain. |
| **On-chain enforcement on the UA** | ❌ **Not available.** The UA SDK exposes no session-key primitive, so the chain cannot refuse a member's over-limit tx *through the UA*. Earlier docs overclaimed this. |

## Where ZeroDev and x402 honestly sit

They are **standalone, working reference implementations**, not composed into the Particle UA:

- **`lib/zerodev.ts`** — a real ZeroDev Kernel7702 permission validator whose call-policy caps
  `USDC.transfer ≤ limit`. It is a **working reference implementation** of on-chain 7702
  enforcement (built + unit-tested, but not yet executed on-chain — see the on-chain-proof gap)
  and targets the ZeroDev bounty. It does **not** enforce anything on the Particle UA — ZeroDev's kernel is a
  *different* account. To get real on-chain per-member caps you would make the pot a **ZeroDev
  kernel account instead of a Particle UA**, trading away UA's cross-chain unified balance.
- **`lib/x402.ts` / `/agent`** — demonstrates that a 7702-capped key is a safe agent wallet,
  bounded by `chargeWithinCap`. The settlement (drawing from the pot balance) is not wired to
  either account system; the `pay` step is abstracted.

## The decision (recommended before finale)

**Keep Particle UA as the spine** — the cross-chain unified balance + social login is the whole
UX thesis (40%), and it's real. Present the 7702 story truthfully:

> The account itself is EIP-7702 (Particle UA in 7702 mode). Per-member caps are **owner-signed
> grants, enforced app-side today**; `lib/zerodev.ts` is a **working reference** for moving that
> enforcement on-chain once the UA exposes session keys — or if a pot opts into a ZeroDev kernel.

This is defensible under a judge's follow-up. The collapsed claim ("ZeroDev enforces the cap on
the UA") is not — don't say it on stage.

## Open at Office Hours
1. Does/will the Particle UA SDK expose a **session-key / delegation** primitive that consumes an
   owner-signed grant on-chain? (Would close the gap natively.)
2. ~~Confirm the exact **7702-mode init**~~ — **RESOLVED:** a real spend settled on Arbitrum with
   plain 2-arg `sendTransaction`; Particle handles the first-tx authorization server-side.
3. Bounty **stacking** rules — since ZeroDev/Openfort are reference demos, not UA-composed.
