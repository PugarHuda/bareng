// Run: npm test. The receipts model — categories are clamped, memos bounded, format is stable.
import assert from "node:assert/strict";
import test from "node:test";
import { makeReceipt, formatReceipt, CATEGORIES } from "../lib/receipts.ts";

test("makeReceipt clamps an unknown category to Other", () => {
  const r = makeReceipt({ from: "@budi", to: "@sari", amount: 30, category: "Crypto", ts: 1 });
  assert.equal(r.category, "Other");
});

test("makeReceipt keeps a valid category and bounds the memo to 80 chars", () => {
  const r = makeReceipt({ from: "@budi", to: "@sari", amount: 30, category: "Food", memo: "x".repeat(200), ts: 1 });
  assert.equal(r.category, "Food");
  assert.equal(r.memo.length, 80);
  assert.ok(CATEGORIES.includes(r.category));
});

test("formatReceipt renders who → who with amount, category, memo", () => {
  const r = makeReceipt({ from: "@budi", to: "@dewi", amount: 12, category: "Transport", memo: "grab", ts: 1 });
  assert.equal(formatReceipt(r), "@budi paid $12 → @dewi · Transport — grab");
});

test("formatReceipt omits the dash when there is no memo", () => {
  const r = makeReceipt({ from: "@budi", to: "@dewi", amount: 12, category: "Fun", ts: 1 });
  assert.equal(formatReceipt(r), "@budi paid $12 → @dewi · Fun");
});

test("makeReceipt carries a real txHash through, and omits the key when absent", () => {
  const withHash = makeReceipt({ from: "@budi", to: "@warung", amount: 0.03, category: "Food", txHash: "0xabc", ts: 1 });
  assert.equal(withHash.txHash, "0xabc"); // clickable → Arbiscan
  const noHash = makeReceipt({ from: "@budi", to: "@warung", amount: 0.03, category: "Food", ts: 1 });
  assert.ok(!("txHash" in noHash)); // demo/no-settlement receipts stay plain
});
