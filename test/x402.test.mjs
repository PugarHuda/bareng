// Run: npm test  (node --test). Proves the guardrail: an agent with a capped 7702 session
// key pays via x402 within the cap, and is REFUSED (without paying) when it would exceed it.
import assert from "node:assert/strict";
import test from "node:test";
import {
  parsePaymentRequired,
  selectRequirement,
  chargeAmount,
  chargeWithinCap,
  payAndRetry,
} from "../lib/x402.ts";

const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const WANT = { asset: USDC, network: "arbitrum" };
const NOW = 1000;
const budi = { address: "0xbudi", name: "Budi", limit: 100, periodSeconds: 604800, spent: 0, periodStart: NOW };

function req(amountAtomic) {
  return { scheme: "exact", network: "arbitrum", maxAmountRequired: amountAtomic, asset: USDC, payTo: "0xpay", resource: "https://api/x" };
}
const body402 = (amountAtomic) => ({ x402Version: 1, accepts: [req(amountAtomic)] });

test("parse rejects non-402 and malformed bodies", () => {
  assert.throws(() => parsePaymentRequired(200, body402("1000000")));
  assert.throws(() => parsePaymentRequired(402, { x402Version: 1, accepts: [] }));
  assert.equal(parsePaymentRequired(402, body402("2000000")).length, 1);
});

test("selectRequirement matches token+network, charge converts from atomic", () => {
  const reqs = parsePaymentRequired(402, body402("2000000")); // 2 USDC
  const chosen = selectRequirement(reqs, WANT);
  assert.ok(chosen);
  assert.equal(chargeAmount(chosen), 2);
  assert.equal(selectRequirement(reqs, { asset: USDC, network: "base" }), null);
});

test("chargeWithinCap mirrors the on-chain cap", () => {
  assert.equal(chargeWithinCap(req("50000000"), budi, NOW), true); // $50 <= $100
  assert.equal(chargeWithinCap(req("150000000"), budi, NOW), false); // $150 > $100
});

test("payAndRetry: within cap → pays once and retries to 200", async () => {
  let calls = 0;
  const pay = async () => "PAYMENT_PROOF";
  const fetchLike = async (_url, init) => {
    calls++;
    if (!init?.headers?.["X-PAYMENT"]) return { status: 402, json: async () => body402("2000000") };
    return { status: 200, json: async () => ({ ok: true }) };
  };
  const res = await payAndRetry(fetchLike, "https://api/x", budi, WANT, NOW, pay);
  assert.equal(res.status, 200);
  assert.equal(res.paid, true);
  assert.equal(res.charge, 2);
  assert.deepEqual(res.body, { ok: true }); // the retried 200's body is returned
  assert.equal(calls, 2); // 402 then retry
});

test("payAndRetry: over cap → throws WITHOUT calling pay", async () => {
  let paid = false;
  const pay = async () => { paid = true; return "X"; };
  const fetchLike = async () => ({ status: 402, json: async () => body402("500000000") }); // $500
  await assert.rejects(
    payAndRetry(fetchLike, "https://api/x", budi, WANT, NOW, pay),
    /exceeds Budi's cap/,
  );
  assert.equal(paid, false); // the agent never spent
});
