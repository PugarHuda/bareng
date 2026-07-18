// Run: npm test. The earn/yield builders — idle calc, projection, and the Aave approve+supply batch.
import assert from "node:assert/strict";
import test from "node:test";
import { Interface, getAddress } from "ethers";
import { idleAmount, projectedYield, buildSupply, AAVE_V3_POOL_ARBITRUM } from "../lib/yield.ts";

const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const UA = "0x14eB5B6A11C6Dd3e5f5a1AeeB126ab3a2fe0a22c";

test("idleAmount keeps a reserve liquid and never goes negative", () => {
  assert.equal(idleAmount(420, 100), 320);
  assert.equal(idleAmount(50, 100), 0);
});

test("projectedYield scales with amount, apy, and time", () => {
  assert.equal(projectedYield(1000, 0.05, 365), 50);
  assert.ok(Math.abs(projectedYield(1000, 0.05, 30) - 4.1096) < 0.001);
});

test("buildSupply emits approve(Pool) then supply(asset, amount, onBehalfOf) for the UA", () => {
  const batch = buildSupply(USDC, 320_000000n, UA);
  assert.equal(batch.transactions.length, 2);

  const erc20 = new Interface(["function approve(address spender, uint256 amount)"]);
  const [spender, approveAmt] = erc20.decodeFunctionData("approve", batch.transactions[0].data);
  assert.equal(spender, getAddress(AAVE_V3_POOL_ARBITRUM));
  assert.equal(approveAmt, 320_000000n);
  assert.equal(batch.transactions[0].to, getAddress(USDC));

  const pool = new Interface(["function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)"]);
  const [asset, amount, onBehalfOf] = pool.decodeFunctionData("supply", batch.transactions[1].data);
  assert.equal(asset, getAddress(USDC));
  assert.equal(amount, 320_000000n);
  assert.equal(onBehalfOf, getAddress(UA)); // lent on behalf of the pot's UA, not the sender
  assert.equal(batch.transactions[1].to, getAddress(AAVE_V3_POOL_ARBITRUM));
});
