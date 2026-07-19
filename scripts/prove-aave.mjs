// SECOND on-chain proof that WORKS with the funds on hand — a real DeFi action from the shared UA.
// Same-chain (Arbitrum), so no cross-chain bridge minimums: the UA supplies a little USDC into
// Aave v3 via createUniversalTransaction (approve + supply, batched). Proves the UA makes arbitrary
// contract calls on-chain (not just transfers) and that lib/yield.buildSupply is real. Recoverable —
// the supplied USDC becomes aArbUSDC you can withdraw later.
//
// Run: node --env-file=.env.local scripts/prove-aave.mjs [amountUSDC]   (default 0.3)
//
// STATUS (2026-07-19): BLOCKED by Particle server-side, not by this code. createUniversalTransaction
// (the ONLY SDK method for arbitrary contract calls — createTransfer/Buy/Convert/Sell can't call
// Aave's supply) returns "System maintenance, use SEND/TRANSFER/SELL". Diagnosed: tested WITH and
// WITHOUT expectTokens — both fail identically, so the whole universal-transaction engine is gated,
// not our payload. The UA holds 1.7 USDC on Arbitrum (verified on-chain), so it is NOT a funds or
// routing issue. No client-side workaround exists (contract calls only go through this one gated
// method). Rerun when Particle lifts maintenance.

import { Wallet, getBytes } from "ethers";
import { createUniversalAccount, ARBITRUM_USDC } from "../lib/universalAccount.ts";
import { buildSupply } from "../lib/yield.ts";

const need = ["NEXT_PUBLIC_PARTICLE_PROJECT_ID", "NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "NEXT_PUBLIC_PARTICLE_APP_ID", "OWNER_PRIVATE_KEY"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) { console.error(`✗ Missing env: ${missing.join(", ")}`); process.exit(1); }

const amountUSD = process.argv[2] ?? "0.3";
const amountBase = BigInt(Math.round(Number(amountUSD) * 1e6)); // USDC 6dp

const wallet = new Wallet(process.env.OWNER_PRIVATE_KEY);
const ua = createUniversalAccount(wallet.address);
const sign = async (rootHash) => wallet.signMessage(getBytes(rootHash));

const { smartAccountAddress: UA } = await ua.getSmartAccountOptions();
console.log(`UA: ${UA}\nSupplying ${amountUSD} USDC into Aave v3 on Arbitrum (approve + supply, one signature).\n`);

const batch = buildSupply(ARBITRUM_USDC, amountBase, UA); // { chainId, transactions: [approve, supply] }

try {
  const tx = await ua.createUniversalTransaction({
    chainId: batch.chainId,
    expectTokens: [{ type: "usdc", amount: String(amountUSD) }], // ensure the UA has the USDC on-chain
    transactions: batch.transactions,
  });
  const res = await ua.sendTransaction(tx, await sign(tx.rootHash));
  const txId = res?.transactionId ?? res?.hash;
  console.log(`✓ Sent. Particle transactionId: ${txId ?? JSON.stringify(res)}`);
  process.stdout.write(`  Waiting for on-chain settlement`);
  for (let i = 0; i < 30; i++) {
    const d = await ua.getTransaction(txId).catch(() => null);
    const ops = [...(d?.settlementUserOperations ?? []), ...(d?.lendingUserOperations ?? []), ...(d?.depositUserOperations ?? [])];
    const hash = ops.map((o) => o.txHash).find(Boolean);
    if (hash) {
      console.log(`\n✓ SETTLED — the UA supplied USDC into Aave v3 on Arbitrum`);
      console.log(`  txHash:   ${hash}`);
      console.log(`  Arbiscan: https://arbiscan.io/tx/${hash}`);
      console.log(`  Proves the UA makes real DeFi contract calls (approve+supply), not just transfers.`);
      process.exit(0);
    }
    process.stdout.write(`.`);
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`\n  Still pending — rerun getTransaction("${txId}") shortly.`);
} catch (e) {
  console.error(`✗ Failed: ${e.message}`);
  console.error(`  If "insufficient": lower the amount (arg 1). If it's an Aave/route issue, the supply`);
  console.error(`  path may need the aToken pre-approved — report the message and we iterate.`);
  process.exit(1);
}
