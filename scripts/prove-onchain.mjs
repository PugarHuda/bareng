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
  const hash = res?.transactionId ?? res?.hash ?? JSON.stringify(res);
  console.log(`✓ Sent. transactionId: ${hash}`);
  console.log(`  Screenshot this + the settled tx on Arbiscan for the submission.`);
} catch (e) {
  console.error(`✗ Send failed: ${e.message}`);
  console.error(`  If it mentions 7702 authorization: the FIRST tx per chain needs an EIP-7702`);
  console.error(`  authorization (sendTransaction's 3rd arg). That exact API is the one documented`);
  console.error(`  unknown — confirm it at Particle Office Hours (see docs/ARCHITECTURE.md).`);
  process.exit(1);
}
