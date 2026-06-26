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
- **Per-member session keys (the 30% "prominent 7702 use" criterion):** *currently the
  weakest link.* Limits are enforced **app-side** today (`lib/limits.ts`, pure + tested),
  **not yet by an on-chain session-key primitive.** Plan: enforce on-chain via UA's 7702
  session keys if exposed, otherwise a ZeroDev session-key validator. **This is the #1
  build priority once keys are in** — it's what turns a claim into a win.

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
them). The single gap is making the **per-member 7702 session-key cap on-chain** instead of
app-side — close that and our "prominent/innovative 7702 use" claim is real, not asserted.
