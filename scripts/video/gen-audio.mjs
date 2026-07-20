import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const VOICE = "en-US-AndrewNeural";
const TAIL = 1.1; // breathing room after each line (seconds)

const SCENES = [
  { id: "landing", text: "Meet Bareng — a shared group wallet. One account, one balance, and every member gets their own spending limit. It feels like a normal money app, but it runs on-chain." },
  { id: "proof", text: "And this isn't a mockup. Seven real transactions have already settled on-chain — a shared spend, a DeFi deposit, an agent payment, a private sweep — each one clickable to verify on the block explorer." },
  { id: "openapp", text: "Let's open it. Here's a shared pot: four hundred and twenty dollars, held in one Universal Account that works across Arbitrum, Base, Ethereum, and B N B." },
  { id: "members", text: "Three members, each with a weekly limit. And every limit is a real, owner-signed E I P seventy-seven-oh-two grant — cryptography, not just an app rule." },
  { id: "pay", text: "Paying is simple. Pick a member, pay someone by their handle — no addresses to copy — add a note, and it settles on Arbitrum." },
  { id: "overcap", text: "But nobody can overspend. Push past the cap, and the button locks — over limit — blocked before a single cent moves." },
  { id: "receipts", text: "Every receipt in this feed is a real settlement. Tap one, and it opens the actual transaction on Arbiscan." },
  { id: "deposit", text: "Topping up from another chain is one tap. This is a ZeroDev Smart Routing Address — send USDC from any chain, and it lands right in the pot." },
  { id: "arisan", text: "Bareng also brings Indonesian money rituals on-chain. Arisan — a rotating savings circle — with a verifiable fair draw. The order comes from a public seed anyone can recompute, so it can't be rigged." },
  { id: "split", text: "Split a bill, and Bareng nets who owes whom down to the fewest possible transfers." },
  { id: "receive", text: "Receiving privately? Each payment lands on a fresh, one-time stealth address, and the pot quietly sweeps it in — completely unlinkable on-chain." },
  { id: "agent", text: "A member's capped key can even become an A I agent wallet. It pays per request over x four-oh-two — signing a real payment the server verifies — but it physically cannot exceed the cap." },
  { id: "earn", text: "Idle funds don't sit still. One tap supplies them into Aave v three — the real approve-and-supply batch — kept one tap away from being spent." },
  // ---- pitch deck, slide by slide (/deck) ----
  { id: "deck_open", text: "And here's the full pitch — eleven slides, at slash deck. Let's walk through it. Bareng: money, together — a shared group wallet on a real 7702 account." },
  { id: "deck_problem", text: "Slide one, the problem. Group money is everywhere — but on-chain, it's a mess of separate wallets and manual transfers. And every product is single-user; nobody has built the shared account." },
  { id: "deck_solution", text: "The solution: one shared account, real per-person limits, and a Web2 feel — Google login, no gas, no seed phrase, no chain to pick." },
  { id: "deck_7702", text: "How it uses EIP-7702: the account is the owner's own wallet, upgraded in place — no new address. And every cap is an owner-signed grant, verified on each spend." },
  { id: "deck_proof", text: "This isn't a mockup — seven real transactions have settled on-chain, and every one is clickable to verify on the explorer." },
  { id: "deck_features", text: "Gotong royong as a primitive: arisan, split and settle, private receive, a capped agent wallet, pay-by-handle, and idle-balance earn." },
  { id: "deck_partners", text: "All five featured partners — Particle, Magic, Arbitrum, ZeroDev, and Openfort — each a real, working integration, not a logo on a slide." },
  { id: "deck_honest", text: "And it's honest: what's real, what runs in demo mode, and the one thing that still needs funds. This is the pitch that survives a judge's follow-up." },
  { id: "deck_crosschain", text: "Cross-chain, honestly: Particle's path is bugged upstream, so we shipped a ZeroDev Smart Routing Address that actually works — a deposit rail from any chain." },
  { id: "deck_win", text: "Why this wins: prominent 7702, a UX that hides the chain, genuine white space no one else fills, and a real regional fit with arisan and gotong royong." },
  { id: "deck_ask", text: "And the ask: the Universal Accounts Track, plus the Arbitrum and Magic bonuses. Bareng — money, together. Gotong royong, on-chain. Thanks for watching." },
];

const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// edge-tts hits Microsoft's online endpoint and is occasionally flaky — retry a few times.
const tts = (text, mp3) => {
  for (let a = 0; a < 5; a++) {
    try { execFileSync("python", ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", mp3], { stdio: "ignore" }); return; }
    catch (e) { if (a === 4) throw e; sleep(2500); }
  }
};

const scenes = [];
let t = 0;
for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const mp3 = `seg${String(i).padStart(2, "0")}.mp3`;
  tts(s.text, mp3);
  const narr = dur(mp3);
  const slot = narr + TAIL;
  scenes.push({ id: s.id, text: s.text, start: Math.round(t * 1000) / 1000, narr: Math.round(narr * 1000) / 1000, dur: Math.round(slot * 1000) / 1000, mp3 });
  console.log(`${String(i).padStart(2)} ${s.id.padEnd(9)} narr=${narr.toFixed(2)}s slot=${slot.toFixed(2)}s @ ${t.toFixed(1)}s`);
  t += slot;
}
writeFileSync("timeline.json", JSON.stringify({ voice: VOICE, total: Math.round(t * 1000) / 1000, scenes }, null, 2));
console.log(`\nTOTAL ${t.toFixed(1)}s (${(t / 60).toFixed(1)} min) · ${scenes.length} scenes → timeline.json`);
