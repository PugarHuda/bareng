// Run: npm test. Group-spending insights over the receipt log: totals, shares (sum to 1), sorting,
// and empty-log safety.
import assert from "node:assert/strict";
import test from "node:test";
import { spendByCategory, spendByMember, totalSpent } from "../lib/insights.ts";
import { makeReceipt } from "../lib/receipts.ts";

const R = [
  makeReceipt({ from: "@budi", to: "@x", amount: 30, category: "Food", ts: 1 }),
  makeReceipt({ from: "@sari", to: "@y", amount: 10, category: "Food", ts: 2 }),
  makeReceipt({ from: "@budi", to: "@z", amount: 20, category: "Transport", ts: 3 }),
];

test("spendByCategory totals, sorts desc, and shares sum to 1", () => {
  const cats = spendByCategory(R);
  assert.equal(cats[0].category, "Food"); // 40 > 20
  assert.equal(cats[0].total, 40);
  assert.equal(cats[1].category, "Transport");
  assert.ok(Math.abs(cats.reduce((s, c) => s + c.share, 0) - 1) < 1e-9);
  assert.ok(Math.abs(cats[0].share - 40 / 60) < 1e-9);
});

test("spendByMember sums per spender, largest first", () => {
  const m = spendByMember(R);
  assert.deepEqual(m, [{ member: "@budi", total: 50 }, { member: "@sari", total: 10 }]);
});

test("totalSpent sums the log", () => {
  assert.equal(totalSpent(R), 60);
});

test("empty log is safe (no divide-by-zero)", () => {
  assert.deepEqual(spendByCategory([]), []);
  assert.deepEqual(spendByMember([]), []);
  assert.equal(totalSpent([]), 0);
});
