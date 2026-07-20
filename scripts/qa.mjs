// End-to-end QA sweep (Playwright, system Chrome). Asserts real OUTCOMES — not just "no crash" —
// plus adversarial inputs, responsive widths, a11y, and the pitch deck. Exits non-zero on any FAIL,
// so it doubles as a CI gate.
//
//   1) build + serve:   npm run build && npm run start   (or: npm run dev)
//   2) in another shell: npm run qa                       (BASE=http://localhost:3000 by default)
//
// Chrome: uses your installed Chrome via channel 'chrome'; override with CHROME_PATH=/path/to/chrome.

import { chromium } from "playwright-core";

const BASE = process.env.BASE || "http://localhost:3000";
const F = [];
const add = (p, k, s, d = "") => F.push({ p, k, s, d });

// preflight: is the app up?
try { const r = await fetch(BASE); if (!r.ok && r.status !== 402) throw new Error(`status ${r.status}`); }
catch (e) { console.error(`✗ ${BASE} is not reachable (${e.message}).\n  Start it: npm run build && npm run start`); process.exit(2); }

const launch = async () => {
  try { return await chromium.launch({ channel: "chrome", headless: true }); }
  catch { return await chromium.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true }); }
};
const browser = await launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const errors = [];
const page = await ctx.newPage();
let route = "";
page.on("pageerror", (e) => errors.push(`[${route}] PAGEERROR ${String(e).slice(0, 140)}`));
page.on("console", (m) => { if (m.type() === "error" && !/402|404/.test(m.text())) errors.push(`[${route}] CONSOLE ${m.text().slice(0, 140)}`); });
const go = async (r) => { route = r; await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 20000 }); await page.waitForTimeout(300); };
const click = (loc) => loc.click({ timeout: 3000 }).catch(() => {});
const bodyText = () => page.locator("body").innerText();
const num = (s) => { const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : NaN; };

// WCAG contrast (fg vs first opaque ancestor bg) — flags text below AA.
const CONTRAST = () => {
  const lum = (r, g, b) => { const a = [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const bgOf = (el) => { let n = el; while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c; n = n.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const out = []; const seen = new Set();
  for (const el of document.querySelectorAll("*")) {
    const txt = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!txt || txt.length < 2) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const st = getComputedStyle(el); if (st.visibility === "hidden" || st.opacity === "0" || st.display === "none") continue;
    const fg = parse(st.color); if (!fg || fg.a < 0.1) continue;
    const bg = bgOf(el); const mix = (k) => Math.round(fg[k] * fg.a + bg[k] * (1 - fg.a));
    const ratio = (Math.max(lum(mix("r"), mix("g"), mix("b")), lum(bg.r, bg.g, bg.b)) + 0.05) / (Math.min(lum(mix("r"), mix("g"), mix("b")), lum(bg.r, bg.g, bg.b)) + 0.05);
    const size = parseFloat(st.fontSize); const large = size >= 24 || (size >= 18.66 && parseInt(st.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) { const key = txt.slice(0, 30) + Math.round(ratio * 100); if (seen.has(key)) continue; seen.add(key); out.push({ txt: txt.slice(0, 40), ratio: Math.round(ratio * 100) / 100, need }); }
  }
  return out;
};

const ROUTES = ["/", "/deck", "/app", "/admin", "/agent", "/receive", "/earn", "/arisan", "/split"];

try {
  // ---- routes: status, errors, contrast ----
  for (const r of ROUTES) {
    const resp = await page.goto(BASE + r, { waitUntil: "networkidle" }).catch(() => null); route = r;
    add(r, "route 200", resp && resp.status() === 200 ? "PASS" : "FAIL", resp ? String(resp.status()) : "no-response");
    const cfails = await page.evaluate(CONTRAST).catch(() => []);
    add(r, "WCAG-AA contrast", cfails.length === 0 ? "PASS" : "FAIL", cfails.length ? `${cfails.length} fail (${cfails[0].txt} ${cfails[0].ratio}:1)` : "");
  }
  const r404 = await page.goto(BASE + "/nope-xyz").catch(() => null);
  add("/nope-xyz", "unknown route → 404", r404 && r404.status() === 404 ? "PASS" : "FAIL", r404 ? String(r404.status()) : "");

  // ---- /app money-path outcomes ----
  const appState = () => page.evaluate(() => ({
    balance: (document.body.innerText.match(/\$[\d,]+\.\d{2}/) || [])[0],
    payBtn: [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).find((x) => /^(Pay \$|Over limit|Not enough|Enter a valid)/.test(x)) || "",
    lefts: [...document.querySelectorAll("p")].filter((p) => /left$/.test(p.textContent.trim())).map((p) => p.textContent.trim()),
  }));
  await go("/app");
  const b0 = num((await appState()).balance);
  await click(page.getByRole("button", { name: /^Pay \$\d/ })); await page.waitForTimeout(700);
  add("/app", "pay decrements balance", num((await appState()).balance) < b0 ? "PASS" : "FAIL", `${b0}→${num((await appState()).balance)}`);
  const sari = page.getByRole("button").filter({ hasText: /@sari/ }).first();
  if (await sari.count()) { await click(sari); add("/app", "switch spender to @sari", /sari/i.test(await page.locator("text=/Spend as/i").first().textContent().catch(() => "")) ? "PASS" : "WARN"); }
  const payee = page.getByPlaceholder(/@sari or 0x/i).first();
  if (await payee.count()) { await payee.fill("!!!bad!!!"); await page.waitForTimeout(200); add("/app", "invalid payee blocks pay", /Enter a valid payee/.test((await appState()).payBtn) ? "PASS" : "FAIL", (await appState()).payBtn); await payee.fill("@sari"); }
  const memo = page.getByPlaceholder(/What.s it for/i).first();
  if (await memo.count()) { await memo.fill("x".repeat(200)); add("/app", "memo bounded to 80", (await memo.inputValue()).length === 80 ? "PASS" : "FAIL"); await memo.fill(""); }
  const rng = page.locator('input[type=range]').first();
  if (await rng.count()) {
    await click(page.getByRole("button", { name: /^Pay \$\d/ })); await page.waitForTimeout(700);
    await rng.evaluate((el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, el.max); el.dispatchEvent(new Event("input", { bubbles: true })); }); await page.waitForTimeout(300);
    const disabled = await page.getByRole("button", { name: /Over limit/ }).isDisabled().catch(() => null);
    add("/app", "over-cap → Over limit + disabled", /Over limit/.test((await appState()).payBtn) && disabled === true ? "PASS" : "FAIL");
  }
  await go("/app");
  const before = num((await appState()).balance);
  const pay = page.getByRole("button", { name: /^Pay \$\d/ });
  await Promise.all([pay.click({ force: true }).catch(() => {}), pay.click({ force: true }).catch(() => {})]); await page.waitForTimeout(900);
  add("/app", "double-click doesn't double-spend", (before - num((await appState()).balance)) <= 10.0001 ? "PASS" : "FAIL", `Δ ${(before - num((await appState()).balance)).toFixed(2)}`);

  // ---- /agent real x402 ----
  await go("/agent");
  await click(page.getByRole("button", { name: /fetch premium data/i })); await page.waitForTimeout(1800);
  let log = await page.locator("section").last().innerText();
  add("/agent", "x402 within cap → 200 + recovered payer", /200 OK/.test(log) && /paidBy 0x/.test(log) ? "PASS" : "FAIL");
  await click(page.getByRole("button", { name: /Reset week/i }));
  await page.locator('input[type=range]').first().evaluate((el) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set; set.call(el, "150"); el.dispatchEvent(new Event("input", { bubbles: true })); }); await page.waitForTimeout(300);
  await click(page.getByRole("button", { name: /fetch premium data/i })); await page.waitForTimeout(900);
  add("/agent", "x402 over cap refused before signing", /exceeds .* cap|refused/i.test(await page.locator("section").last().innerText()) ? "PASS" : "FAIL");

  // ---- /receive, /earn, /arisan, /split, /admin ----
  await go("/receive");
  const gen = page.getByRole("button", { name: /Generate/i }).first(); const a = [];
  if (await gen.count()) { for (let i = 0; i < 2; i++) { await click(gen); await page.waitForTimeout(400); a.push((await page.locator("text=/0x[0-9a-fA-F]{6,}/").allInnerTexts()).join("|")); } add("/receive", "two distinct one-time addresses", a[0] && a[0] !== a[1] ? "PASS" : "WARN"); }

  await go("/earn");
  await click(page.getByRole("button", { name: /Put \$\d+ to work/i })); await page.waitForTimeout(400);
  const et = await bodyText(); add("/earn", "builds real Aave v3 batch (approve+supply)", /0x095ea7b3/.test(et) && /0x617ba037/.test(et) ? "PASS" : "FAIL");

  await go("/arisan");
  const draw = page.getByRole("button", { name: /Fair draw/i }).first();
  if ((await draw.count()) && (await draw.isEnabled().catch(() => false))) { await click(draw); await page.waitForTimeout(400); const bt = await bodyText();
    add("/arisan", "fair draw → verifiable order + seed", /→/.test(bt) && /seed|recompute|drawOrder/i.test(bt) ? "PASS" : "FAIL", (bt.match(/@\w+( → @\w+)+/) || [""])[0].slice(0, 40)); }

  await go("/split");
  const s0 = await bodyText(); const addExp = page.getByRole("button").filter({ hasText: /add|expense|log|\+/i }).first();
  if (await addExp.count()) { await click(addExp); await page.waitForTimeout(300); await click(addExp); await page.waitForTimeout(300); add("/split", "adding expenses updates settle-up", (await bodyText()) !== s0 ? "PASS" : "WARN"); }

  await go("/admin");
  const hi = page.locator("input").first();
  if (await hi.count()) { await hi.fill("maya"); const inv = page.getByRole("button").filter({ hasText: /invite|grant|add|sign/i }).first(); if (await inv.count()) { await click(inv); await page.waitForTimeout(500); add("/admin", "invite @maya → signed grant", /maya|grant|signed|invited|0x/i.test(await bodyText()) ? "PASS" : "WARN"); } }

  // ---- deck ----
  await go("/deck");
  const counter = () => page.locator("text=/^\\d+ \\/ \\d+$/").first().innerText().catch(() => "");
  add("/deck", "renders slide 1", /Money,/.test(await page.locator("h1").first().innerText().catch(() => "")) ? "PASS" : "FAIL", await counter());
  for (let i = 0; i < 4; i++) { await page.keyboard.press("ArrowRight"); await page.waitForTimeout(150); }
  add("/deck", "arrow-nav reaches proof wall (slide 5)", (await counter()).startsWith("5") ? "PASS" : "FAIL", await counter());
  add("/deck", "proof-wall tx links", (await page.locator("a[href*='arbiscan'],a[href*='etherscan']").count()) >= 5 ? "PASS" : "WARN");
  await page.keyboard.press("End"); await page.waitForTimeout(150);
  add("/deck", "End → last slide", /(\d+) \/ \1/.test(await counter()) ? "PASS" : "WARN", await counter());

  // ---- responsive ----
  for (const w of [360, 768, 1024]) for (const r of ["/", "/deck", "/app"]) {
    await page.setViewportSize({ width: w, height: 900 }); await go(r);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    add(`${r}@${w}`, "no horizontal overflow", ov <= 1 ? "PASS" : "FAIL", `${ov}px`);
  }
  await page.setViewportSize({ width: 1280, height: 1000 });

  // ---- a11y focus ----
  await go("/app"); await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  const fv = await page.evaluate(() => { const el = document.activeElement; if (!el || el === document.body) return "none"; const s = getComputedStyle(el); return (s.outlineStyle !== "none" && s.outlineWidth !== "0px") || s.boxShadow !== "none" ? "visible" : "none"; });
  add("/app", "keyboard focus ring visible", fv === "visible" ? "PASS" : "WARN", fv);
} catch (e) { add("harness", "unexpected throw", "FAIL", String(e).slice(0, 120)); }

await browser.close();
const cnt = (s) => F.filter((f) => f.s === s).length;
const fails = cnt("FAIL");
console.log(`\n=== QA: ${F.length} cases · ${cnt("PASS")} PASS · ${fails} FAIL · ${cnt("WARN")} WARN ===\n`);
for (const f of F) if (f.s !== "PASS") console.log(`  ${f.s.padEnd(4)} [${f.p}] ${f.k}${f.d ? `  — ${f.d}` : ""}`);
console.log(F.every((f) => f.s === "PASS") ? "  (all PASS)" : "");
console.log(`\nRuntime errors (non-402/404): ${errors.length}`);
errors.slice(0, 12).forEach((e) => console.log("  " + e));
if (fails || errors.length) { console.log(`\n✗ QA FAILED (${fails} fail, ${errors.length} runtime errors)`); process.exit(1); }
console.log(`\n✓ QA PASSED`);
