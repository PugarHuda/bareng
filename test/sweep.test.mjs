// Run: npm test  (node --test). Proves backend sweep detection: the pot finds exactly its
// own stealth receives and recovers the controlling key; a stranger's payment is ignored.
import assert from "node:assert/strict";
import test from "node:test";
import { generateMetaAddress, generateStealthAddress, addressFromPrivateKey } from "../lib/stealth.ts";
import { findSweepable } from "../lib/sweep.ts";

test("finds only the pot's receives, each with the controlling key", () => {
  const pot = generateMetaAddress();
  const other = generateMetaAddress();

  const mine1 = generateStealthAddress(pot.spendPub, pot.viewPub);
  const mine2 = generateStealthAddress(pot.spendPub, pot.viewPub);
  const notMine = generateStealthAddress(other.spendPub, other.viewPub);

  const sweepable = findSweepable([mine1, notMine, mine2], pot);

  const got = sweepable.map((s) => s.stealthAddress).sort();
  assert.deepEqual(got, [mine1.stealthAddress, mine2.stealthAddress].sort());
  assert.equal(sweepable.some((s) => s.stealthAddress === notMine.stealthAddress), false);

  // The recovered key actually controls each swept address.
  for (const s of sweepable) {
    assert.equal(addressFromPrivateKey(s.privateKey), s.stealthAddress);
  }
});

test("empty batch → nothing to sweep", () => {
  const pot = generateMetaAddress();
  assert.deepEqual(findSweepable([], pot), []);
});
