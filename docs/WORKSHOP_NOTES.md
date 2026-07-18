# Workshop insights → what we actually shipped

Mined the six UXMaxx workshops (Particle WS01/WS02, ZeroDev, Openfort/x402, Arbitrum, launch) for
anything concretely implementable in Bareng. Honest mapping — done, pending funds, or out of scope.

## ✅ Implemented
| Workshop insight | Where it lives |
|---|---|
| **Particle UA in EIP-7702 mode, unified balance** | `lib/universalAccount.ts` — **proven on-chain** (tx `0x40a4722a…d50f7`, Arbitrum). |
| **Single-signature spend from the unified balance** | `sendShared` → `sendTransaction(tx, signature)`. Particle handles the 7702 authorization server-side (no 3rd-arg auth needed — confirmed empirically). |
| **ZeroDev: validation-logic-as-code, per-key spend cap** | `lib/zerodev.ts` — Kernel7702 call-policy `USDC.transfer ≤ cap` (reference impl). |
| **ZeroDev: batching multiple calls into one tx** | `lib/yield.ts` — `approve` + `supply` batched via `createUniversalTransaction`. |
| **Openfort/x402: capped agent wallet, HTTP-402 pay-per-request** | `lib/x402.ts` + `/agent` — agent pays per request, physically bounded by the cap. |
| **Openfort: backend wallet sweeps (server-side, autonomous)** | `lib/sweep.ts` — detects stealth receives + builds a broadcastable sweep INTO the UA; a sponsored backend wallet submits it. |
| **Openfort recipe: yield farming** | `lib/yield.ts` + `/earn` — idle balance → Aave v3 on Arbitrum. |
| **UA does arbitrary contract calls** (`createUniversalTransaction`) | Verified `{to,data,value}` — enabled the Aave lend + batching above. |

## 🟡 Built, pending more funds to run
| Insight | Harness |
|---|---|
| **Cross-chain from a single balance** (WS02's headline: USDC on one chain → asset on another) | `scripts/prove-crosschain.mjs` (`npm run prove:crosschain`) — delivers USDC on **Base**, funded from the UA's **Arbitrum** balance, one signature. Code validated up to the funds boundary; the UA's ~$1.70 isn't enough after cross-chain bridge minimums/fees. Fund the UA `0x14eB…a22c` with ~$3–4 more and it settles a real Base tx → second on-chain artifact hitting the cross-chain criterion directly. |

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
