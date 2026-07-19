# Security posture

## Secrets
- `.env.local` (the funded throwaway `OWNER_PRIVATE_KEY` + Particle keys) is **git-ignored and never
  committed** — only `.env.example` (a template) is tracked. Verified: no private key, and no Particle
  **Server Key**, appears in any tracked file or in the client bundle.
- Every `NEXT_PUBLIC_*` var is a **publishable client key by design** (Particle project/client/app IDs,
  Magic publishable key, ZeroDev bundler RPC). The Particle Server Key is a secret and is **never** put
  in a `NEXT_PUBLIC_` var.
- The only private key in source is the **well-known Anvil test account** (`0x59c6…690d`) used for the
  keyless demo — public by definition, holds nothing.

## `npm audit` — honest assessment
`npm audit` reports advisories, **all in transitive dependencies of the wallet SDKs — none in Bareng's
own code** (`npm audit --json` → 0 direct-dependency vulnerabilities). Specifically:

| Advisory | Path | Reachable in Bareng? | Fix |
|---|---|---|---|
| `bigint-buffer` buffer overflow (high) | `@particle-network/universal-account-sdk` → `@solana/*` | **No** — EVM/Arbitrum-only; the Solana `toBigIntLE` path is never invoked | None upstream |
| `bn.js` infinite loop (moderate) | `@zerodev/permissions` → `merkletreejs` → `web3-utils` | Only via the ZeroDev standalone reference; not on the UA money path | None upstream |
| `postcss` `</style>` XSS (moderate) | `next` → `postcss` (build-time CSS) | Build-time only; static output | Only "fix" downgrades Next to **v9** (breaking) — declined |

We run the **latest Next (16)** and the **latest supported Particle UA SDK (2.0.3)**. No non-breaking
fix exists for the remaining transitive advisories, and their vulnerable code paths are not exercised
by Bareng's flow. Downgrading Next to v9 to silence the postcss advisory would be a far larger risk
than the advisory itself, so it is deliberately not applied.

## Architecture honesty
Per-member spend caps are **owner-signed EIP-712 authorizations enforced app-side** — the Particle UA
is single-owner with no on-chain session-key API (confirmed by Particle's own devrel). ZeroDev/x402
are standalone reference implementations, not composed onto the UA. See `docs/ARCHITECTURE.md`. We do
not claim on-chain per-member enforcement on the UA.
