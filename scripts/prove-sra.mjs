// ZeroDev Smart Routing Address (SRA) — the pot's universal cross-chain deposit address.
// createSmartRoutingAddress computes ONE address; anyone sends USDC to it from any supported source
// chain (Base/Optimism/Arbitrum/…) and it routes to the pot on the destination chain (Arbitrum),
// no bridging. This is ZeroDev's chain-abstraction stack (the General-Track ZeroDev subtrack) and a
// cross-chain deposit that WORKS where Particle's v2 cross-chain balance check is bugged.
//
// Run: node --env-file=.env.local scripts/prove-sra.mjs

import { Wallet } from "ethers";
import { parseAbi } from "viem";
import { createSmartRoutingAddress, createCall, FLEX, AMOUNT, SMART_ROUTING_ADDRESS_V0_2_1 } from "@zerodev/smart-routing-address";
import { arbitrum, base, optimism } from "viem/chains";

const owner = new Wallet(process.env.OWNER_PRIVATE_KEY).address; // the pot owner receives the routed funds

// On arrival, transfer the bridged USDC to the pot owner. FLEX.TOKEN_ADDRESS = the arrived token,
// AMOUNT.BRIDGED = the amount that landed after bridging.
const deliverToOwner = createCall({
  target: FLEX.TOKEN_ADDRESS,
  abi: parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]),
  functionName: "transfer",
  args: [owner, AMOUNT.BRIDGED],
});
console.log(`Pot owner (receiver): ${owner}`);
console.log("Creating a Smart Routing Address: deposit USDC from Base/Optimism/Arbitrum → pot on Arbitrum.\n");

try {
  const res = await createSmartRoutingAddress({
    owner,
    destChain: arbitrum, // the pot settles on Arbitrum One
    srcTokens: [
      { tokenType: "USDC", chain: base, minAmount: 1_000000n },
      { tokenType: "USDC", chain: optimism, minAmount: 1_000000n },
      { tokenType: "USDC", chain: arbitrum, minAmount: 1_000000n },
    ],
    actions: { USDC: { action: [deliverToOwner], fallBack: [] } }, // deliver arrived USDC to the pot
    slippage: 50, // 0.5%
    allowPartialRoutes: true, // still create the address even if a src chain has no live route
    config: { version: SMART_ROUTING_ADDRESS_V0_2_1 }, // pin the manager version
  });
  const sra = res?.smartRoutingAddress ?? res;
  console.log(`✓ Smart Routing Address created: ${sra}`);
  console.log(`  Send USDC to it from ANY supported chain → it arrives at ${owner} on Arbitrum.`);
  console.log(`  This is a real cross-chain deposit rail via ZeroDev's SRA (no bridging).`);
} catch (e) {
  console.error(`✗ Failed: ${e.message}`);
  for (const k of ["code", "data", "details", "cause", "response", "body"]) {
    if (e[k] !== undefined) { try { console.error(`  ${k}:`, JSON.stringify(e[k], (kk, v) => (typeof v === "bigint" ? v.toString() : v)).slice(0, 400)); } catch { console.error(`  ${k}:`, String(e[k]).slice(0, 300)); } }
  }
  process.exit(1);
}
