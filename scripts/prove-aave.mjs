// SECOND on-chain proof that WORKS with the funds on hand — a real DeFi action from the shared UA.
// Same-chain (Arbitrum), so no cross-chain bridge minimums: the UA supplies a little USDC into
// Aave v3 via createUniversalTransaction (approve + supply, batched). Proves the UA makes arbitrary
// contract calls on-chain (not just transfers) and that lib/yield.buildSupply is real. Recoverable —
// the supplied USDC becomes aArbUSDC you can withdraw later.
//
// Run: node --env-file=.env.local scripts/prove-aave.mjs [amountUSDC]   (default 0.3)
//
// Requires SDK v2.0.3 (v1.1.1's contract-call path returned a bogus "System maintenance" on
// Arbitrum — a deprecated-SDK bug, not an outage; confirmed against Particle's own devrel + demo).
// In v2's 7702 mode the account IS the owner EOA, which starts undelegated — so the first tx signs
// an EIP-7702 authorization (address+nonce+chainId from tx.userOps[].eip7702Auth) and passes it as
// sendTransaction's 3rd arg. Mirrors Particle's ua-7702-magic-demo signAndSend, ethers not Magic.

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
  // Particle's Arbitrum backend is intermittently flaky (returns "Invalid parameters" at random).
  // Retry the BUILD only — sending stays a single call after a good build, so no double-spend.
  let tx;
  for (let attempt = 1; ; attempt++) {
    try {
      tx = await ua.createUniversalTransaction({
        chainId: batch.chainId,
        expectTokens: [{ type: "usdc", amount: String(amountUSD) }], // ensure the UA has the USDC on-chain
        transactions: batch.transactions,
      });
      break;
    } catch (e) {
      if (attempt >= 8) throw e;
      console.log(`  build attempt ${attempt} failed (${e.message}) — retrying…`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  // EIP-7702 authorizations: the account (owner EOA) is undelegated, so each undelegated userOp
  // needs a signed 7702 authorization delegating the EOA to Particle's UA implementation.
  const authorizations = [];
  const byNonce = new Map();
  for (const op of tx.userOps ?? []) {
    if (op.eip7702Auth && !op.eip7702Delegated) {
      let serialized = byNonce.get(op.eip7702Auth.nonce);
      if (!serialized) {
        const a = await wallet.authorize({
          address: op.eip7702Auth.address,
          nonce: op.eip7702Auth.nonce,
          // Sign the chain-agnostic chainId 0 that Particle actually returns (ethers can, unlike
          // Magic — the demo's `|| chainId` fallback was only a Magic workaround). `??` keeps the 0.
          chainId: op.eip7702Auth.chainId ?? op.chainId,
        });
        serialized = a.signature.serialized;
        byNonce.set(op.eip7702Auth.nonce, serialized);
      }
      authorizations.push({ userOpHash: op.userOpHash, signature: serialized });
    }
  }
  if (authorizations.length) console.log(`  Signing EIP-7702 delegation for ${authorizations.length} userOp(s)…`);
  const res = await ua.sendTransaction(tx, await sign(tx.rootHash), authorizations.length ? authorizations : undefined);
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
