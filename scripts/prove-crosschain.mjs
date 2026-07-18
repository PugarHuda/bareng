// SECOND on-chain proof — the CROSS-CHAIN thesis, for real. The UA holds USDC on Arbitrum; this
// buys native ETH on BASE, sourced from that unified balance in one signature. Source chain (42161)
// != destination chain (8453) → this is chain abstraction, not a same-chain transfer.
//
// Run: node --env-file=.env.local scripts/prove-crosschain.mjs [amountUSD] [destChainId]
// Needs the same env as prove-onchain (Particle keys + funded OWNER_PRIVATE_KEY / UA).

import { Wallet, getBytes } from "ethers";
import { createUniversalAccount } from "../lib/universalAccount.ts";

const need = ["NEXT_PUBLIC_PARTICLE_PROJECT_ID", "NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "NEXT_PUBLIC_PARTICLE_APP_ID", "OWNER_PRIVATE_KEY"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) { console.error(`✗ Missing env: ${missing.join(", ")}`); process.exit(1); }

const amount = process.argv[2] ?? "1"; // USDC to deliver on the destination chain
const destChainId = Number(process.argv[3] ?? 8453); // Base
// Native USDC per destination chain.
const USDC = { 8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 10: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", 137: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" };
const EXPLORER = { 8453: "https://basescan.org/tx/", 10: "https://optimistic.etherscan.io/tx/", 137: "https://polygonscan.com/tx/", 42161: "https://arbiscan.io/tx/" };

const wallet = new Wallet(process.env.OWNER_PRIVATE_KEY);
const ua = createUniversalAccount(wallet.address);
const sign = async (rootHash) => wallet.signMessage(getBytes(rootHash));

console.log(`Delivering ${amount} USDC on chain ${destChainId}, funded from the UA's unified balance (USDC on Arbitrum). One signature, cross-chain.\n`);

try {
  const tx = await ua.createTransferTransaction({
    token: { chainId: destChainId, address: USDC[destChainId] },
    amount: String(amount),
    receiver: wallet.address,
  });
  const res = await ua.sendTransaction(tx, await sign(tx.rootHash));
  const txId = res?.transactionId ?? res?.hash;
  console.log(`✓ Sent. Particle transactionId: ${txId ?? JSON.stringify(res)}`);
  process.stdout.write(`  Waiting for cross-chain settlement`);
  for (let i = 0; i < 30; i++) {
    const d = await ua.getTransaction(txId).catch(() => null);
    const ops = [...(d?.settlementUserOperations ?? []), ...(d?.lendingUserOperations ?? []), ...(d?.depositUserOperations ?? [])];
    const settled = ops.filter((o) => o.txHash);
    if (settled.length) {
      const fromChains = d?.tokenChanges?.fromChains ?? [];
      const toChains = d?.tokenChanges?.toChains ?? [];
      console.log(`\n✓ SETTLED cross-chain`);
      console.log(`  source chain(s): ${fromChains.join(", ")}  →  destination chain(s): ${toChains.join(", ")}`);
      for (const o of settled) {
        const url = (EXPLORER[o.chainId] ?? "chain " + o.chainId + " tx ") + o.txHash;
        console.log(`  chain ${o.chainId} txHash: ${o.txHash}\n    ${url}`);
      }
      console.log(`  Source (Arbitrum) != destination (${destChainId}) → cross-chain, one signature. Screenshot for the submission.`);
      process.exit(0);
    }
    process.stdout.write(`.`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`\n  Still pending — rerun getTransaction("${txId}") shortly.`);
} catch (e) {
  console.error(`✗ Failed: ${e.message}`);
  console.error(`  If it mentions a minimum/route: bump the amount (arg 1) or try destChainId 10/137 (arg 2).`);
  process.exit(1);
}
