# Workshop insights → what we actually shipped

Mined the six UXMaxx workshops (Particle WS01/WS02, ZeroDev, Openfort/x402, Arbitrum, launch) for
anything concretely implementable in Bareng. Honest mapping — done, pending funds, or out of scope.

## ✅ Implemented
| Workshop insight | Where it lives |
|---|---|
| **Particle UA in EIP-7702 mode, unified balance** | `lib/universalAccount.ts` — **proven on-chain** (tx `0x40a4722a…d50f7`, Arbitrum). |
| **Single-signature spend from the unified balance** | `sendShared` → `sendTransaction(tx, signature)`. Particle handles the 7702 authorization server-side (no 3rd-arg auth needed — confirmed empirically). |
| **ZeroDev: validation-logic-as-code, per-key spend cap** | `lib/zerodev.ts` — Kernel7702 call-policy `USDC.transfer ≤ cap` (reference impl). |
| **ZeroDev: batching multiple calls into one tx** | `lib/yield.ts` — `approve` + `supply` batched into one `createUniversalTransaction` call; the batch shape is unit-tested (`test/yield.test.mjs`). |
| **Openfort/x402: capped agent wallet, HTTP-402 pay-per-request** | `lib/x402.ts` + `/agent` — agent pays per request, physically bounded by the cap. |
| **Openfort: backend wallet sweeps (server-side, autonomous)** | `lib/sweep.ts` — detects stealth receives + builds a broadcastable sweep INTO the UA; a sponsored backend wallet submits it. |
| **UA does arbitrary contract calls** (`createUniversalTransaction`) | ✅ **PROVEN on-chain** — the UA supplied USDC into **Aave v3** on Arbitrum (approve+supply batched, 7702-delegated in place), tx [`0x7b5698c0…`](https://arbiscan.io/tx/0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad) (block 485521607, 12 logs). A real DeFi call, not just a transfer. Needs SDK v2.0.3. |

## 🟡 Built, ready — needs more funds to run
| Insight | Harness |
|---|---|
| **Cross-chain from a single balance** (WS02's headline: USDC on one chain → asset on another) | `scripts/prove-crosschain.mjs` (`npm run prove:crosschain`) — delivers USDC on **Base**, funded from the UA's **Arbitrum** balance, one signature. Code validated up to the funds boundary; the on-hand balance isn't enough after cross-chain bridge minimums/fees. Fund the account with ~$3–4 more and it settles a real Base tx → cross-chain criterion hit directly. (Note: SDK 2.0.3 has intermittent cross-chain issues per the hackathon Discord — same-chain is solid.) |

> The Aave "System maintenance" that blocked this earlier was a **deprecated-SDK (1.1.1) bug**, not
> an outage — confirmed on the hackathon Discord and fixed by moving to **SDK v2.0.3**. The Aave
> lend now settles on-chain (see the ✅ row above).

## 🔎 Available but deliberately not wired (honest scope)
- **ZeroDev Intents / solver network** ("vote on Arbitrum using USDC from Base") — Particle's UA
  already gives us cross-chain-from-one-balance; a second solver layer is redundant for this app.
- **ZeroDev gas sponsorship / Openfort gas policies** — Particle's UA charges gas from the balance
  (no native gas token needed), so the "no gas token" UX is already covered.
- **Magic blind signing / passkeys** — a live-login polish (needs `NEXT_PUBLIC_MAGIC_KEY`); the
  keyless demo + the script signer don't exercise it. Note it in the live-login TODO, don't fake it.
- **Arbitrum founder programs** (Open House, ArbiFuel, grants) — post-hackathon growth, not code.

## SDK methods surfaced (for whoever wires the live Magic path)
`getEIP7702Auth(chainIds)`, `getEIP7702Deployments()`, `createConvertTransaction` (buy/convert was
under maintenance during testing — use SEND/TRANSFER), `createBuyTransaction`, `createUniversalTransaction`.
