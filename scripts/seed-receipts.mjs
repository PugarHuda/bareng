// Seed REAL on-chain receipts. Runs several real Universal-Account USDC settlements on Arbitrum One
// (self-transfers — the amount returns to the owner, so only gas is spent), one per "case", and
// prints a ready-to-paste SEED_RECEIPTS array with the actual settled txHashes. This turns the
// dashboard's receipts from mock lines into verifiable Arbiscan links.
//
//   node --env-file=.env.local scripts/seed-receipts.mjs
//
// Same env as prove-onchain.mjs. Amounts are tiny (real mainnet, "dana seadanya"); the point is a
// real settlement per case, not the size. Resilient: a flaky tx is recorded and the run continues.

import { Wallet, getBytes } from "ethers";
import { createUniversalAccount, sendShared, ARBITRUM_USDC } from "../lib/universalAccount.ts";

const need = ["NEXT_PUBLIC_PARTICLE_PROJECT_ID", "NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "NEXT_PUBLIC_PARTICLE_APP_ID", "OWNER_PRIVATE_KEY"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) { console.error(`✗ Missing env: ${missing.join(", ")}`); process.exit(1); }

// Various cases — different amount, category, memo, payee handle. Receiver is the owner (safe self-transfer).
const CASES = [
  { from: "@budi", to: "@warung", amount: "0.03", category: "Food", memo: "Team lunch" },
  { from: "@sari", to: "@grab", amount: "0.02", category: "Transport", memo: "Ride to venue" },
  { from: "@dewi", to: "@pln", amount: "0.02", category: "Bills", memo: "Wifi + power" },
  { from: "@budi", to: "@kopi", amount: "0.01", category: "Food", memo: "Coffee run" },
];

const wallet = new Wallet(process.env.OWNER_PRIVATE_KEY);
const self = wallet.address;
const ua = createUniversalAccount(self);
const sign = async (rootHash) => wallet.signMessage(getBytes(rootHash));
const authorize = async ({ address, nonce, chainId }) => (await wallet.authorize({ address, nonce, chainId })).signature.serialized;

console.log(`Owner/pot EOA: ${self}`);
console.log(`Running ${CASES.length} real settlements on Arbitrum One (self-transfers)…\n`);

const settled = async (txId) => {
  for (let i = 0; i < 24; i++) {
    const d = await ua.getTransaction(txId).catch(() => null);
    const ops = [...(d?.lendingUserOperations ?? []), ...(d?.settlementUserOperations ?? []), ...(d?.depositUserOperations ?? [])];
    const hash = ops.map((o) => o.txHash).find(Boolean);
    if (hash) return hash;
    await new Promise((r) => setTimeout(r, 5000));
  }
  return null;
};

const results = [];
for (const c of CASES) {
  process.stdout.write(`• ${c.from}→${c.to} $${c.amount} ${c.category} (${c.memo}) … `);
  try {
    const res = await sendShared(ua, { amount: c.amount, receiver: self, tokenAddress: ARBITRUM_USDC }, sign, authorize);
    const txId = res?.transactionId ?? res?.hash;
    const hash = txId ? await settled(txId) : null;
    if (hash) { console.log(`✓ ${hash}`); results.push({ ...c, txHash: hash }); }
    else { console.log(`⏳ sent but no hash yet (txId ${txId})`); results.push({ ...c, txHash: null, txId }); }
  } catch (e) {
    console.log(`✗ ${e.message?.slice(0, 60)}`);
    results.push({ ...c, txHash: null, error: e.message });
  }
}

const ok = results.filter((r) => r.txHash);
console.log(`\n=== ${ok.length}/${CASES.length} settled. Paste into SEED_RECEIPTS (newest first): ===\n`);
// newest-first, spaced ~1h apart for a natural feed
const lines = ok.map((r, i) =>
  `  makeReceipt({ from: "${r.from}", to: "${r.to}", amount: ${r.amount}, category: "${r.category}", memo: "${r.memo}", note: "Arbitrum · settled", txHash: "${r.txHash}", ts: NOW - ${(i + 1) * 3600} }),`
);
console.log(lines.join("\n"));
console.log(`\nRaw JSON:`);
console.log(JSON.stringify(ok, null, 2));
