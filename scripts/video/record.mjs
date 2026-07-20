import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3000";
const W = 1280, H = 720;
const TL = JSON.parse(readFileSync("timeline.json", "utf8"));
const dur = (id) => TL.scenes.find((s) => s.id === id).dur;

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: ".", size: { width: W, height: H } }, deviceScaleFactor: 1 });

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
const safe = async (fn) => { try { await fn(); } catch (e) { console.log("  skip:", String(e).slice(0, 60)); } };
const scene = async (id, fn) => { const t0 = Date.now(); console.log(`▶ ${id} (${dur(id)}s)`); await safe(fn); const rem = dur(id) * 1000 - (Date.now() - t0); if (rem > 0) await wait(rem); else console.log(`  ⚠ overran ${-rem}ms`); };
const L = (name) => page.getByRole("link", { name, exact: false }).first();
const B = (name) => page.getByRole("button", { name, exact: false }).first();
// One deck slide: advance one slide, then point at its heading and hold for the narration.
const deckSlide = (id) => scene(id, async () => {
  await page.keyboard.press("ArrowRight"); await wait(550);
  await point(page.getByRole("heading").first(), 800);
});

await scene("landing", async () => {
  await page.goto(BASE + "/", { waitUntil: "networkidle" }); await wait(400);
  await point(page.locator("h1").first());
  await point(page.getByText("@lunchsquad").first(), 800);
});
await scene("proof", async () => {
  await scrollTo(page.getByText("proven on-chain").first());
  await point(page.getByText("Shared-UA spend").first());
  await point(page.getByText("x402 agent payment").first(), 800);
  await point(page.getByText("Private stealth sweep").first(), 800);
});
await scene("openapp", async () => {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await wait(700);
  await clickIt(L("Open the app")); await wait(750);
  await point(page.getByText("$420.00").first(), 900);
});
await scene("members", async () => {
  await scrollTo(page.getByText("Members & weekly limits").first());
  for (const h of ["Budi", "Sari", "Dewi"]) await point(page.getByText(h, { exact: true }).first(), 620);
});
await scene("pay", async () => {
  await scrollTo(page.getByText("Spend as").first());
  await point(page.getByPlaceholder(/@sari or 0x/i).first(), 600);
  await clickIt(B(/^Pay \$/)); await wait(700);
  await point(page.getByText("Group receipts").first(), 800);
});
await scene("overcap", async () => {
  const rng = page.locator('input[type=range]').first();
  await point(rng, 500);
  await rng.evaluate((el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, el.max); el.dispatchEvent(new Event("input", { bubbles: true })); }).catch(() => {});
  await wait(500); await point(B(/Over limit/), 900);
});
await scene("receipts", async () => {
  await scrollTo(page.getByText("Group receipts").first());
  await point(page.locator("a[href*='arbiscan.io/tx']").first(), 800);
  await point(page.locator("a[href*='arbiscan.io/tx']").nth(1), 800);
});
await scene("deposit", async () => {
  const d = B(/Deposit from any chain/);
  await scrollTo(d, 700); await clickIt(d); await wait(600);
  await point(page.getByText(/Smart Routing Address/i).first(), 900);
});
await scene("arisan", async () => {
  await clickIt(L("Arisan")); await wait(750);
  await clickIt(B(/Fair draw/)); await wait(600);
  await point(page.getByText(/→/).first(), 900);
});
await scene("split", async () => {
  await clickIt(L("Split")); await wait(750);
  await clickIt(page.getByRole("button").filter({ hasText: /add|expense|log/i }).first()); await wait(500);
});
await scene("receive", async () => {
  await clickIt(L("Receive")); await wait(750);
  await clickIt(B(/Generate/)); await wait(600);
  await point(page.locator("text=/0x[0-9a-fA-F]{10,}/").first(), 900);
});
await scene("agent", async () => {
  await clickIt(L("Agent")); await wait(750);
  await clickIt(B(/fetch premium data/)); await wait(1800);
  await point(page.getByText(/200 OK/).first(), 900);
});
await scene("earn", async () => {
  await clickIt(L("Earn")); await wait(750);
  await clickIt(B(/Put \$\d+ to work/)); await wait(500);
  await point(page.getByText(/Real Aave v3 batch/i).first(), 900);
});
await scene("deck_open", async () => {
  await clickIt(L("Home")); await wait(750);
  await clickIt(L("Pitch")); await wait(800);
  await point(page.locator("h1").first(), 800);
});
await deckSlide("deck_problem");
await deckSlide("deck_solution");
await deckSlide("deck_7702");
await deckSlide("deck_proof");
await deckSlide("deck_features");
await deckSlide("deck_partners");
await deckSlide("deck_honest");
await deckSlide("deck_crosschain");
await deckSlide("deck_win");
await deckSlide("deck_ask");

const vid = await page.video();
await ctx.close();
await browser.close();
console.log("VIDEO:", await vid.path());
