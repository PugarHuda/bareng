# Demo flow (finale pitch — ~3 min)

Open line: *"Crypto has the infra. It just doesn't use it. Bareng puts gotong royong —
shared money — onchain, and you never feel the crypto."*

The app is **separated for a clean demo**: `/` is the landing (the pitch), `/app` is the pot
(the product), and each feature has its own screen reached from the sidebar (a scrollable top-nav on mobile) — so you can
jump straight to whatever a judge wants to see.

---

## Act 0 — The landing (`/`)  ·  the "not a mockup" opener
Open on the landing page. Neobrutalism hero: *"Money, together."*
- Scroll to **"Not a mockup — proven on-chain"**: three real, clickable transactions.
  Tap one → an explorer opens. *"Three things have actually settled on-chain — a shared spend, a
  7702 cap enforced, and a real DeFi lend. Most teams don't have one."*
- Hit **"Open the app →"**.

## Act 1 — One shared pot (`/app`, demo mode, no keys)
1. **The pot @lunchsquad** — balance **$420** (also in **Rupiah** — *"gotong royong, so we show the
   money people actually think in"*), members **@budi $100/wk · @sari $50/wk · @dewi $25/wk**, and
   the **🔒 7702 session-key grant · owner-signed & verified** line. The green **✓ settled on
   Arbitrum ↗** badge is right there too.
2. **Spend as @budi → @dewi, $30.** Settles "on Arbitrum"; his remaining drops to $70.
   *"Pay by handle, never an address."*
3. **Switch to @sari, drag to $60 → "Over limit"**, blocked. *"The cap is an owner-signed 7702
   grant — real crypto the app verifies."* (Honest: enforced app-side; the UA is single-owner. The
   on-chain-enforced version is the ZeroDev reference — see Act 3 / `docs/ARCHITECTURE.md`.)
4. **Top up from Base → +$50.** *"Funds enter on any chain, land as one balance. That's the
   cross-chain requirement — invisible."*
5. **Where the pot goes** — the live category breakdown + group receipts. *"Shared money everyone
   can see."* Tap **QR** on the pot card → *"scan to join the patungan."*

## Act 2 — Gotong royong, made a primitive  ·  the differentiators
6. **Arisan in the sidebar → /arisan** (the showstopper). Tap **🎲 Fair draw** → the collection order comes
   from a public seed. *"Who collects first is a provably-fair draw — anyone recomputes it to check
   nobody rigged it."* Each member **pays in $10**, one **collects the whole pot**. *"Arisan —
   Indonesia's 500-year-old rotating savings circle — trustless on-chain. We didn't build a shared
   wallet; we put gotong royong itself on-chain."*
7. **Split in the sidebar → /split.** Add an expense (**@sari paid $18, dinner**). The *"Where everyone
   stands"* + *"Settle up"* panels recompute live. *"Who owes whom, netted to the fewest transfers
   — patungan without the spreadsheet, each settled through the same shared account."*

## Act 3 — The rest of the stack  ·  one sidebar item each (show what the judge asks for)
8. **Receive in the sidebar → /receive** — tap **Generate** twice → two *different* one-time addresses, each
   with a **scan-to-pay QR**. **Verify pot can claim → ✓**. *"Payments land on fresh stealth
   addresses; the pot stays unlinkable, then a backend wallet sweeps them in."*
9. **Agent in the sidebar → /agent** (Openfort/x402) — agent fetches premium data → **402 → pays $20 within
   @budi's cap → 200**. Drag past the cap, run again → **refused before paying**. *"A capped 7702
   key is a safe agent wallet."* (Reference: cap guard real + tested; settlement abstracted.)
10. **Earn in the sidebar → /earn** — drag the keep-liquid slider; idle balance shows a live Aave v3 yield
    projection. *"The shared fund earns between spends."* (We settled a real Aave supply on-chain —
    see the landing's 3rd proof.)
11. **Manage-pot in the sidebar → /admin** — invite **@maya**, set a $40 cap. **"Signing grant…" → 🔒 grant
    signed & verified**. *"The owner just signed her 7702 spend cap, live."*

Close line: *"One shared balance, real per-person limits, real privacy — no gas, no chains, no
seed phrases. That's chain abstraction people would actually use."*

---

## With keys — the live path (optional, for the "real onboarding" clip)
- **Continue with Google** (top of `/app`) → Magic embedded wallet → a Universal Account (7702).
  Verified working end-to-end: the OAuth flow reaches Google's consent, login returns a wallet.
- A spend routes through the UA; a fresh account signs its EIP-7702 authorization inline
  (`lib/magic.ts sign7702`, magic-sdk v33 supports chainId 0 — no pre-delegation, no ETH) and
  **settles on Arbitrum**. Fund the Magic UA first (a new Google account's UA starts empty).
- Keep the **deployed site keyless** for judging (best UX); use this only for a login clip.

## What to emphasize per judge
- **Particle (UX 40% / 7702 30%):** the account IS 7702 (UA in 7702 mode) + the cross-chain unified
  balance. Per-member cap = owner-signed 7702 grant (`lib/sessionKey.ts`), enforced app-side.
  **Proven on-chain:** a real UA spend settled on Arbitrum (`0x40a4…`).
- **ZeroDev (bounty):** `lib/zerodev.ts` — a Kernel7702 call-policy (`USDC.transfer ≤ cap`), and it's
  **proven on-chain on Sepolia** (over-cap rejected at validation, within-cap settled `0x73ad50…`).
  Present it as the standalone path to chain-enforced caps — NOT enforcing on the Particle UA.
- **Openfort (bounty):** `/agent` — a 7702-capped key as a safe x402 agent (`lib/x402.ts`).
- **Arbitrum (creativity 30%):** feels like a consumer app; Arbitrum is the invisible backend. The
  **top up from Base** beat + the **Aave DeFi lend** (`0x7b5698c0…`) are your on-chain proof. Never say "chain".
- **Magic ($500):** Google-login → instant wallet, no MetaMask, no seed phrase — wired + verified.
