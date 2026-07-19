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
  upgraded in place) is confirmed working — a real spend settled on Arbitrum
  (tx `0x40a4722a…d50f7`). On SDK v2.0.3 the first tx from an undelegated EOA carries a signed
  EIP-7702 authorization (`sendTransaction`'s 3rd arg, chainId 0); once delegated, 2 args suffice.
  **Status: resolved, no open 7702-init question.**
- **Per-member session keys (the 30% "prominent 7702 use" criterion):** each member has a
  real session key (`createSessionKey`) and an **owner-signed EIP-712 `SpendPermission`**
  binding that key to a cap + period (`lib/sessionKey.ts`, real ethers signing, tested). A
  spend is refused unless the owner genuinely signed that member's cap (`lib/bareng.ts`).
  This is the exact authorization payload a 7702 session key delegates. **Honest scope
  (see `docs/ARCHITECTURE.md`):** the Particle UA is single-owner with no session-key API, so
  this grant is an **app-level authorization** the app verifies — the UA does not enforce it
  on-chain. The cap is real crypto + app-side enforcement, not chain-enforced *on the UA*.

  ### 1b. ZeroDev — Kernel7702 validator · **Reference impl (standalone) + bounty**
  Real primitives: `createKernelAccount` (7702), `toPermissionValidator`, `toCallPolicy`,
  `toECDSASigner` (`lib/zerodev.ts`). A **working demonstration** of on-chain 7702 spend-cap
  enforcement (per-tx `USDC.transfer <= cap`) that targets the ZeroDev bounty. It does **not**
  compose with the Particle UA — ZeroDev's kernel is a different account; real on-chain caps
  would require making the pot a ZeroDev kernel (losing UA cross-chain balance). **Proven on
  Sepolia:** over-cap `USDC.transfer` rejected at validation, within-cap settled
  (tx `0x73ad508a…`). Gated behind `NEXT_PUBLIC_ZERODEV_RPC`.

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

### 5. Openfort — x402 agent payments + backend sweep · **Reference impl + bounty**
Real x402 flow (`lib/x402.ts`) + backend sweep detection (`lib/sweep.ts`), gated behind
`NEXT_PUBLIC_OPENFORT_FACILITATOR`.
- **x402 agent wallet:** demonstrates that a 7702-capped key is a *safe agent wallet* — it pays
  per-request via x402 and is bounded by `chargeWithinCap` (refuses over-cap without paying).
  Live demo at `/agent`. Hits the x402 bounty theme ("autonomous agent with guardrails"). Honest
  scope: the cap guard mirrors the *shape* of a 7702 policy; settlement drawing from the pot is
  abstracted (not wired to the UA or a ZeroDev kernel) — see `docs/ARCHITECTURE.md`.
- **Backend sweep:** `findSweepable` detects the pot's stealth receives and recovers each
  controlling key, ready for an Openfort backend wallet to sweep into the UA — completing the
  stealth-sweep to-do (detection is real + tested; the on-chain sweep tx is not wired).

## Deliberately NOT used
- Nothing from the featured set. All five partners (Particle, Magic, Arbitrum, ZeroDev,
  Openfort) are integrated with real code, each on the critical path of at least one flow.

## One-line verdict
Particle UA chain abstraction, Magic auth, and Arbitrum settle are **deep and core** — the
real, coherent spine (single-owner UA, cross-chain unified balance). Per-member caps are
**owner-signed grants enforced app-side** (`lib/limits.ts` + `lib/sessionKey.ts`); the UA has
no on-chain session-key API. **ZeroDev and Openfort/x402 are working reference implementations
+ bounty targets, NOT composed into the UA** (`docs/ARCHITECTURE.md`). Five partners with real
code; the honest differentiator is the UX + the 7702 account, not chain-enforced per-member caps.
