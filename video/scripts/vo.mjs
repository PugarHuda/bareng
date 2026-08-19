// Narration for the finale pitch video: one mp3 per spoken line, plus a timeline the Remotion
// compositions read to size themselves.
//
//   node scripts/vo.mjs           → public/vo/*.mp3 + src/timeline.json
//   node scripts/vo.mjs --fresh   → re-synthesise every line
//
// Durations flow one way: narration is recorded first, and the visuals are cut to it. Doing it the
// other way round means writing to a stopwatch and hearing the cut land a beat late.
//
// The wording is docs/PITCH_SCRIPT_3MIN.md verbatim, with two changes the TTS needs: digits spelled
// out, and "EIP-7702" spaced into letters, because the voice otherwise reads it as a year.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";

const VOICE = "en-US-AndrewNeural";
const FPS = 30;
const FRESH = process.argv.includes("--fresh");
const OUT = "public/vo";

// `pause` is the silence held after the line, in seconds. It is the script's own pause marks:
// (jeda) = 0.5, [JEDA] = 1, [BERHENTI 2 DTK] = 2. Silence is what makes a claim land, so it is
// part of the timing rather than something trimmed away.
const SCENES = [
  {
    id: "title", lines: [
      { id: "t1", pause: 0.8, text: "Group money is universal. Patungan. Arisan. Splitting a bill with friends." },
      { id: "t2", pause: 0.8, text: "But every crypto product ever built is single user." },
      { id: "t3", pause: 0.6, text: "Bareng is the shared one. One account, many people, real limits." },
    ],
  },
  {
    id: "problem", lines: [
      { id: "p1", pause: 0.5, text: "Today a group pot means a group chat, a spreadsheet, and one person holding everyone's money." },
      { id: "p2", pause: 0.7, text: "On chain it is worse. You either share a seed phrase, or you do not share at all. Nobody has built the shared account." },
    ],
  },
  // Two recorded scenes, not one. The first is the money path, which has to be shown slowly enough
  // to be believed. The second is the rest of the product, at a pace that says "there is more here"
  // without asking anyone to study it.
  {
    id: "core", clip: true, route: "/app", lines: [
      { id: "c1", pause: 0.6, text: "This is a real shared pot. One balance, four hundred and twenty dollars, and in rupiah too, because that is the money people actually think in." },
      { id: "c2", pause: 0.6, text: "Three members, each with their own weekly limit. I am Budi, and I pay Sari thirty dollars, by handle. Never an address." },
      { id: "c3", pause: 0.6, text: "Settled on Arbitrum. No gas, no chain to pick, no seed phrase." },
      { id: "c4", pause: 0.7, text: "Now watch the limit. Budi has seventy dollars left, I drag to eighty five, and it refuses. That cap is an owner signed E I P seventy seven oh two grant, verified on every spend. Cryptography, not a disabled button." },
    ],
  },
  {
    id: "tour", clip: true, route: "/arisan", lines: [
      { id: "u1", pause: 0.5, text: "Arisan: a rotating savings circle five hundred years old. Everyone pays in, one member collects the pot. The order comes from a public seed, so anyone can prove nobody rigged it." },
      { id: "u2", pause: 0.5, text: "Split settles the group up. Add what everyone paid, and it nets the debts down to the fewest transfers." },
      { id: "u3", pause: 0.5, text: "Receive hands out a fresh one time address every time, so the pot's income is not a public ledger." },
      { id: "u4", pause: 0.5, text: "The part of the balance nobody is spending earns. One tap supplies it into Aave v3." },
      { id: "u5", pause: 0.7, text: "And an agent gets a capped key of its own. It pays per request over x402, and can never drain the pot." },
    ],
  },
  {
    id: "seven02", lines: [
      { id: "s1", pause: 0.5, text: "Underneath, the account itself is E I P seventy seven oh two. The organizer's Google login becomes a Universal Account in place. Same address, nothing deployed." },
      { id: "s2", pause: 0.7, text: "And that one account holds the balance across every chain." },
    ],
  },
  {
    id: "proof", lines: [
      { id: "r1", pause: 0.8, text: "And none of this is a mockup." },
      { id: "r2", pause: 0.6, text: "Seven things have actually settled on chain. A shared spend. A cap enforced. An Aave supply. An agent payment. A private sweep. Every hash is clickable." },
      { id: "r3", pause: 0.7, text: "Most teams here do not have one." },
    ],
  },
  {
    id: "partners", lines: [
      { id: "n1", pause: 0.4, text: "All five partners, for real." },
      { id: "n2", pause: 0.7, text: "Particle is the account. Magic is the login. Arbitrum is where it settles. ZeroDev caps it. Openfort pays." },
    ],
  },
  {
    id: "close", lines: [
      { id: "z1", pause: 1.2, text: "So that is Bareng. One shared balance, real per person limits, private receives, no gas, no chains, no seed phrases. Seven things already settled on chain, and all five partners are real integrations." },
      { id: "z2", pause: 1.5, text: "Bareng. Money, together. Thank you." },
    ],
  },
];

if (FRESH && existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const probe = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

// edge-tts talks to Microsoft's online endpoint and fails intermittently; retry before giving up.
const tts = (text, mp3) => {
  for (let a = 0; a < 5; a++) {
    try { execFileSync("python", ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", mp3], { stdio: "ignore" }); return; }
    catch (e) { if (a === 4) throw e; sleep(2500); }
  }
};

// Frames, not seconds, are the unit Remotion cuts on. Rounding up means a line is never clipped by
// the frame its scene ends on.
const frames = (sec) => Math.ceil(sec * FPS);

// What each mp3 currently says. Without this a line whose wording changed keeps its old audio,
// because the file for that id already exists — and the caption then reads the new sentence while
// the voice speaks the old one. That is silent and it very nearly shipped.
const MANIFEST = "public/vo/spoken.json";
const spoken = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};

let total = 0;
const scenes = SCENES.map((sc) => {
  let at = 0;
  const lines = sc.lines.map((l) => {
    const file = `${OUT}/${l.id}.mp3`;
    if (!existsSync(file) || spoken[l.id] !== l.text) {
      console.log(`    ${existsSync(file) ? "re-recording" : "recording"} ${l.id}`);
      tts(l.text, file);
      spoken[l.id] = l.text;
    }
    const narr = probe(file);
    const row = {
      id: l.id, text: l.text, src: `vo/${l.id}.mp3`,
      from: at,                                   // frames, relative to the scene
      narrationInFrames: frames(narr),
      durationInFrames: frames(narr + l.pause),
    };
    at += row.durationInFrames;
    return row;
  });
  console.log(`  ${sc.id.padEnd(9)} ${(at / FPS).toFixed(1)}s  ${lines.length} lines${sc.clip ? "  (recorded app)" : ""}`);
  const row = { id: sc.id, clip: Boolean(sc.clip), route: sc.route ?? null, from: total, durationInFrames: at, lines };
  total += at;
  return row;
});

writeFileSync(MANIFEST, JSON.stringify(spoken, null, 1));
writeFileSync("src/timeline.json", JSON.stringify({ fps: FPS, durationInFrames: total, scenes }, null, 1));
const secs = total / FPS;
console.log(`\n✓ timeline: ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, "0")} (${total} frames @ ${FPS}fps)`);
if (secs > 178) console.log(`⚠ OVER the three minute limit by ${(secs - 180).toFixed(1)}s — cut a line.`);
else console.log(`  ${(180 - secs).toFixed(1)}s of headroom under the three minute limit.`);
