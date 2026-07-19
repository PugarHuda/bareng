// Run: npm test. Verifiable fair draw: deterministic from the seed, a true permutation (everyone
// present exactly once), verifiable, and seed-sensitive.
import assert from "node:assert/strict";
import test from "node:test";
import { drawOrder, verifyDraw } from "../lib/draw.ts";

const M = ["@budi", "@sari", "@dewi", "@maya", "@rio"];

test("same seed → same order (verifiable/deterministic)", () => {
  assert.deepEqual(drawOrder(M, "block-0xabc"), drawOrder(M, "block-0xabc"));
});

test("the result is a real permutation — everyone appears exactly once", () => {
  const order = drawOrder(M, "seed-1");
  assert.equal(order.length, M.length);
  assert.deepEqual([...order].sort(), [...M].sort());
});

test("different seeds generally give different orders", () => {
  // Not a hard guarantee for any single pair, but across several seeds at least one must differ.
  const base = drawOrder(M, "s0").join(",");
  const changed = ["s1", "s2", "s3"].some((s) => drawOrder(M, s).join(",") !== base);
  assert.ok(changed, "seed actually drives the order");
});

test("verifyDraw accepts the real order and rejects a tampered one", () => {
  const seed = "0xdeadbeef";
  const fair = drawOrder(M, seed);
  assert.equal(verifyDraw(M, seed, fair), true);
  const tampered = [...fair];
  [tampered[0], tampered[1]] = [tampered[1], tampered[0]]; // someone reshuffles to collect first
  assert.equal(verifyDraw(M, seed, tampered), false);
});

test("empty seed is refused (can't have an unseeded 'fair' draw)", () => {
  assert.throws(() => drawOrder(M, ""), /seed required/);
});

test("roughly uniform: over many seeds, position 0 is not monopolized by one member", () => {
  const firstCounts = {};
  for (let i = 0; i < 200; i++) {
    const first = drawOrder(M, `seed-${i}`)[0];
    firstCounts[first] = (firstCounts[first] ?? 0) + 1;
  }
  // With 5 members over 200 draws, expected ~40 each; assert nobody is absurdly over/under-picked.
  for (const m of M) assert.ok(firstCounts[m] > 15 && firstCounts[m] < 90, `${m}: ${firstCounts[m]}`);
});
