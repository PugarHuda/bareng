import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const VOICE = "en-US-AndrewNeural";
const TAIL = 1.1; // breathing room after each line (seconds)

const SCENES = [
  // ---- PART 1 · the pitch, up front (deck slides 1–5) ----
  { id: "p_title", text: "Bareng — money, together. A shared group wallet where one account holds the money, and every member gets their own spending limit." },
  { id: "p_problem", text: "The problem: group money is everywhere — patungan, arisan, a shared trip — but on-chain it's a mess of separate wallets. And every crypto product is single-user. Nobody has built the shared account." },
  { id: "p_solution", text: "So we did. One Universal Account, real per-person limits, and a Web2 feel — Google login, no gas, no seed phrase, no chain to pick." },
  { id: "p_7702", text: "The account itself is E I P seventy-seven-oh-two: the owner's own wallet, upgraded in place. Each cap is an owner-signed grant, verified on every spend." },
  { id: "p_proof", text: "And it's not a mockup — seven real transactions have already settled on-chain, each one verifiable. Now let's see it live." },
  // ---- PART 2 · the live demo (show it, don't re-explain) ----
  { id: "d_pot", text: "Here's a shared pot: four hundred and twenty dollars, in one account that works across Arbitrum, Base, Ethereum, and B N B." },
  { id: "d_pay", text: "Paying is by handle — no addresses to copy — and it settles on Arbitrum. Watch the balance drop." },
  { id: "d_overcap", text: "But push past your cap, and it locks — over limit — before a single cent moves." },
  { id: "d_receipts", text: "And every receipt here is one of those real settlements — tap to open it on Arbiscan." },
  { id: "d_deposit", text: "Topping up from another chain is one address — send from anywhere, and it lands in the pot." },
  { id: "d_arisan", text: "Arisan — a rotating savings circle — with a fair draw from a public seed anyone can recompute, so it can't be rigged." },
  { id: "d_split", text: "Split a bill, and it nets who owes whom down to the fewest transfers." },
  { id: "d_receive", text: "Receive privately on fresh, one-time stealth addresses — auto-swept into the pot, unlinkable on-chain." },
  { id: "d_agent", text: "That capped key even works as an x four-oh-two A I agent wallet — it pays per request, but physically can't exceed the cap." },
  { id: "d_earn", text: "And idle funds earn in Aave v three — one tap away from being spent." },
  // ---- PART 3 · the close (deck slides 7–11) ----
  { id: "c_partners", text: "Under the hood, all five featured partners are real integrations — Particle, Magic, Arbitrum, ZeroDev, and Openfort." },
  { id: "c_honest", text: "And we're honest about scope — what's real, what runs in demo mode, and the one thing that still needs funds. It survives a judge's follow-up." },
  { id: "c_crosschain", text: "On cross-chain, Particle's path is bugged upstream — so we shipped a ZeroDev routing address that actually works." },
  { id: "c_win", text: "Why it wins: a prominent 7702 account, a UX that hides the chain, real white space no one else fills, and a regional fit with gotong royong." },
  { id: "c_ask", text: "The ask: the Universal Accounts Track, plus the Arbitrum and Magic bonuses. Bareng — money, together. Thanks for watching." },
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
