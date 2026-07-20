// Run: npm test. The REAL x402 payment authorization — EIP-3009 sign ↔ facilitator verify.
// No funds/network: signing and verifying are pure cryptography (viem).
import assert from "node:assert/strict";
import test from "node:test";
import { signPayment, verifyPayment } from "../lib/x402pay.ts";

// Anvil account #1 — a throwaway demo "capped session key".
const PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const SIGNER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const PAYTO = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";
const NOW = 1_700_000_000;
const NONCE = "0x1111111111111111111111111111111111111111111111111111111111111111";

const req = (over = {}) => ({
  scheme: "exact",
  network: "arbitrum",
  maxAmountRequired: "20000000", // $20
  asset: USDC,
  payTo: PAYTO,
  resource: "https://api.premium.example/insight",
  maxTimeoutSeconds: 600,
  ...over,
});

test("sign → verify round-trips, recovering the payer", async () => {
  const { header } = await signPayment(req(), PK, { now: NOW, nonce: NONCE });
  const v = await verifyPayment(header, req(), { now: NOW });
  assert.equal(v.valid, true);
  assert.equal(v.from.toLowerCase(), SIGNER.toLowerCase());
});

test("a tampered amount breaks the signature", async () => {
  const { payload } = await signPayment(req(), PK, { now: NOW, nonce: NONCE });
  payload.payload.authorization.value = "1000000"; // forge $1 instead of $20
  const header = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
  const v = await verifyPayment(header, req(), { now: NOW });
  assert.equal(v.valid, false);
  assert.match(v.reason, /signature|payTo|underpaid/); // rejected, not accepted
});

test("an expired authorization is refused", async () => {
  const { header } = await signPayment(req(), PK, { now: NOW, nonce: NONCE, ttl: 300 });
  const v = await verifyPayment(header, req(), { now: NOW + 10_000 }); // way past validBefore
  assert.equal(v.valid, false);
  assert.match(v.reason, /expired/);
});

test("verifying against a different payTo is refused", async () => {
  const { header } = await signPayment(req(), PK, { now: NOW, nonce: NONCE });
  const v = await verifyPayment(header, req({ payTo: "0x0000000000000000000000000000000000000009" }), { now: NOW });
  assert.equal(v.valid, false);
  assert.match(v.reason, /payTo/);
});

test("underpaying the required amount is refused", async () => {
  const { header } = await signPayment(req(), PK, { now: NOW, nonce: NONCE }); // authorizes $20
  const v = await verifyPayment(header, req({ maxAmountRequired: "50000000" }), { now: NOW }); // needs $50
  assert.equal(v.valid, false);
  assert.match(v.reason, /underpaid/);
});
