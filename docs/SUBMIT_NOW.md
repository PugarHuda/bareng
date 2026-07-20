# Final submission — paste-ready (deadline Mon Jul 20, 6:59 PM WIB)

Track selected: **General Track · Subtrack 2 (ZeroDev)** + Arbitrum bounty + Magic Labs bonus. ✅ correct
(General Track has no cross-chain-via-UA requirement — the one UA-Track requirement Particle's v2 bug blocks).

---

## Project Name
Bareng

## Project Description  *(high-level summary)*
Bareng ("together" in Indonesian) is a shared group wallet. One Universal Account holds the money and
every member gets their own EIP-7702 spending limit. Log in with Google, pay by @handle, top up from any
chain, and it all settles on Arbitrum — no gas, no chains, no seed phrases. It puts *gotong royong* —
everyday shared money like arisan, patungan and splitting bills — on-chain, in an app that feels like
Venmo, not a crypto wallet.

## Project Image
Upload **`demo/project-image.png`** (the "Money, together." card). Alt: screenshot the landing page.

## Link to Code
https://github.com/PugarHuda/bareng

## Link to Presentation
https://bareng-jade.vercel.app/deck   *(live, keyboard-navigable 11-slide deck)*

## Link to Demo Video
**⚠ UPLOAD FIRST:** put `demo/bareng-demo.mp4` on YouTube (Unlisted) or Loom, paste the link here.

## Live Demo Link
https://bareng-jade.vercel.app

---

## Submission Details  *(the long required field — paste as-is)*

**Bareng — money, together.** A shared group wallet that makes on-chain group money feel like a normal app.

**The idea.** Group money is universal — patungan (chip-ins), arisan (rotating savings), splitting a bill,
a household pot — but on-chain it's clumsy, and every crypto product is single-user. Bareng is the shared,
multi-user account: one Particle Universal Account in EIP-7702 mode holds the money, and each member gets
their own owner-signed spending limit. You log in with Google, pay by @handle, and everything settles on
Arbitrum — no gas, no chains, no seed phrases.

**Track:** General Track + the **ZeroDev subtrack** (chain-abstracted cross-chain deposits via a Smart
Routing Address), plus the **Arbitrum** and **Magic Labs** bonus challenges.

**What's real — 7 artifacts settled or registered on-chain** (each is clickable to verify in the app and
the deck):
1. A shared-UA spend settled on Arbitrum
2. A per-member 7702 cap enforced on-chain (ZeroDev Kernel7702, Sepolia)
3. An Aave v3 DeFi supply from the UA (Arbitrum)
4. An x402 agent payment via EIP-3009, settled on Arbitrum
5. A private stealth sweep (gasless EIP-3009), settled on Arbitrum
6. Four dashboard receipts — all real UA settlements
7. A ZeroDev Smart Routing Address (cross-chain deposit rail) — registered

**Features (all demonstrated in the video):** pay by @handle, per-member EIP-7702 spending caps, arisan
with a *verifiable fair draw* (order derived from a public seed anyone can recompute), split & settle-up
(nets to the fewest transfers), private receive via one-time stealth addresses that are auto-swept into
the pot, a capped x402 AI-agent wallet that pays per request but can't exceed its cap, and idle-balance
earn into Aave v3. It's phone-first, WCAG-AA accessible, and runs keyless in demo mode so judges can try
it without a wallet.

**All five partners, for real:** Particle Universal Accounts (EIP-7702, the core), Magic (Google login →
a seedless wallet), Arbitrum (every spend settles here), ZeroDev (Kernel7702 cap + the Smart Routing
Address), and Openfort/x402 (a real EIP-3009 handshake that settles on-chain).

**Honest scope (survives a follow-up):** the deployed site runs in keyless demo mode so anyone can try it;
the mechanisms are real and have settled on-chain. Per-member caps are owner-signed and enforced app-side —
the Particle UA is single-owner, so we don't claim on-chain per-member enforcement on the UA itself.
Cross-chain via Particle's v2 SDK is bugged upstream (reproduced, and corroborated by other teams in the
Discord), so we shipped a working ZeroDev Smart Routing Address instead.

**Engineering:** Next.js 16 · React 19 · TypeScript · viem + ethers · Particle / Magic / ZeroDev SDKs.
73 unit tests plus a 46-case Playwright QA sweep (which caught and fixed a real double-click double-spend
re-entrancy bug in the money path); clean `next build`; deployed on Vercel.

## Relevant Files & Documents  *(optional upload — 25MB limit)*
`demo/bareng-demo.mp4` is 9.4MB — under the limit — so you can also attach it here as a backup to the
YouTube link. Optionally attach `demo/bareng-demo.srt` (subtitles).
