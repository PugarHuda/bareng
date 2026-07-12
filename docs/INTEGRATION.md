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
  cryptographically real now, not an app-side promise. **Remaining step:** hand this signed
  grant to an on-chain validator (UA 7702 session keys if exposed, else ZeroDev validator)
  so the chain, not the app, refuses the over-limit tx. **Confirm the validator hook at
  Particle Office Hours (Jun 29).**

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
- **ZeroDev SRA** and **Openfort backend wallets / x402** are General-Track subtracks. We
  chose the **Universal Accounts Track** (higher prize + incubation funnel), so we don't
  use them — *except* ZeroDev session keys remain our fallback primitive if Particle UA
  doesn't expose 7702 session keys natively (see §1).

## One-line verdict
Particle UA chain abstraction and Magic auth are **deep and core** (the app is built on
them). The per-member 7702 session-key cap is now an **owner-signed grant** (real crypto,
enforced in the spend path) — the only step left is pointing that grant at an on-chain
validator so the chain refuses the over-limit tx instead of the app.
