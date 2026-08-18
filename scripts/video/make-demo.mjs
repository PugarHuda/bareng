// Builds the ~63s live-demo video that plays as deck slide 3: neural voiceover, screen recording
// timed to that voiceover, and burned-in subtitles.
//
// One file rather than the three-stage split of the full-pitch pipeline (gen-audio → record →
// assemble), because this clip is short enough to rebuild in one pass. Finished mp3s and the
// .webm are reused on a re-run, so a failure part-way costs only the stage that failed.
//
//   node scripts/video/make-demo.mjs            → public/live-demo.mp4 + demo/bareng-live-demo.*
//   node scripts/video/make-demo.mjs --fresh    → discard cached audio/recording first
//
// Needs: python -m edge_tts, ffmpeg/ffprobe, and chrome (playwright-core drives the installed one).
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync, copyFileSync } from "node:fs";

const BASE = process.env.BASE || "https://bareng-jade.vercel.app";
const VOICE = "en-US-AndrewNeural";
const TAIL = 0.7;          // silence after each line, so beats do not run into each other
const W = 1280, H = 720;
const WORK = "scripts/video/.demo-build";
const FRESH = process.argv.includes("--fresh");

// The narration is the same wording as the demo beats in docs/PITCH_SCRIPT_3MIN.md. Numbers are
// spelled out and "EIP-7702" is spaced, because the TTS reads digits and acronyms badly otherwise.
const SCENES = [
  { id: "a1", text: "This is a real shared pot, at lunchsquad. One balance: four hundred and twenty dollars, and in rupiah too, because that is the money people actually think in." },
  { id: "a2", text: "Three members, each with their own weekly limit. I am Budi, and I pay Sari thirty dollars, by handle. Never an address." },
  { id: "a3", text: "Settled on Arbitrum. No gas, no chain to pick, no seed phrase." },
  { id: "b1", text: "Now watch the limit. Budi has seventy dollars left this week, and I drag to eighty five." },
  { id: "b2", text: "It refuses. That cap is an owner signed E I P seventy seven oh two grant, verified on every spend. It is cryptography, not a disabled button." },
  { id: "c1", text: "And this is the part that is actually Indonesian. Arisan: a five hundred year old rotating savings circle. Everyone pays in, one person collects the whole pot." },
  { id: "c2", text: "The only question that ever starts a fight is, who collects first? A public seed, so anyone can recompute this order and prove nobody rigged it." },
];

if (FRESH && existsSync(WORK)) rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
const probe = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());
const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

// ---------- 1 · voiceover ----------
// edge-tts calls Microsoft's online endpoint and is intermittently flaky; retry before giving up.
const tts = (text, mp3) => {
  for (let a = 0; a < 5; a++) {
    try { execFileSync("python", ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", mp3], { stdio: "ignore" }); return; }
    catch (e) { if (a === 4) throw e; sleep(2500); }
  }
};

let t = 0;
const timeline = SCENES.map((s, i) => {
  const mp3 = `${WORK}/${s.id}.mp3`;
  if (!existsSync(mp3)) tts(s.text, mp3);
  const narr = probe(mp3);
  const dur = narr + TAIL;
  const row = { ...s, mp3, start: +t.toFixed(3), narr: +narr.toFixed(3), dur: +dur.toFixed(3) };
  console.log(`  ${s.id}  narr=${narr.toFixed(2)}s  slot=${dur.toFixed(2)}s  @ ${t.toFixed(1)}s`);
  t += dur;
  return row;
});
const TOTAL = +t.toFixed(2);
console.log(`✓ voiceover: ${TOTAL}s across ${timeline.length} scenes`);
const dur = (id) => timeline.find((s) => s.id === id).dur;

// ---------- 2 · screen recording, each scene held to its narration slot ----------
const webmCached = existsSync(WORK) && readdirSync(WORK).find((f) => f.endsWith(".webm"));
let webm = webmCached ? `${WORK}/${webmCached}` : null;

if (!webm) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: WORK, size: { width: W, height: H } }, deviceScaleFactor: 1 });

  // Playwright's real pointer is invisible in a recording, so draw a presentation cursor.
  await ctx.addInitScript(() => {
    if (window.__ci) return; window.__ci = 1;
    const boot = () => {
      if (!document.body) return requestAnimationFrame(boot);
      const st = document.createElement("style");
      st.textContent = "@keyframes __rip{from{transform:scale(1);opacity:.85}to{transform:scale(4);opacity:0}}";
      document.documentElement.appendChild(st);
      const c = document.createElement("div");
      c.style.cssText = "position:fixed;left:0;top:0;width:24px;height:24px;border-radius:50%;background:#111;border:3px solid #FFD84D;box-shadow:0 3px 10px rgba(0,0,0,.45);z-index:2147483647;pointer-events:none;transform:translate(620px,340px);transition:transform .62s cubic-bezier(.22,.61,.36,1);will-change:transform";
      document.documentElement.appendChild(c);
      window.__mc = (x, y) => { c.style.transform = `translate(${x - 12}px,${y - 12}px)`; };
      window.__rp = (x, y) => { const r = document.createElement("div"); r.style.cssText = `position:fixed;left:${x - 9}px;top:${y - 9}px;width:18px;height:18px;border-radius:50%;border:3px solid #111;z-index:2147483646;pointer-events:none;animation:__rip .55s ease-out forwards`; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 600); };
    };
    boot();
  });

  const page = await ctx.newPage();
  const wait = (ms) => page.waitForTimeout(ms);
  const box = async (loc) => { try { return await loc.boundingBox({ timeout: 2000 }); } catch { return null; } };
  const move = async (x, y, ms = 620) => { await page.evaluate(([x, y]) => window.__mc && window.__mc(x, y), [x, y]).catch(() => {}); await wait(ms); };
  const point = async (loc, ms = 620) => { const b = await box(loc); if (b) await move(b.x + b.width / 2, Math.min(H - 20, b.y + b.height / 2), ms); };
  const clickIt = async (loc) => { const b = await box(loc); if (!b) return; const cx = b.x + b.width / 2, cy = Math.min(H - 20, b.y + b.height / 2); await move(cx, cy); await page.evaluate(([x, y]) => window.__rp && window.__rp(x, y), [cx, cy]).catch(() => {}); await loc.click({ timeout: 4000 }).catch(() => {}); await wait(250); };
  const scrollTo = async (loc, ms = 800) => { await loc.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" })).catch(() => {}); await wait(ms); };
  const scene = async (id, fn) => {
    const t0 = Date.now(); const slot = dur(id) * 1000;
    console.log(`▶ ${id} (${(slot / 1000).toFixed(1)}s)`);
    try { await fn(); } catch (e) { console.log("  skip:", String(e).slice(0, 70)); }
    const rem = slot - (Date.now() - t0);
    if (rem > 0) await wait(rem); else console.log(`  ⚠ overran ${-rem}ms — narration will drift`);
  };
  const B = (name) => page.getByRole("button", { name, exact: false }).first();
  const L = (name) => page.getByRole("link", { name, exact: false }).first();
  // The amount field is a range slider; React only sees a change via the native setter + input event.
  const setAmount = (v) => page.locator('input[type=range]').first()
    .evaluate((el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v)); el.dispatchEvent(new Event("input", { bubbles: true })); }, v)
    .catch(() => {});

  // Recording starts the moment the page exists, so opening and settling the app lands in the file
  // ahead of scene one. Measure that lead-in and trim exactly it at mux time — otherwise every
  // visual sits late against its narration and -shortest eats the tail instead.
  const recT0 = Date.now();
  await page.goto(BASE + "/app", { waitUntil: "domcontentloaded" });
  await wait(2500);
  writeFileSync(`${WORK}/offset.json`, JSON.stringify({ offset: +((Date.now() - recT0) / 1000).toFixed(3) }));

  await scene("a1", async () => {
    await point(page.getByText("$420.00").first(), 1100);
    await point(page.getByText(/Rp /).first(), 900);
    await point(page.getByText(/unified balance/i).first(), 800);
  });
  await scene("a2", async () => {
    await point(page.getByText("Budi").first(), 700);
    await point(page.getByText("Dewi").first(), 600);
    await scrollTo(page.getByText("Spend as").first(), 600);
    await point(page.getByPlaceholder(/@sari or 0x/i).first(), 700);
    await setAmount(30); await wait(600);
    await point(B(/^Pay \$30/), 600);
  });
  await scene("a3", async () => {
    await clickIt(B(/^Pay \$30/));
    await wait(1500);                                  // the simulated settlement delay
    await point(page.getByText(/settled on Arbitrum/i).first(), 900);
  });
  await scene("b1", async () => {
    await point(page.getByText(/limit left/i).first(), 900);
    await setAmount(60); await wait(500);
    await setAmount(85); await wait(700);
  });
  await scene("b2", async () => {
    await point(B(/Over limit/), 1400);
    await point(page.getByText(/7702 session-key grant/i).first(), 1200);
  });
  await scene("c1", async () => {
    await clickIt(L("Arisan"));
    await wait(1400);                                  // client-side nav: fixed wait, not networkidle
    await point(page.getByRole("heading").first(), 800);
    await point(page.getByText(/rotating savings circle/i).first(), 1200);
  });
  await scene("c2", async () => {
    // Point at the pre-draw prompt, not the result text — that only exists after the click, so
    // waiting on it burns two seconds of boundingBox timeout and the draw lands after the
    // narration has already described it.
    await point(page.getByText(/Order is fixed|provably-fair/i).first(), 1200);
    await wait(1500);                                  // click just after "who collects first?"
    await clickIt(B(/Fair draw/));
    await wait(700);
    await point(page.getByText(/Recompute/i).first(), 1500);
  });

  const v = await page.video();
  await ctx.close();
  await browser.close();
  webm = await v.path();
  console.log("✓ recording:", webm);
}

// ---------- 3 · voice track, subtitles, mux ----------
const parts = timeline.map((s, i) => {
  const wav = `${WORK}/pad${String(i).padStart(2, "0")}.wav`;
  ff(["-i", s.mp3, "-af", "apad", "-t", String(s.dur), "-ar", "48000", "-ac", "2", wav]);
  return `file '${wav.split("/").pop()}'`;
});
writeFileSync(`${WORK}/concat.txt`, parts.join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", `${WORK}/concat.txt`, "-c", "copy", `${WORK}/voice.wav`]);

const pad = (n, l = 2) => String(n).padStart(l, "0");
const stamp = (t) => `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(Math.floor(t % 60))},${pad(Math.round((t - Math.floor(t)) * 1000), 3)}`;
const LINE = 44;   // characters per subtitle line
// Chunk a scene into at-most-2-line cues. One cue per scene would either overflow three lines and
// get truncated, or grow tall enough to cover the UI it is describing — the "Over limit" button in
// particular, which is the whole point of that beat.
const cues = (txt) => {
  const words = txt.split(/\s+/); const lines = []; let cur = "";
  for (const w of words) { if ((cur + " " + w).trim().length > LINE) { lines.push(cur.trim()); cur = w; } else cur += " " + w; }
  if (cur.trim()) lines.push(cur.trim());
  const out = [];
  for (let i = 0; i < lines.length; i += 2) out.push(lines.slice(i, i + 2).join("\n"));
  return out;
};
// Subtitles span the narration only, not the trailing silence, so they clear between beats. Time
// inside a scene is split across its cues by character count, which tracks speech rate closely
// enough at this length.
const srtRows = [];
for (const s of timeline) {
  const parts = cues(s.text);
  const chars = parts.reduce((n, p) => n + p.length, 0);
  let at = s.start;
  for (const p of parts) {
    const span = s.narr * (p.length / chars);
    srtRows.push({ from: at, to: at + span, text: p });
    at += span;
  }
}
writeFileSync(`${WORK}/live-demo.srt`, srtRows.map((r, i) => `${i + 1}\n${stamp(r.from)} --> ${stamp(r.to)}\n${r.text}\n`).join("\n"));

// ffmpeg's subtitles filter renders SRT at a default PlayResY of 288, so every size here is scaled
// by 720/288 = 2.5x on output: FontSize 10 lands at ~25px, MarginV 10 at ~25px off the bottom.
// BorderStyle=3 draws an opaque box in OutlineColour behind the text. A plain outline (style 1) is
// unreadable here: the app's ground is cream, so white glyphs vanish into it.
const style = "FontName=Arial,FontSize=10,Bold=1,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=0,Alignment=2,MarginV=14";
// -ss before -i drops the pre-scene lead-in so video time 0 is scene time 0; -t then holds the
// output to the narration length rather than letting -shortest clip the far end.
// Recording stops right after the last scene, so raw length minus narration length is the lead-in.
// That derivation covers a webm cached from an older run; a measured value is preferred when present.
const offset = existsSync(`${WORK}/offset.json`)
  ? JSON.parse(readFileSync(`${WORK}/offset.json`, "utf8")).offset
  : +(probe(webm) - TOTAL).toFixed(3);
console.log(`  trimming ${offset}s of lead-in (raw ${probe(webm).toFixed(1)}s → ${TOTAL}s)`);
ff(["-ss", String(offset), "-i", webm, "-i", `${WORK}/voice.wav`,
  "-vf", `subtitles=${WORK}/live-demo.srt:force_style='${style}'`,
  "-map", "0:v:0", "-map", "1:a:0", "-t", String(TOTAL),
  // CRF 18, not 21: this clip is screen-shared over Zoom, which re-encodes it. Double compression
  // compounds, so spend the megabytes here to hand that encoder a clean source.
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
  "public/live-demo.mp4"]);

mkdirSync("demo", { recursive: true });
copyFileSync("public/live-demo.mp4", "demo/bareng-live-demo.mp4");
copyFileSync(`${WORK}/live-demo.srt`, "demo/bareng-live-demo.srt");
writeFileSync("demo/live-demo-VO.md", `# Live demo voiceover (${TOTAL}s)\n\n` + timeline.map((s) => `**${s.id}** · ${s.narr}s\n\n> ${s.text}\n`).join("\n"));

console.log(`\n✓ DONE → public/live-demo.mp4  (${probe("public/live-demo.mp4").toFixed(1)}s)`);
console.log("  also: demo/bareng-live-demo.mp4, demo/bareng-live-demo.srt, demo/live-demo-VO.md");
