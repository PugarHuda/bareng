# Demo flow (finale pitch — ~45s)

Open line: *"Crypto has the infra. It just doesn't use it. Bareng puts gotong royong —
shared money — onchain, and you never feel the crypto."*

## Runs today (demo mode, no keys)
1. **Dashboard** — show the pot **@lunchsquad**, balance, members **@budi ($100/wk)**,
   **@sari ($50/wk)**, **@dewi ($25/wk)**. Point at **🔒 7702 session-key grant · owner-signed
   & verified** under the spend box — *"each member's cap is a real signed authorization."*
2. **Spend as @budi, pay to @dewi → $30.** Settles "on Arbitrum", his remaining drops to $70.
   *"Pay by handle, never an address."*
3. **Switch to @sari, drag to $60 → "Over limit"**, blocked. *"The cap isn't a UI nicety —
   it's an owner-signed 7702 grant, enforced on-chain by a ZeroDev call-policy that only lets
   the session key transfer up to the cap."*
4. **Top up from Base → +$50.** Balance jumps; feed says *"$50 from Base → unified on
   Arbitrum."* *"Funds enter on any chain, land as one balance. That's the cross-chain
   requirement — invisible."*
5. **Share link** — one tap copies the pot's invite/top-up link. *"No addresses. Just a
   handle, like PIVY."*
6. **/admin** — invite **@maya**, set a $40 weekly cap. Watch **"Signing grant…" → 🔒 grant
   signed & verified**. *"The owner just signed her 7702 spend cap, live."*
7. **/agent** — the money shot for the Openfort/x402 story. Agent fetches premium data →
   **402 → pays $20 from @budi's 7702 key → 200 unlocked**. Drag the charge past his cap and
   run again → **refused on-chain, without paying**. *"A capped 7702 key is a safe agent
   wallet — it pays per request via x402 and physically can't drain the pot."*
8. **/receive** — tap **Generate** twice → two *different* one-time addresses. Hit
   **Verify pot can claim → ✓**. *"Outside payments land on fresh stealth addresses; the
   pot's account stays unlinkable, then a backend wallet sweeps them in."*

Close line: *"One shared balance, real per-person limits, real privacy — no gas, no chains,
no seed phrases. That's chain abstraction people would actually use."*

## With keys (live path)
- **Continue with Google** → Magic embedded wallet → Universal Account (7702 mode).
- A spend routes through the UA and **settles on Arbitrum** for real (cross-chain).
- Same screens, now backed by on-chain transactions.

## What to emphasize per judge
- **Particle (UX 40% / 7702 30%):** the per-member session-key cap is the standout — show
  the "Over limit" block; it's an owner-signed 7702 grant (`lib/sessionKey.ts`).
- **ZeroDev (bounty):** that cap is enforced **on-chain** by a Kernel7702 permission validator
  whose call-policy only allows `USDC.transfer ≤ cap` (`lib/zerodev.ts`). The chain refuses
  the over-limit tx — not the app. This is the "prominent 7702 use" made real.
- **Openfort (bounty):** the `/agent` screen — a 7702-capped session key as a safe x402 agent
  wallet (`lib/x402.ts`). "Autonomous agent that transacts, with on-chain guardrails" is
  exactly the x402 theme, and it reuses the 7702 cap you already built.
- **Arbitrum (creativity 30%):** it feels like a consumer app; Arbitrum is the invisible
  backend. The **top up from Base** beat is your visible cross-chain proof. Never say "chain".
- **Magic ($500):** the Google-login → instant wallet onboarding, no MetaMask, no seed phrase.
