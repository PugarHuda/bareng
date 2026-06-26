// Run: npm test  (node --test)
// ponytail: limits.ts is TS; this test imports the logic re-stated as plain JS
// would drift. Instead we test the behaviour contract directly against the
// compiled module via tsx-free dynamic import of the source through Node's
// type-stripping (Node 22.6+ --experimental-strip-types). If your Node is older,
// the same asserts hold — port them once during build.
import assert from "node:assert/strict";
import test from "node:test";
import {
  canSpend,
  remaining,
  recordSpend,
  spentInPeriod,
} from "../lib/limits.ts";

const WEEK = 604800;
const base = {
  address: "0xabc",
  name: "Budi",
  limit: 100,
  periodSeconds: WEEK,
  spent: 0,
  periodStart: 1000,
};

test("fresh member can spend up to the cap, not over", () => {
  assert.equal(canSpend(base, 100, 1000), true);
  assert.equal(canSpend(base, 100.01, 1000), false);
  assert.equal(canSpend(base, 0, 1000), false); // zero/negative rejected
});

test("remaining shrinks after a spend", () => {
  const m = recordSpend(base, 30, 1000);
  assert.equal(remaining(m, 1000), 70);
  assert.equal(canSpend(m, 71, 1000), false);
  assert.equal(canSpend(m, 70, 1000), true);
});

test("period resets after the window elapses", () => {
  const m = recordSpend(base, 100, 1000); // maxed out
  assert.equal(remaining(m, 1000), 0);
  assert.equal(spentInPeriod(m, 1000 + WEEK), 0); // new window
  assert.equal(canSpend(m, 100, 1000 + WEEK), true);
});

test("recordSpend never mutates and refuses over-limit", () => {
  const before = { ...base };
  assert.throws(() => recordSpend(base, 999, 1000));
  assert.deepEqual(base, before); // untouched
});
