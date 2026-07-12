// Run: npm test  (node --test, Node 22.6+ type-stripping imports the .ts directly)
import assert from "node:assert/strict";
import test from "node:test";
import { Wallet } from "ethers";
import { createSessionKey, signGrant, verifyGrant } from "../lib/sessionKey.ts";

const owner = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const account = "0x000000000000000000000000000000000000dEaD";
const usdc = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

function grant(over = {}) {
  return {
    account,
    sessionKey: "0x1111111111111111111111111111111111111111",
    member: "0x2222222222222222222222222222222222222222",
    limit: 100_000000n, // 100 USDC (6dp)
    periodSeconds: 604800n,
    token: usdc,
    ...over,
  };
}

test("owner-signed grant verifies; a stranger's does not", async () => {
  const g = grant();
  const sig = await signGrant(owner, g);
  assert.equal(verifyGrant(g, sig, owner.address), true);
  const stranger = "0x0000000000000000000000000000000000000001";
  assert.equal(verifyGrant(g, sig, stranger), false);
});

test("tampering with the cap invalidates the signature", async () => {
  const g = grant();
  const sig = await signGrant(owner, g);
  assert.equal(verifyGrant({ ...g, limit: 999_000000n }, sig, owner.address), false);
});

test("createSessionKey yields a usable, distinct keypair each call", () => {
  const a = createSessionKey();
  const b = createSessionKey();
  assert.match(a.address, /^0x[0-9a-fA-F]{40}$/);
  assert.equal(new Wallet(a.privateKey).address, a.address); // key controls the address
  assert.notEqual(a.address, b.address);
});

test("garbage signature is rejected, not thrown", () => {
  assert.equal(verifyGrant(grant(), "0xdeadbeef", owner.address), false);
});
