// Run: npm test  (node --test, Node 22.6+ type-stripping imports the .ts directly)
// Tests the PURE policy shape — no RPC/network. Proves the on-chain cap encodes the
// right thing: only USDC.transfer, amount <= limit, no native ETH.
import assert from "node:assert/strict";
import test from "node:test";
import { ParamCondition } from "@zerodev/permissions/policies";
import { spendCapPermission } from "../lib/zerodev.ts";

const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

test("cap permission binds to the token's transfer with a <= amount rule", () => {
  const p = spendCapPermission({ token: USDC, limit: 100_000000n }); // 100 USDC
  assert.equal(p.target, USDC); // checksummed target = the token
  assert.equal(p.functionName, "transfer");
  assert.equal(p.valueLimit, 0n); // never moves native ETH
  assert.equal(p.args[0], null); // any recipient
  assert.equal(p.args[1].condition, ParamCondition.LESS_THAN_OR_EQUAL);
  assert.equal(p.args[1].value, 100_000000n); // the cap, in base units
});

test("a different cap carries a different limit, same shape", () => {
  const p = spendCapPermission({ token: USDC, limit: 5_000000n });
  assert.equal(p.args[1].value, 5_000000n);
  assert.equal(p.args[1].condition, ParamCondition.LESS_THAN_OR_EQUAL);
});
