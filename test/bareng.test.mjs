// Run: npm test  (node --test). Direct test of the money path: spend() checks the grant +
// cap BEFORE any on-chain call, and only settles when both pass. Uses a fake Universal Account.
import assert from "node:assert/strict";
import test from "node:test";
import { Wallet } from "ethers";
import { spend, newMember } from "../lib/bareng.ts";
import { signGrant, createSessionKey } from "../lib/sessionKey.ts";

const NOW = 1000;
const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
const budiAddr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

// Fake UA — records whether the chain was actually touched.
function fakeUA() {
  const calls = { sent: 0 };
  const ua = {
    createTransferTransaction: async () => ({ rootHash: "0xroot" }),
    sendTransaction: async () => { calls.sent++; return { transactionId: "0xTXHASH" }; },
  };
  return { ua, calls };
}
const sign = async () => "0xsignature";
const params = { amount: 30, receiver: "0xdead", tokenAddress: USDC };

test("happy path: settles and records the spend", async () => {
  const { ua, calls } = fakeUA();
  const member = newMember(budiAddr, "Budi", 100, NOW);
  const res = await spend(ua, member, params, sign, NOW);
  assert.equal(res.txHash, "0xTXHASH");
  assert.equal(res.member.spent, 30);
  assert.equal(calls.sent, 1);
});

test("over limit: throws BEFORE touching the chain", async () => {
  const { ua, calls } = fakeUA();
  const member = newMember(budiAddr, "Budi", 100, NOW);
  await assert.rejects(spend(ua, member, { ...params, amount: 999 }, sign, NOW), /over limit/);
  assert.equal(calls.sent, 0); // nothing settled
});

test("a valid owner-signed grant lets the spend through", async () => {
  const { ua } = fakeUA();
  const owner = Wallet.createRandom();
  const member = newMember(budiAddr, "Budi", 100, NOW);
  const permission = {
    account: owner.address, sessionKey: createSessionKey().address, member: budiAddr,
    limit: 100_000000n, periodSeconds: 604800n, token: USDC,
  };
  const grant = { permission, signature: await signGrant(owner, permission), owner: owner.address };
  const res = await spend(ua, member, params, sign, NOW, grant);
  assert.equal(res.member.spent, 30);
});

test("the OWNER-SIGNED cap gates the amount, not just its authenticity", async () => {
  const { ua, calls } = fakeUA();
  const owner = Wallet.createRandom();
  // App-side member.limit is generous (100), but the owner only signed a 10 USDC cap.
  const member = newMember(budiAddr, "Budi", 100, NOW);
  const permission = {
    account: owner.address, sessionKey: createSessionKey().address, member: budiAddr,
    limit: 10_000000n, periodSeconds: 604800n, token: USDC, // signed cap = 10, not 100
  };
  const grant = { permission, signature: await signGrant(owner, permission), owner: owner.address };
  // 30 > the signed 10 → refused BEFORE the chain, even though member.limit alone would allow it.
  await assert.rejects(spend(ua, member, params, sign, NOW, grant), /over the owner-signed cap/);
  assert.equal(calls.sent, 0);
});

test("a grant for a DIFFERENT member is refused", async () => {
  const { ua, calls } = fakeUA();
  const owner = Wallet.createRandom();
  const member = newMember(budiAddr, "Budi", 100, NOW);
  const permission = {
    account: owner.address, sessionKey: createSessionKey().address,
    member: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Sari, not Budi
    limit: 100_000000n, periodSeconds: 604800n, token: USDC,
  };
  const grant = { permission, signature: await signGrant(owner, permission), owner: owner.address };
  await assert.rejects(spend(ua, member, params, sign, NOW, grant), /not for/);
  assert.equal(calls.sent, 0);
});

test("a forged grant signature is refused", async () => {
  const { ua, calls } = fakeUA();
  const owner = Wallet.createRandom();
  const member = newMember(budiAddr, "Budi", 100, NOW);
  const permission = {
    account: owner.address, sessionKey: createSessionKey().address, member: budiAddr,
    limit: 100_000000n, periodSeconds: 604800n, token: USDC,
  };
  const grant = { permission, signature: "0xdeadbeef", owner: owner.address };
  await assert.rejects(spend(ua, member, params, sign, NOW, grant), /invalid session-key grant/);
  assert.equal(calls.sent, 0);
});
