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
  { id: "deck", text: "The full story lives in the pitch deck, at slash deck. Problem, solution, the seven on-chain proofs, and why this wins. Bareng — money, together. Gotong royong, on-chain." },
];

const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

const scenes = [];
let t = 0;
for (let i = 0; i < SCENES.length; i++) {
  const s = SCENES[i];
  const mp3 = `seg${String(i).padStart(2, "0")}.mp3`;
  execFileSync("python", ["-m", "edge_tts", "--voice", VOICE, "--text", s.text, "--write-media", mp3], { stdio: "ignore" });
  const narr = dur(mp3);
  const slot = narr + TAIL;
  scenes.push({ id: s.id, text: s.text, start: Math.round(t * 1000) / 1000, narr: Math.round(narr * 1000) / 1000, dur: Math.round(slot * 1000) / 1000, mp3 });
  console.log(`${String(i).padStart(2)} ${s.id.padEnd(9)} narr=${narr.toFixed(2)}s slot=${slot.toFixed(2)}s @ ${t.toFixed(1)}s`);
  t += slot;
}
writeFileSync("timeline.json", JSON.stringify({ voice: VOICE, total: Math.round(t * 1000) / 1000, scenes }, null, 2));
console.log(`\nTOTAL ${t.toFixed(1)}s (${(t / 60).toFixed(1)} min) · ${scenes.length} scenes → timeline.json`);
