// Run: npm test. Arisan (ROSCA) state machine — the money path: fair rotation, one payout each,
// no double-contributing, payout only when fully funded.
import assert from "node:assert/strict";
import test from "node:test";
import {
  newArisan, potThisRound, recipientThisRound, roundReady, isComplete, contribute, payout,
} from "../lib/arisan.ts";

const M = ["@budi", "@sari", "@dewi"];

test("new arisan: pot = contribution × members, round 0 recipient is first in order", () => {
  const a = newArisan(M, 10);
  assert.equal(potThisRound(a), 30);
  assert.equal(recipientThisRound(a), "@budi");
  assert.equal(roundReady(a), false);
});

test("rejects bad rosters", () => {
  assert.throws(() => newArisan(["@solo"], 10), /at least 2/);
  assert.throws(() => newArisan(["@a", "@a"], 10), /duplicate/);
  assert.throws(() => newArisan(M, 0), /> 0/);
  assert.throws(() => newArisan(M, NaN), /> 0/); // NaN <= 0 is false — must still reject
});

test("everyone (incl. the recipient) contributes; only then can it pay out", () => {
  let a = newArisan(M, 10);
  a = contribute(a, "@budi"); // the round-0 recipient still pays in
  a = contribute(a, "@sari");
  assert.equal(roundReady(a), false);
  assert.throws(() => payout(a), /not everyone/);
  a = contribute(a, "@dewi");
  assert.equal(roundReady(a), true);

  const { arisan, recipient, amount } = payout(a);
  assert.equal(recipient, "@budi");
  assert.equal(amount, 30);
  assert.equal(arisan.round, 1);
  assert.deepEqual(arisan.paidThisRound, []);
  assert.deepEqual(arisan.received, ["@budi"]);
});

test("no double-contribute, no non-members", () => {
  let a = newArisan(M, 10);
  a = contribute(a, "@budi");
  assert.throws(() => contribute(a, "@budi"), /already paid/);
  assert.throws(() => contribute(a, "@maya"), /not a member/);
});

test("full cycle: each member collects exactly once, then complete", () => {
  let a = newArisan(M, 10);
  const winners = [];
  for (let r = 0; r < M.length; r++) {
    for (const m of M) a = contribute(a, m);
    const res = payout(a);
    winners.push(res.recipient);
    a = res.arisan;
  }
  assert.deepEqual(winners.sort(), [...M].sort()); // everyone won once
  assert.equal(isComplete(a), true);
  assert.equal(recipientThisRound(a), null);
  assert.throws(() => contribute(a, "@budi"), /complete/);
});
