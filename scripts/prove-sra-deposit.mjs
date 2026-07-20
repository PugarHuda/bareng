// END-TO-END cross-chain deposit through the pot's ZeroDev Smart Routing Address (SRA).
// Send USDC to the SRA on a SOURCE chain (e.g. Base) → ZeroDev routes it → it lands at the pot on
// Arbitrum. This settles the cross-chain leg that Particle's v2 UA path can't. The SRA already
// exists (scripts/prove-sra.mjs); this script does the deposit and follows it to arrival.
//
//   node --env-file=.env.local scripts/prove-sra-deposit.mjs <base|optimism|arbitrum> <amountUSDC>
//   node --env-file=.env.local scripts/prove-sra-deposit.mjs status                 # just poll status
//   node --env-file=.env.local scripts/prove-sra-deposit.mjs withdraw <chain>       # recover stuck funds
//
// Needs OWNER_PRIVATE_KEY funded on the SOURCE chain: USDC (>= the SRA minAmount, 1 USDC) + a little
// native gas (ETH on Base/Optimism/Arbitrum). It preflights and tells you exactly what's missing —
// safe to run now; it won't send anything it can't.

import { createWalletClient, createPublicClient, http, parseAbi, formatUnits, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, optimism, arbitrum } from "viem/chains";
import { getSmartRoutingAddressInfo, getSmartRoutingAddressStatus, getWithdrawTokensCalls } from "@zerodev/smart-routing-address";

const SRA = "0x0b72F6cD65c80CD9003128746B42c7dAe738D895";
const USDC = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};
const CHAINS = { base, optimism, arbitrum };
const ERC20 = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
]);

if (!process.env.OWNER_PRIVATE_KEY) { console.error("✗ Missing OWNER_PRIVATE_KEY in .env.local"); process.exit(1); }
const account = privateKeyToAccount(process.env.OWNER_PRIVATE_KEY.startsWith("0x") ? process.env.OWNER_PRIVATE_KEY : `0x${process.env.OWNER_PRIVATE_KEY}`);

const [mode, arg1, arg2] = process.argv.slice(2);

const showStatus = async (label = "Status") => {
  const s = await getSmartRoutingAddressStatus({ smartRoutingAddress: SRA }).catch((e) => ({ err: e.message }));
  if (s.err) { console.log(`  (status unavailable: ${s.err})`); return null; }
  console.log(`\n${label}: ${s.totalCount ?? 0} deposit(s) seen by ZeroDev`);
  for (const d of s.deposits ?? []) {
    console.log(`  • src ${d.deposit.chainId} · ${formatUnits(BigInt(d.deposit.amount), 6)} USDC · deposit ${d.deposit.transactionHash}`);
    if (d.bridge) console.log(`    bridged: ${d.bridge.transactionHash}`);
    if (d.execution) console.log(`    ✓ DELIVERED on ${d.execution.chainId}: ${d.execution.transactionHash} (out ${formatUnits(BigInt(d.execution.outputAmount || "0"), 6)} USDC)`);
    if (d.error) console.log(`    ✗ error: ${d.error}`);
  }
  return s;
};

// 1) Always verify the SRA is real & registered.
const info = await getSmartRoutingAddressInfo({ smartRoutingAddress: SRA }).catch((e) => ({ err: e.message }));
if (info.err) { console.error(`✗ SRA not found on ZeroDev: ${info.err}`); process.exit(1); }
console.log(`✓ SRA ${SRA}`);
console.log(`  owner=${info.owner} destChain=${info.executionChainId} srcRoutes=${info.srcTokens.length} slippage=${info.slippage}bps`);

if (mode === "status") { await showStatus(); process.exit(0); }

if (mode === "withdraw") {
  const chain = CHAINS[arg1];
  if (!chain) { console.error("Usage: … withdraw <base|optimism|arbitrum>"); process.exit(1); }
  const w = await getWithdrawTokensCalls({ smartRoutingAddress: SRA, tokens: [{ chainId: chain.id, token: USDC[arg1] }] });
  console.log(`\nWithdraw calls (receiver ${w.receiver}):`);
  console.log(JSON.stringify(w.data, (k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
  console.log("\n(Recovery data printed — funds go to the owner. Broadcast these calls if a deposit got stuck.)");
  process.exit(0);
}

// 2) Deposit mode: <chain> <amount>
const chainName = mode;
const chain = CHAINS[chainName];
const amount = arg1;
if (!chain || !amount) {
  console.error("\nUsage: node scripts/prove-sra-deposit.mjs <base|optimism|arbitrum> <amountUSDC>");
  console.error("       (or 'status' / 'withdraw <chain>')");
  process.exit(1);
}
const token = USDC[chainName];
const pub = createPublicClient({ chain, transport: http() });

// 3) Preflight — never send what we can't. Report exactly what's missing.
const [usdcBal, nativeBal] = await Promise.all([
  pub.readContract({ address: token, abi: ERC20, functionName: "balanceOf", args: [account.address] }),
  pub.getBalance({ address: account.address }),
]);
const want = parseUnits(amount, 6);
console.log(`\nSource: ${chainName}  owner=${account.address}`);
console.log(`  USDC:   ${formatUnits(usdcBal, 6)}  (need ${amount}, SRA min 1.0)`);
console.log(`  ${chain.nativeCurrency.symbol}: ${formatUnits(nativeBal, 18)}  (need a little for gas)`);
if (usdcBal < want) {
  console.error(`\n✗ Not enough USDC on ${chainName}. Fund ${account.address} with >= ${amount} USDC there, then rerun.`);
  process.exit(1);
}
if (nativeBal === 0n) {
  console.error(`\n✗ No ${chain.nativeCurrency.symbol} for gas on ${chainName}. Send a few cents of ${chain.nativeCurrency.symbol} to ${account.address}, then rerun.`);
  process.exit(1);
}

// 4) Send USDC → SRA on the source chain. ZeroDev picks it up and routes to the pot on Arbitrum.
const wallet = createWalletClient({ account, chain, transport: http() });
console.log(`\nDepositing ${amount} USDC → SRA on ${chainName} …`);
const hash = await wallet.writeContract({ address: token, abi: ERC20, functionName: "transfer", args: [SRA, want] });
console.log(`  deposit tx: ${hash}`);
await pub.waitForTransactionReceipt({ hash });
console.log(`  ✓ deposit confirmed on ${chainName}. ZeroDev will now bridge + deliver to the pot on Arbitrum.`);

// 5) Follow it to arrival.
for (let i = 0; i < 40; i++) {
  await new Promise((r) => setTimeout(r, 6000));
  const s = await showStatus(`Poll ${i + 1}`);
  const done = s?.deposits?.some((d) => d.execution);
  const failed = s?.deposits?.some((d) => d.error);
  if (done) { console.log(`\n✓ CROSS-CHAIN DEPOSIT COMPLETE — funds landed at the pot on Arbitrum. Screenshot this.`); break; }
  if (failed) { console.log(`\n✗ A route errored. Use 'withdraw ${chainName}' to recover, or check ZeroDev.`); break; }
}
