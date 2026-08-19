// Records the app footage that plays inside the pitch video: silent, no burned-in subtitles, 1080p.
// One file per recorded scene in src/timeline.json, named after the scene.
//
//   node scripts/clip.mjs           → public/clip/core.mp4, public/clip/tour.mp4
//   node scripts/clip.mjs tour      → only that scene
//   node scripts/clip.mjs --fresh   → discard the cached recordings first
//
// Sound and captions are Remotion's job here, which is the whole reason this exists separately from
// scripts/video/make-demo.mjs in the parent project. That one bakes its own voice and subtitles in,
// which is right for a clip that plays alone and wrong for one cut into a longer film.
//
// Two things about the resolution are not obvious and both took a wrong turn to find. Playwright
// does not scale a capture UP to a larger recordVideo size — it pads, leaving the page in the
// top-left of a grey canvas. So the viewport is a real 1920x1080 and the page is zoomed 1.5x
// instead: the same layout that was verified at 1280 wide, rasterised at full 1080p, with no
// upscaling anywhere. The zoom goes on <body> rather than <html> so the injected cursor, which is
// appended to documentElement, stays in the coordinates boundingBox reports.
//
// Needs: ffmpeg/ffprobe and chrome (playwright-core drives the installed one).
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, readdirSync } from "node:fs";

const BASE = process.env.BASE || "https://bareng-jade.vercel.app";
const W = 1920, H = 1080, ZOOM = 1.5;
const FRESH = process.argv.includes("--fresh");
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith("--"));

const timeline = JSON.parse(readFileSync("src/timeline.json", "utf8"));
const ff = (args) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...args]);
const probe = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

mkdirSync("public/clip", { recursive: true });

// The choreography, one function per narration line. Each is given a small toolkit and simply says
// what to look at; how long to stay there is not its business — the runner holds every beat to its
// own narration length, so a rewritten sentence re-times the picture on the next build.
const CHOREO = {
  // --- the money path -------------------------------------------------------
  c1: async ({ point, T }) => {
    await point(T("$420.00"), 1200);
    await point(T(/Rp /), 1000);
    await point(T(/unified balance/i), 900);
  },
  c2: async ({ point, scrollTo, B, T, ph, setRange }) => {
    await point(T("Budi"), 700);
    await point(T("Dewi"), 600);
    await scrollTo(T("Spend as"), 600);
    await point(ph(/@sari or 0x/i), 700);
    await setRange(30); await point(B(/^Pay \$30/), 700);
  },
  c3: async ({ click, point, wait, B, T }) => {
    await click(B(/^Pay \$30/));
    await wait(1500);                                  // the simulated settlement delay
    await point(T(/settled on Arbitrum/i), 1000);
  },
  c4: async ({ point, wait, setRange, B, T }) => {
    await point(T(/limit left/i), 900);
    await setRange(60); await wait(500);
    await setRange(85); await wait(700);
    await point(B(/Over limit/), 1600);
    await point(T(/7702 session-key grant/i), 1400);
  },

  // --- everything else it does ---------------------------------------------
  u1: async ({ point, wait, click, B, T }) => {
    await point(T(/rotating savings circle/i), 1100);
    // Point at the pre-draw prompt, not the result — that only exists after the click, so waiting
    // on it burns two seconds of boundingBox timeout and the draw lands after the narration.
    await point(T(/Order is fixed|provably-fair/i), 1100);
    await wait(600);
    await click(B(/Fair draw/));
    await point(T(/Recompute/i), 1600);
  },
  u2: async ({ nav, point, click, B, T, num }) => {
    await nav("Split");
    await num(24);
    await click(B(/Add · split equally/));
    await point(T(/Where everyone stands/i), 900);
    await point(T(/fewest transfers/i), 900);
    await click(B(/settle via UA/));
  },
  u3: async ({ nav, point, click, B, T }) => {
    await nav("Receive");
    await click(B(/Generate one-time receive address/));
    await point(T(/fresh one-time address/i), 1100);
    await point(T(/every address will be different/i), 1200);
  },
  u4: async ({ nav, point, click, B, T }) => {
    await nav("Earn");
    await point(T(/Idle → earn/i), 900);
    await click(B(/Put \$\d+ to work/));
    await point(T(/Aave v3/i), 1200);
  },
  u5: async ({ nav, point, click, wait, B, T }) => {
    await nav("Agent");
    await point(T(/7702-capped key/i), 1000);
    await click(B(/Agent: fetch premium data/));
    await wait(900);
    await point(T(/settled on-chain|x402/i), 1300);
  },
};

const record = async (scene) => {
  const out = `public/clip/${scene.id}.mp4`;
  const work = `scripts/.clip-build/${scene.id}`;
  if (FRESH && existsSync(work)) rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });

  const total = scene.durationInFrames / timeline.fps;
  const cached = readdirSync(work).find((f) => f.endsWith(".webm"));
  let webm = cached ? `${work}/${cached}` : null;

  if (!webm) {
    const browser = await chromium.launch({ channel: "chrome", headless: true });
    const ctx = await browser.newContext({
      viewport: { width: W, height: H },
      recordVideo: { dir: work, size: { width: W, height: H } },
    });

    // Playwright's real pointer is invisible in a recording, so draw a presentation cursor.
    await ctx.addInitScript((zoom) => {
      if (window.__ci) return; window.__ci = 1;
      const boot = () => {
        if (!document.body) return requestAnimationFrame(boot);
        document.body.style.zoom = String(zoom);
        const st = document.createElement("style");
        st.textContent = "@keyframes __rip{from{transform:scale(1);opacity:.85}to{transform:scale(4);opacity:0}}";
        document.documentElement.appendChild(st);
        const c = document.createElement("div");
        c.style.cssText = "position:fixed;left:0;top:0;width:24px;height:24px;border-radius:50%;background:#111;border:3px solid #FFD84D;box-shadow:0 3px 10px rgba(0,0,0,.45);z-index:2147483647;pointer-events:none;transform:translate(920px,520px);transition:transform .62s cubic-bezier(.22,.61,.36,1);will-change:transform";
        document.documentElement.appendChild(c);
        window.__mc = (x, y) => { c.style.transform = `translate(${x - 12}px,${y - 12}px)`; };
        window.__rp = (x, y) => { const r = document.createElement("div"); r.style.cssText = `position:fixed;left:${x - 9}px;top:${y - 9}px;width:18px;height:18px;border-radius:50%;border:3px solid #111;z-index:2147483646;pointer-events:none;animation:__rip .55s ease-out forwards`; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 600); };
      };
      boot();
    }, ZOOM);

    const page = await ctx.newPage();
    const wait = (ms) => page.waitForTimeout(ms);
    const box = async (loc) => { try { return await loc.boundingBox({ timeout: 1500 }); } catch { return null; } };
    const move = async (x, y, ms = 620) => { await page.evaluate(([x, y]) => window.__mc && window.__mc(x, y), [x, y]).catch(() => {}); await wait(ms); };
    const point = async (loc, ms = 620) => { const b = await box(loc); if (b) await move(b.x + b.width / 2, Math.min(H - 20, b.y + b.height / 2), ms); };
    const click = async (loc) => {
      const b = await box(loc); if (!b) return;
      const cx = b.x + b.width / 2, cy = Math.min(H - 20, b.y + b.height / 2);
      await move(cx, cy);
      await page.evaluate(([x, y]) => window.__rp && window.__rp(x, y), [cx, cy]).catch(() => {});
      await loc.click({ timeout: 3000 }).catch(() => {});
      await wait(250);
    };
    const scrollTo = async (loc, ms = 800) => { await loc.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" })).catch(() => {}); await wait(ms); };
    // Client-side nav: a fixed wait, never waitForLoadState("networkidle"), which hangs for its
    // full 30s timeout after a Next link click because no load event ever fires.
    const nav = async (name) => { await click(page.getByRole("link", { name, exact: false }).first()); await wait(1300); };
    const T = (t) => page.getByText(t).first();
    const B = (name) => page.getByRole("button", { name, exact: false }).first();
    const ph = (t) => page.getByPlaceholder(t).first();
    // React only sees a programmatic value change through the native setter plus an input event.
    const setValue = (sel, v) => page.locator(sel).first()
      .evaluate((el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v)); el.dispatchEvent(new Event("input", { bubbles: true })); }, v)
      .catch(() => {});
    const setRange = (v) => setValue("input[type=range]", v);
    const num = (v) => setValue("input[type=number]", v);

    // Recording starts the moment the page exists, so the app loading and settling lands ahead of
    // beat one. Measure that lead-in and trim exactly it at encode time; otherwise every visual
    // sits late against its narration and the last beat is cut off the end instead.
    const t0 = Date.now();
    await page.goto(BASE + scene.route, { waitUntil: "domcontentloaded" });
    await wait(2500);
    writeFileSync(`${work}/offset.json`, JSON.stringify({ offset: +((Date.now() - t0) / 1000).toFixed(3) }));

    const tools = { page, wait, point, click, scrollTo, nav, T, B, ph, setRange, num };
    for (const l of scene.lines) {
      const slot = (l.durationInFrames / timeline.fps) * 1000;
      const started = Date.now();
      console.log(`  ▶ ${l.id} (${(slot / 1000).toFixed(1)}s)`);
      try { await CHOREO[l.id]?.(tools); } catch (e) { console.log("    skip:", String(e).slice(0, 70)); }
      const rem = slot - (Date.now() - started);
      if (rem > 0) await wait(rem); else console.log(`    ⚠ overran ${-rem}ms — this beat drifts`);
    }

    const v = await page.video();
    await ctx.close();
    await browser.close();
    webm = await v.path();
  }

  const offset = existsSync(`${work}/offset.json`)
    ? JSON.parse(readFileSync(`${work}/offset.json`, "utf8")).offset
    : +(probe(webm) - total).toFixed(3);

  // CRF 16 and no audio track. This is an intermediate the Remotion render re-encodes, so the
  // compression compounds; the megabytes are free here and the small UI text is what is at risk.
  ff(["-ss", String(offset), "-i", webm, "-an", "-t", String(total),
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
    "-vf", `fps=${timeline.fps}`, "-movflags", "+faststart", out]);
  console.log(`✓ ${out}  ${probe(out).toFixed(1)}s of ${total.toFixed(1)}s (trimmed ${offset}s lead-in)\n`);
};

const wanted = timeline.scenes.filter((s) => s.clip && (ONLY.length === 0 || ONLY.includes(s.id)));
if (!wanted.length) throw new Error("no recorded scenes matched — run scripts/vo.mjs first");
for (const scene of wanted) {
  console.log(`recording ${scene.id} → ${scene.route}`);
  await record(scene);
}
