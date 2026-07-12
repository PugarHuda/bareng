# Integration depth — what we actually use

Honest map of how deep each partner integration goes, and whether we use their
real primitives or just touch the surface.

## Depth tiers
- **Core** — the app cannot exist without it; it's on the critical path of the demo.
- **Functional** — real SDK calls, real flow, but not the differentiator.
- **Surface** — init only / decorative. (We have none of these on purpose.)

## Partner primitives

### 1. Particle — Universal Accounts SDK · **Core**
Real primitive: `UniversalAccount`, `createTransferTransaction`, `sendTransaction`,
`CHAIN_ID.ARBITRUM_MAINNET_ONE` (`lib/universalAccount.ts`).
- **Chain abstraction (unified balance + cross-chain settle):** this IS their core
  primitive and it's the spine of Bareng — a shared pot with one balance across chains
  is impossible without it. Top up on any chain, spend, settle on Arbitrum.
- **EIP-7702 mode:** the SDK calls are real; the explicit 7702-mode enablement (EOA
  upgraded in place) is the documented capability we target. **Status: confirm the exact
  7702-mode init at Particle Office Hours (Jun 29).**
- **Per-member session keys (the 30% "prominent 7702 use" criterion):** each member has a
  real session key (`createSessionKey`) and an **owner-signed EIP-712 `SpendPermission`**
  binding that key to a cap + period (`lib/sessionKey.ts`, real ethers signing, tested). A
  spend is refused unless the owner genuinely signed that member's cap (`lib/bareng.ts`).
  This is the exact authorization payload a 7702 session key delegates — so the cap is
  cryptographically real now, not an app-side promise. **On-chain enforcement is built**
  (`lib/zerodev.ts`): each member's session key is a **ZeroDev Kernel7702 permission
  validator** whose `toCallPolicy` allows exactly one action — `USDC.transfer` with
  `amount <= cap` — so the *chain* refuses an over-limit tx. Gated behind
  `NEXT_PUBLIC_ZERODEV_RPC` like the other SDKs; pure policy shape is tested. This also
  targets a **4th bounty (ZeroDev)** on the same build. Open question for Office Hours:
  does the ZeroDev validator compose with the Particle UA, and does the bounty stack?

  ### 1b. ZeroDev — Kernel7702 session-key validator · **Core (on-chain 7702 enforcement)**
  Real primitives: `createKernelAccount` (7702), `toPermissionValidator`, `toCallPolicy`,
  `toECDSASigner` (`lib/zerodev.ts`). This is what makes the 30% "prominent 7702 use" claim
  enforced by the chain, not asserted. Per-tx cap is on-chain; the rolling weekly total stays
  app-side (`lib/limits.ts`) — ZeroDev has no cumulative-token-per-period policy.

### 2. Magic — Embedded wallet · **Core (onboarding + signer)**
Real primitive: `magic-sdk` + `@magic-ext/oauth2` (`lib/magic.ts`). Google/email login →
EOA → signs the UA transaction rootHash. This is genuine use of their embedded-wallet +
social-login primitive (targets the Magic bonus).

### 3. Arbitrum — Settlement layer · **Core (backend)**
We settle every spend on `ARBITRUM_MAINNET_ONE` via the UA. This is exactly the bounty's
"Arbitrum as the invisible backend settlement layer" pattern — the user never sees it.

### 4. Stealth addresses (ERC-5564) · **Functional (our code, public standard)**
Not a partner primitive — our own implementation of the EIP via audited `@noble` secp256k1
(`lib/stealth.ts`, tested). Private receive/payout; the on-chain announce + sweep reuses
the same UA transfer flow.

## Deliberately NOT used (different track)
- **Openfort backend wallets / x402** is a General-Track subtrack we skip — the fit would be
  automated recurring pot top-ups, but that's scope creep this close to the finale.
- **ZeroDev** is now USED (§1b) — its Kernel7702 session-key validator is our on-chain
  enforcement layer, stacking a 4th bounty on the UA-track work.

## One-line verdict
Particle UA chain abstraction and Magic auth are **deep and core**; the per-member 7702 cap
is an **owner-signed grant** enforced **on-chain via a ZeroDev Kernel7702 call-policy**
(`lib/zerodev.ts`) — the chain, not the app, refuses an over-limit transfer. Four partners
used for real (Particle, Magic, Arbitrum, ZeroDev); the only open items are wiring the
ZeroDev RPC key and confirming UA composition + bounty stacking at Office Hours.
