// Records ONLY the 72s live-demo segment of the 3-minute finale pitch — the three beats in
// docs/PITCH_SCRIPT_3MIN.md, with no voiceover. The presenter speaks over it live; this file is
// also the backup to play if the venue wifi dies mid-pitch.
//
// Scene durations match the script's timing so the visuals land under the right sentence.
// Run: node scripts/video/record-demo.mjs   (BASE defaults to the deployed site)
import { chromium } from "playwright-core";

const BASE = process.env.BASE || "https://bareng-jade.vercel.app";
const W = 1280, H = 720;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: ".", size: { width: W, height: H } }, deviceScaleFactor: 1 });

// Presentation cursor — Playwright's real pointer is invisible in a recording, so draw one.
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
const move = async (x, y, ms = 720) => { await page.evaluate(([x, y]) => window.__mc && window.__mc(x, y), [x, y]).catch(() => {}); await wait(ms); };
const point = async (loc, ms = 720) => { const b = await box(loc); if (b) await move(b.x + b.width / 2, Math.min(H - 20, b.y + b.height / 2), ms); };
const clickIt = async (loc) => { const b = await box(loc); if (!b) return; const cx = b.x + b.width / 2, cy = Math.min(H - 20, b.y + b.height / 2); await move(cx, cy); await page.evaluate(([x, y]) => window.__rp && window.__rp(x, y), [cx, cy]).catch(() => {}); await loc.click({ timeout: 4000 }).catch(() => {}); await wait(300); };
const scrollTo = async (loc, ms = 900) => { await loc.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" })).catch(() => {}); await wait(ms); };
// Hold each scene to its scripted length, so the video stays in sync with the spoken lines.
const scene = async (id, secs, fn) => {
  const t0 = Date.now();
  console.log(`▶ ${id} (${secs}s)`);
  try { await fn(); } catch (e) { console.log("  skip:", String(e).slice(0, 70)); }
  const rem = secs * 1000 - (Date.now() - t0);
  if (rem > 0) await wait(rem); else console.log(`  ⚠ overran ${-rem}ms`);
};
const B = (name) => page.getByRole("button", { name, exact: false }).first();
const L = (name) => page.getByRole("link", { name, exact: false }).first();
// The amount input is a range slider; a native setter + input event is how React sees the change.
const setAmount = (v) => page.locator('input[type=range]').first()
  .evaluate((el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, String(v)); el.dispatchEvent(new Event("input", { bubbles: true })); }, v)
  .catch(() => {});

// ---- Beat A · one shared pot, paid by handle (27s) ----
await scene("a_pot", 11, async () => {
  await page.goto(BASE + "/app", { waitUntil: "domcontentloaded" });
  await wait(2500);
  await point(page.getByText("$420.00").first(), 1100);
  await point(page.getByText(/unified balance/i).first(), 900);
  await point(page.getByText("Budi").first(), 900);
  await point(page.getByText("Dewi").first(), 800);
});
await scene("a_pay", 16, async () => {
  await scrollTo(page.getByText("Spend as").first());
  await point(page.getByPlaceholder(/@sari or 0x/i).first(), 900);
  await setAmount(30); await wait(700);
  await point(B(/^Pay \$30/), 700);
  await clickIt(B(/^Pay \$30/));
  await wait(1600);                                  // let the settle state land
  await point(page.getByText(/settled on Arbitrum/i).first(), 1100);
});

// ---- Beat B · the 7702 cap refuses (20s) ----
await scene("b_overcap", 20, async () => {
  await point(page.getByText(/limit left/i).first(), 1200);
  await setAmount(60); await wait(600);
  await setAmount(85); await wait(900);              // 85 > the $70 Budi has left
  await point(B(/Over limit/), 1400);
  await point(page.getByText(/7702 session-key grant/i).first(), 1200);
});

// ---- Beat C · arisan + verifiable fair draw (25s) ----
await scene("c_arisan", 25, async () => {
  await clickIt(L("Arisan"));
  await wait(1500);                                  // client-side nav: fixed wait, never networkidle
  await point(page.getByRole("heading").first(), 1000);
  await point(page.getByText(/Verifiable fair draw/i).first(), 1400);
  await clickIt(B(/Fair draw/));
  await wait(900);
  await point(page.getByText(/Recompute from the seed/i).first(), 1600);
});

const vid = await page.video();
await ctx.close();
await browser.close();
console.log("VIDEO:", await vid.path());
