// First attempt at ONE real on-chain Universal Account spend — the harness for gap #1 (nothing
// has run on-chain yet). Reuses the SAME lib the app uses (lib/universalAccount.ts). NOTE: this
// has never touched the network — it's the starting point for the first live run, not a proven
// path. Expect to iterate on the 7702 authorization, the signer contract, and the return shape.
//
// Run (Node 23+ strips TS; your Node 26 does):
//   node --env-file=.env.local scripts/prove-onchain.mjs [receiverAddress] [amountUSDC]
//
// Needs in .env.local: NEXT_PUBLIC_PARTICLE_PROJECT_ID / _CLIENT_KEY / _APP_ID  +  OWNER_PRIVATE_KEY
// OWNER_PRIVATE_KEY is a throwaway EOA that owns the UA (fund it with a little USDC on Arbitrum).
// Default receiver is the owner itself — a safe self-transfer.

import { Wallet, getBytes } from "ethers";
import { createUniversalAccount, sendShared, ARBITRUM_USDC } from "../lib/universalAccount.ts";

const need = [
  "NEXT_PUBLIC_PARTICLE_PROJECT_ID",
  "NEXT_PUBLIC_PARTICLE_CLIENT_KEY",
  "NEXT_PUBLIC_PARTICLE_APP_ID",
  "OWNER_PRIVATE_KEY",
];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`✗ Missing env: ${missing.join(", ")}`);
  console.error(`  Fill .env.local, then: node --env-file=.env.local scripts/prove-onchain.mjs`);
  process.exit(1);
}

const wallet = new Wallet(process.env.OWNER_PRIVATE_KEY);
const receiver = process.argv[2] ?? wallet.address; // default: pay yourself
const amount = process.argv[3] ?? "0.01";

console.log(`Owner EOA:  ${wallet.address}`);
console.log(`Receiver:   ${receiver}`);
console.log(`Amount:     ${amount} USDC · settling on Arbitrum One\n`);

const ua = createUniversalAccount(wallet.address);
// Same signer contract as Magic (lib/magic.ts): sign the tx rootHash as an eth message.
const sign = async (rootHash) => wallet.signMessage(getBytes(rootHash));

try {
  const res = await sendShared(
    ua,
    { amount: String(amount), receiver, tokenAddress: ARBITRUM_USDC },
    sign,
  );
  // sendTransaction returns Particle's internal transactionId; the settled Arbitrum txHash lands a
  // few seconds later. Poll getTransaction until a userOp exposes its on-chain txHash.
  const txId = res?.transactionId ?? res?.hash;
  console.log(`✓ Sent. Particle transactionId: ${txId ?? JSON.stringify(res)}`);
  if (txId) {
    process.stdout.write(`  Waiting for on-chain settlement`);
    for (let i = 0; i < 24; i++) {
      const d = await ua.getTransaction(txId).catch(() => null);
      const ops = [
        ...(d?.lendingUserOperations ?? []),
        ...(d?.settlementUserOperations ?? []),
        ...(d?.depositUserOperations ?? []),
      ];
      const hash = ops.map((o) => o.txHash).find(Boolean);
      if (hash) {
        console.log(`\n✓ SETTLED on Arbitrum One`);
        console.log(`  txHash:   ${hash}`);
        console.log(`  Arbiscan: https://arbiscan.io/tx/${hash}`);
        console.log(`  Screenshot this for the submission.`);
        break;
      }
      process.stdout.write(`.`);
      await new Promise((r) => setTimeout(r, 5000));
      if (i === 23) console.log(`\n  Still pending — rerun getTransaction("${txId}") in a moment, or check Particle's explorer.`);
    }
  }
} catch (e) {
  console.error(`✗ Send failed: ${e.message}`);
  console.error(`  If it mentions 7702 authorization: the FIRST tx per chain needs an EIP-7702`);
  console.error(`  authorization (sendTransaction's 3rd arg). That exact API is the one documented`);
  console.error(`  unknown — confirm it at Particle Office Hours (see docs/ARCHITECTURE.md).`);
  process.exit(1);
}
