# Demo flow (finale pitch — ~3 min)

Open line: *"Crypto has the infra. It just doesn't use it. Bareng puts gotong royong —
shared money — onchain, and you never feel the crypto."*

## Runs today (demo mode, no keys)
1. **Dashboard** — show the pot **@lunchsquad**, the balance (also in **Rupiah** — *"gotong
   royong, so we show it in the money people actually think in"*), members **@budi ($100/wk)**,
   **@sari ($50/wk)**, **@dewi ($25/wk)**. Point at **🔒 7702 session-key grant · owner-signed
   & verified** under the spend box — *"each member's cap is a real signed authorization."*
   Then tap the green **✓ Real shared-UA spend settled on Arbitrum ↗** badge → Arbiscan opens on
   tx `0x40a4…`. *"This isn't a mockup — a real spend from this shared account already settled
   on-chain. One tx hash beats five scaffolded integrations."* (Lead with this.)
2. **Spend as @budi, pay to @dewi → $30.** Settles "on Arbitrum", his remaining drops to $70.
   *"Pay by handle, never an address."*
3. **Switch to @sari, drag to $60 → "Over limit"**, blocked. *"The cap is an owner-signed
   7702 grant — real crypto the app verifies. `lib/zerodev.ts` is our working reference for
   pushing that same cap on-chain."* (Honest — don't claim the UA enforces it on-chain; it's
   single-owner with no session-key API. See docs/ARCHITECTURE.md.)
4. **Top up from Base → +$50.** Balance jumps; feed says *"$50 from Base → unified on
   Arbitrum."* *"Funds enter on any chain, land as one balance. That's the cross-chain
   requirement — invisible."*
5. **Share link / QR** — one tap copies the pot's invite link; tap **QR** to show a
   scan-to-join code. *"No addresses. Just a handle — or scan to join the patungan."*
6. **/admin** — invite **@maya**, set a $40 weekly cap. Watch **"Signing grant…" → 🔒 grant
   signed & verified**. *"The owner just signed her 7702 spend cap, live."*
7. **/agent** — the Openfort/x402 story. Agent fetches premium data → **402 → pays $20 (within
   @budi's cap) → 200 unlocked**. Drag the charge past his cap and run again → **refused before
   paying**. *"A capped key is a safe agent wallet — it pays per request via x402 and is bounded
   by the cap."* (Reference demo: the cap guard is real + tested; settlement is abstracted.)
8. **/receive** — tap **Generate** twice → two *different* one-time addresses, each with a
   **scan-to-pay QR**. Hit **Verify pot can claim → ✓**. *"Outside payments land on fresh
   stealth addresses; the pot's account stays unlinkable, then a backend wallet sweeps them in."*
9. **/earn** — drag the keep-liquid slider; idle balance shows a live yield projection. *"The
   shared fund earns in Aave v3 between spends — one tap from being spent."*
10. **/split** — **Split & settle up.** Add an expense (**@sari paid $18, dinner**). The
    *"Where everyone stands"* + *"Settle up"* panels recompute live: *"who owes whom, netted to
    the fewest transfers — patungan without the spreadsheet, each settled through the same shared
    account."*
11. **/arisan** — the showstopper. First tap **🎲 Fair draw** → the collection order is derived
    from a public seed. *"Who collects the pot first is a provably-fair draw — anyone recomputes
    `drawOrder(members, seed)` to check nobody rigged it."* Then each member **pays in $10** and
    **one collects the whole pot**. *"This is arisan — Indonesia's 500-year-old rotating savings
    circle — trustless on-chain. We didn't build a shared wallet; we put gotong royong on-chain."*

Close line: *"One shared balance, real per-person limits, real privacy — no gas, no chains,
no seed phrases. That's chain abstraction people would actually use."*

## With keys (live path)
- **Continue with Google** → Magic embedded wallet → Universal Account (7702 mode).
- A spend routes through the UA and **settles on Arbitrum** for real (cross-chain).
- Same screens, now backed by on-chain transactions.

## What to emphasize per judge
- **Particle (UX 40% / 7702 30%):** the account IS 7702 (UA in 7702 mode) + the cross-chain
  unified balance is the standout. The per-member cap is an owner-signed 7702 grant
  (`lib/sessionKey.ts`), enforced app-side.
- **ZeroDev (bounty):** `lib/zerodev.ts` — a working Kernel7702 call-policy (`USDC.transfer ≤
  cap`) demonstrating on-chain 7702 enforcement. Present it as a reference impl / the path to
  chain-enforced caps — NOT as something enforcing on the Particle UA (it doesn't; different
  account). Honesty here survives a judge's follow-up; the collapsed claim doesn't.
- **Openfort (bounty):** the `/agent` screen — a 7702-capped session key as a safe x402 agent
  wallet (`lib/x402.ts`). "Autonomous agent that transacts, with on-chain guardrails" is
  exactly the x402 theme, and it reuses the 7702 cap you already built.
- **Arbitrum (creativity 30%):** it feels like a consumer app; Arbitrum is the invisible
  backend. The **top up from Base** beat is your visible cross-chain proof. Never say "chain".
- **Magic ($500):** the Google-login → instant wallet onboarding, no MetaMask, no seed phrase.
