// REAL on-chain stealth sweep. Demonstrates the full private-receive → auto-sweep flow settling
// on-chain: an outside payment lands on a fresh one-time STEALTH address (ERC-5564); the pot detects
// it (scan + key derivation), and the stealth key signs a gasless EIP-3009 transferWithAuthorization
// that the UA broadcasts to move the funds into the pot. Same rail proven by prove-x402 — and a
// stealth address is a plain (undelegated) EOA, exactly what EIP-3009 needs.
//
//   node --env-file=.env.local scripts/prove-sweep.mjs [amountUSDC]   (default 0.01)

import { Wallet, getBytes, Interface, Signature, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { createUniversalAccount, build7702Authorizations, sendShared, ARBITRUM_USDC } from "../lib/universalAccount.ts";
import { generateMetaAddress, generateStealthAddress, computeStealthPrivateKey } from "../lib/stealth.ts";
import { findSweepable, buildSweepAuthorization } from "../lib/sweep.ts";

const need = ["NEXT_PUBLIC_PARTICLE_PROJECT_ID", "NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "NEXT_PUBLIC_PARTICLE_APP_ID", "OWNER_PRIVATE_KEY"];
if (need.some((k) => !process.env[k])) { console.error("✗ Missing env"); process.exit(1); }

const pay = process.argv[2] ?? "0.01";
const value = BigInt(Math.round(Number(pay) * 1e6));

const owner = new Wallet(process.env.OWNER_PRIVATE_KEY);
const ua = createUniversalAccount(owner.address);
const sign = async (rootHash) => owner.signMessage(getBytes(rootHash));
const authorize = async ({ address, nonce, chainId }) => (await owner.authorize({ address, nonce, chainId })).signature.serialized;
const { smartAccountAddress: UA } = await ua.getSmartAccountOptions();

const provider = new JsonRpcProvider("https://arb1.arbitrum.io/rpc");
const usdc = new Contract(ARBITRUM_USDC, ["function balanceOf(address) view returns (uint256)"], provider);

// The pot's stealth meta-address; an outside sender derives a one-time stealth address from it.
const pot = generateMetaAddress();
const payment = generateStealthAddress(pot.spendPub, pot.viewPub);
const stealth = payment.stealthAddress;
const recoveryKey = computeStealthPrivateKey(payment.ephemeralPub, pot.viewPriv, pot.spendPriv);
console.log(`Pot UA: ${UA}`);
console.log(`Stealth address (private receive): ${stealth}`);
console.log(`  recovery key (only if this strands mid-run): ${recoveryKey}\n`);

// 1) Simulate the private receive: fund the stealth address from the UA.
let bal = await usdc.balanceOf(stealth);
if (bal < value) {
  const topup = (Number(pay) + 0.001).toFixed(4);
  console.log(`Funding the stealth address with ${topup} USDC (the private receive)…`);
  const r = await sendShared(ua, { amount: topup, receiver: stealth, tokenAddress: ARBITRUM_USDC }, sign, authorize);
  const id = r?.transactionId ?? r?.hash;
  for (let i = 0; i < 30; i++) { const d = await ua.getTransaction(id).catch(() => null); const h = [...(d?.settlementUserOperations ?? []), ...(d?.depositUserOperations ?? [])].map((o) => o.txHash).find(Boolean); if (h) { console.log(`  received: ${h}`); break; } await new Promise((r) => setTimeout(r, 5000)); }
  for (let i = 0; i < 12 && bal < value; i++) { await new Promise((r) => setTimeout(r, 4000)); bal = await usdc.balanceOf(stealth); }
}
console.log(`Stealth USDC: ${formatUnits(bal, 6)}`);
if (bal < value) { console.error("✗ Stealth address underfunded — rerun (receive may be settling)."); process.exit(1); }

// 2) The pot detects its own receive and derives the controlling key.
const [sweepable] = findSweepable([payment], pot);
if (!sweepable || sweepable.stealthAddress.toLowerCase() !== stealth.toLowerCase()) { console.error("✗ scan failed to find the receive"); process.exit(1); }
console.log(`✓ Pot detected the receive + derived the controlling key.`);

// 3) The stealth key signs a gasless EIP-3009 sweep into the UA (real signature).
const { authorization, signature } = await buildSweepAuthorization(sweepable, UA, ARBITRUM_USDC, value);
console.log(`✓ Signed gasless sweep: ${authorization.from} → ${authorization.to} (${formatUnits(BigInt(authorization.value), 6)} USDC).`);
const { r, s, v } = Signature.from(signature);
const IFACE = new Interface(["function transferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce,uint8 v,bytes32 r,bytes32 s)"]);
const data = IFACE.encodeFunctionData("transferWithAuthorization", [authorization.from, authorization.to, authorization.value, authorization.validAfter, authorization.validBefore, authorization.nonce, v, r, s]);

// 4) The UA broadcasts it as the backend sweeper (paymaster pays gas).
try {
  let tx;
  for (let attempt = 1; ; attempt++) {
    try { tx = await ua.createUniversalTransaction({ chainId: 42161, expectTokens: [{ type: "usdc", amount: "0.01" }], transactions: [{ to: ARBITRUM_USDC, data, value: "0" }] }); break; }
    catch (e) { if (attempt >= 8) throw e; console.log(`  build attempt ${attempt} failed (${e.message}) — retrying…`); await new Promise((r) => setTimeout(r, 3000)); }
  }
  const auths = await build7702Authorizations(tx, authorize);
  const res = await ua.sendTransaction(tx, await sign(tx.rootHash), auths.length ? auths : undefined);
  const id = res?.transactionId ?? res?.hash;
  console.log(`✓ Sent (UA = backend sweeper). transactionId: ${id}`);
  process.stdout.write("  Waiting for settlement");
  for (let i = 0; i < 30; i++) {
    const d = await ua.getTransaction(id).catch(() => null);
    const h = [...(d?.settlementUserOperations ?? []), ...(d?.lendingUserOperations ?? []), ...(d?.depositUserOperations ?? [])].map((o) => o.txHash).find(Boolean);
    if (h) { console.log(`\n✓ SWEPT ON-CHAIN — a private receive auto-swept into the pot on Arbitrum\n  txHash:   ${h}\n  Arbiscan: https://arbiscan.io/tx/${h}`); process.exit(0); }
    process.stdout.write("."); await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`\n  Still pending — rerun getTransaction("${id}").`);
} catch (e) { console.error(`✗ Failed: ${e.message}`); console.error(`  Stealth funds are recoverable with the key logged above.`); process.exit(1); }
