// REAL on-chain x402 settlement via EIP-3009 transferWithAuthorization.
//
// FINDING: the pot's owner EOA is EIP-7702-DELEGATED (it's the UA), so it has code — and USDC's
// EIP-3009 routes a code-account's signature through EIP-1271, which the delegation doesn't answer,
// so a transferWithAuthorization from the UA reverts. EIP-3009 needs a plain (undelegated) EOA payer.
// So the x402 "agent" is a separate throwaway EOA (deterministic from the owner, recoverable), funded
// with a tiny UA transfer. It signs (plain ECDSA — accepted), and the UA broadcasts the settlement as
// the facilitator (paymaster pays gas). This is the real handshake settling on-chain.
//
//   node --env-file=.env.local scripts/prove-x402.mjs [amountUSDC]   (default 0.01)

import { Wallet, getBytes, Interface, Signature, hexlify, randomBytes, verifyTypedData, keccak256, toUtf8Bytes, JsonRpcProvider, Contract, formatUnits } from "ethers";
import { createUniversalAccount, build7702Authorizations, sendShared, ARBITRUM_USDC } from "../lib/universalAccount.ts";

const need = ["NEXT_PUBLIC_PARTICLE_PROJECT_ID", "NEXT_PUBLIC_PARTICLE_CLIENT_KEY", "NEXT_PUBLIC_PARTICLE_APP_ID", "OWNER_PRIVATE_KEY"];
if (need.some((k) => !process.env[k])) { console.error("✗ Missing env"); process.exit(1); }

const pay = process.argv[2] ?? "0.01";
const value = BigInt(Math.round(Number(pay) * 1e6));
const SERVICE = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955";

const owner = new Wallet(process.env.OWNER_PRIVATE_KEY);
const ua = createUniversalAccount(owner.address);
const sign = async (rootHash) => owner.signMessage(getBytes(rootHash));
const authorize = async ({ address, nonce, chainId }) => (await owner.authorize({ address, nonce, chainId })).signature.serialized;

// The x402 agent — a plain EOA, deterministic from the owner so it's recoverable/reusable.
const agent = new Wallet(keccak256(toUtf8Bytes(`${process.env.OWNER_PRIVATE_KEY}:bareng-x402-agent-v1`)));
const provider = new JsonRpcProvider("https://arb1.arbitrum.io/rpc");
const usdc = new Contract(ARBITRUM_USDC, ["function name() view returns (string)", "function version() view returns (string)", "function balanceOf(address) view returns (uint256)"], provider);
const [name, version] = await Promise.all([usdc.name(), usdc.version()]);
console.log(`Agent EOA (plain): ${agent.address}\nService: ${SERVICE}  ·  pay $${pay}  ·  USDC ${name}/v${version}\n`);

// 1) Fund the agent EOA if needed (a real UA transfer — the proven path).
let bal = await usdc.balanceOf(agent.address);
console.log(`Agent USDC: ${formatUnits(bal, 6)}`);
if (bal < value) {
  const topup = (Number(pay) + 0.005).toFixed(4); // payment + a hair for signature-state buffer
  console.log(`Funding agent with ${topup} USDC from the UA…`);
  const r = await sendShared(ua, { amount: topup, receiver: agent.address, tokenAddress: ARBITRUM_USDC }, sign, authorize);
  const id = r?.transactionId ?? r?.hash;
  for (let i = 0; i < 30; i++) { const d = await ua.getTransaction(id).catch(() => null); const h = [...(d?.settlementUserOperations ?? []), ...(d?.depositUserOperations ?? [])].map((o) => o.txHash).find(Boolean); if (h) { console.log(`  funded: ${h}`); break; } await new Promise((r) => setTimeout(r, 5000)); }
  for (let i = 0; i < 12 && bal < value; i++) { await new Promise((r) => setTimeout(r, 4000)); bal = await usdc.balanceOf(agent.address); }
  console.log(`Agent USDC now: ${formatUnits(bal, 6)}`);
  if (bal < value) { console.error("✗ Agent still underfunded — rerun (funding may be settling)."); process.exit(1); }
}

// 2) Agent signs the EIP-3009 authorization (plain ECDSA — USDC accepts it because the agent is undelegated).
const domain = { name, version, chainId: 42161, verifyingContract: ARBITRUM_USDC };
const TYPES = { TransferWithAuthorization: [
  { name: "from", type: "address" }, { name: "to", type: "address" }, { name: "value", type: "uint256" },
  { name: "validAfter", type: "uint256" }, { name: "validBefore", type: "uint256" }, { name: "nonce", type: "bytes32" },
] };
const now = Math.floor(Date.now() / 1000);
const msg = { from: agent.address, to: SERVICE, value, validAfter: BigInt(now - 60), validBefore: BigInt(now + 3600), nonce: hexlify(randomBytes(32)) };
const sig = await agent.signTypedData(domain, TYPES, msg);
if (verifyTypedData(domain, TYPES, msg, sig).toLowerCase() !== agent.address.toLowerCase()) { console.error("✗ local verify failed"); process.exit(1); }
console.log(`✓ EIP-3009 authorization signed by the agent + locally verified.`);
const { r, s, v } = Signature.from(sig);

// 3) The UA broadcasts transferWithAuthorization as the facilitator (paymaster pays gas).
const IFACE = new Interface(["function transferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce,uint8 v,bytes32 r,bytes32 s)"]);
const data = IFACE.encodeFunctionData("transferWithAuthorization", [msg.from, msg.to, msg.value, msg.validAfter, msg.validBefore, msg.nonce, v, r, s]);
try {
  let tx;
  for (let attempt = 1; ; attempt++) {
    try { tx = await ua.createUniversalTransaction({ chainId: 42161, expectTokens: [{ type: "usdc", amount: "0.01" }], transactions: [{ to: ARBITRUM_USDC, data, value: "0" }] }); break; }
    catch (e) { if (attempt >= 8) throw e; console.log(`  build attempt ${attempt} failed (${e.message}) — retrying…`); await new Promise((r) => setTimeout(r, 3000)); }
  }
  const auths = await build7702Authorizations(tx, authorize);
  const res = await ua.sendTransaction(tx, await sign(tx.rootHash), auths.length ? auths : undefined);
  const id = res?.transactionId ?? res?.hash;
  console.log(`✓ Sent (UA = facilitator). transactionId: ${id}`);
  process.stdout.write("  Waiting for settlement");
  for (let i = 0; i < 30; i++) {
    const d = await ua.getTransaction(id).catch(() => null);
    const h = [...(d?.settlementUserOperations ?? []), ...(d?.lendingUserOperations ?? []), ...(d?.depositUserOperations ?? [])].map((o) => o.txHash).find(Boolean);
    if (h) { console.log(`\n✓ SETTLED — real x402 payment on Arbitrum via transferWithAuthorization\n  txHash:   ${h}\n  Arbiscan: https://arbiscan.io/tx/${h}`); process.exit(0); }
    process.stdout.write("."); await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`\n  Still pending — rerun getTransaction("${id}").`);
} catch (e) { console.error(`✗ Failed: ${e.message}`); process.exit(1); }
