// Run: npm test. Settle-up money path: net balances sum to zero, and the minimized transfers
// actually square everyone up (apply them → everyone nets to 0), in fewest hops.
import assert from "node:assert/strict";
import test from "node:test";
import { netBalances, settleUp } from "../lib/settle.ts";

// Apply the transfers to the net balances and assert everyone ends at ~0.
function residual(expenses) {
  const bal = netBalances(expenses);
  for (const t of settleUp(expenses)) {
    bal[t.from] = (bal[t.from] ?? 0) + t.amount; // debtor pays out → their negative balance rises
    bal[t.to] = (bal[t.to] ?? 0) - t.amount; // creditor is repaid → their positive balance falls
  }
  return Object.values(bal).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
}

test("net balances sum to zero", () => {
  const bal = netBalances([{ payer: "@budi", amount: 30, split: ["@budi", "@sari", "@dewi"] }]);
  assert.ok(Math.abs(Object.values(bal).reduce((a, b) => a + b, 0)) < 1e-9);
  assert.equal(bal["@budi"], 20); // paid 30, owes 10 → net +20
  assert.equal(bal["@sari"], -10);
});

test("one dinner, one payer: the two others each send their share, 2 transfers", () => {
  const ts = settleUp([{ payer: "@budi", amount: 30, split: ["@budi", "@sari", "@dewi"] }]);
  assert.equal(ts.length, 2);
  for (const t of ts) {
    assert.equal(t.to, "@budi");
    assert.equal(t.amount, 10);
  }
});

test("crossing debts net out to fewer transfers than expenses", () => {
  // Budi buys lunch (30, all 3), Sari buys coffee (15, all 3). Net should still settle cleanly.
  const expenses = [
    { payer: "@budi", amount: 30, split: ["@budi", "@sari", "@dewi"] },
    { payer: "@sari", amount: 15, split: ["@budi", "@sari", "@dewi"] },
  ];
  assert.ok(residual(expenses) < 1e-9, "everyone settles to zero");
  assert.ok(settleUp(expenses).length <= 2, "fewer transfers than the 5 raw debts");
});

test("uneven split (payer not in the split) still balances", () => {
  const expenses = [{ payer: "@budi", amount: 20, split: ["@sari", "@dewi"] }]; // Budi treats them
  const ts = settleUp(expenses);
  assert.ok(residual(expenses) < 1e-9);
  assert.equal(ts.length, 2);
  for (const t of ts) assert.equal(t.amount, 10);
});

test("float dust never survives — thirds conserve to the exact cent", () => {
  // $10 split 3 ways = 3.333…; the indivisible cent must be spread, not dropped. Value is
  // conserved EXACTLY (residual 0), and budi (owed $6.66) is repaid $6.66 — no penny vanishes.
  const expenses = [{ payer: "@budi", amount: 10, split: ["@budi", "@sari", "@dewi"] }];
  for (const t of settleUp(expenses)) {
    assert.equal(Math.round(t.amount * 100), t.amount * 100, "amount is whole cents");
  }
  assert.ok(residual(expenses) < 1e-9, "no rounding remainder left unsettled");
  const bal = netBalances(expenses);
  assert.ok(Math.abs(Object.values(bal).reduce((a, b) => a + b, 0)) < 1e-9, "balances sum to zero");
  assert.equal(bal["@budi"], 6.66); // paid 10, share 3.34 → net +6.66, and it's fully repaid
});

test("rejects bad expenses", () => {
  assert.throws(() => netBalances([{ payer: "@a", amount: 0, split: ["@a"] }]), /> 0/);
  assert.throws(() => netBalances([{ payer: "@a", amount: 5, split: [] }]), /at least one/);
});

test("nothing owed → no transfers", () => {
  // Everyone paid for only themselves.
  const expenses = [
    { payer: "@budi", amount: 10, split: ["@budi"] },
    { payer: "@sari", amount: 10, split: ["@sari"] },
  ];
  assert.equal(settleUp(expenses).length, 0);
});
