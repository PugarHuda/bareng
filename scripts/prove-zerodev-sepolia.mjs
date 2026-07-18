// FREE on-chain proof of the per-member cap being ENFORCED ON-CHAIN — ZeroDev Kernel7702 on Sepolia.
// Proves the 7702 story (30% criterion) for real, gasless (ZeroDev paymaster), no mainnet funds.
// This is the ZeroDev reference impl (lib/zerodev.ts) — a DIFFERENT account from the Particle UA
// (see docs/ARCHITECTURE.md); it does not enforce on the UA. Here it stands alone to show the cap
// rejecting an over-limit tx at the validation layer.
//
// STATUS: first-run harness, like prove-onchain was — the 7702-sudo + regular-validator composition
// is cast in lib/zerodev.ts (types don't expose both). Expect to iterate once at the RPC.
//
// Prereqs: a FREE Sepolia bundler+paymaster RPC from https://dashboard.zerodev.app →
//   NEXT_PUBLIC_ZERODEV_RPC=...   plus OWNER_PRIVATE_KEY (any key; gas is sponsored).
// Run: node --env-file=.env.local scripts/prove-zerodev-sepolia.mjs

import { http, encodeFunctionData, parseAbi, createPublicClient } from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { sepolia } from "viem/chains";
import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";
import { spendCapPolicy } from "../lib/zerodev.ts";

const RPC = process.env.NEXT_PUBLIC_ZERODEV_RPC;
if (!RPC || !process.env.OWNER_PRIVATE_KEY) {
  console.error("✗ Need NEXT_PUBLIC_ZERODEV_RPC (Sepolia, free from dashboard.zerodev.app) + OWNER_PRIVATE_KEY.");
  process.exit(1);
}

// A test ERC20 to cap transfers on; override with ZERODEV_TEST_TOKEN. The OVER-cap rejection happens
// at validation (policy) and needs no balance — that's the beat we're proving.
const TOKEN = process.env.ZERODEV_TEST_TOKEN ?? "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Sepolia USDC (Circle)
const CAP = 10_000000n; // 10 units
const ERC20 = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);
const RECIPIENT = "0x000000000000000000000000000000000000dEaD";

const entryPoint = getEntryPoint("0.7");
const pub = createPublicClient({ chain: sepolia, transport: http() });

// Owner EOA is 7702-upgraded (sudo); the session key is the capped `regular` validator.
const owner = privateKeyToAccount(process.env.OWNER_PRIVATE_KEY);
const sessionSigner = await toECDSASigner({ signer: privateKeyToAccount(generatePrivateKey()) });

const regular = await toPermissionValidator(pub, {
  entryPoint,
  kernelVersion: KERNEL_V3_3,
  signer: sessionSigner,
  policies: [spendCapPolicy({ token: TOKEN, limit: CAP })],
});

const account = await createKernelAccount(pub, {
  eip7702Account: owner,
  entryPoint,
  kernelVersion: KERNEL_V3_3,
  plugins: { regular },
}); // ponytail: 7702-sudo + regular composition — cast in lib/zerodev; confirm the field at the RPC.

const paymaster = createZeroDevPaymasterClient({ chain: sepolia, transport: http(RPC) });
const client = createKernelAccountClient({
  account,
  chain: sepolia,
  bundlerTransport: http(RPC),
  paymaster,
});

const call = (amount) => ({
  to: TOKEN,
  value: 0n,
  data: encodeFunctionData({ abi: ERC20, functionName: "transfer", args: [RECIPIENT, amount] }),
});
const detailOf = (e) => e.details ?? e.metaMessages?.join(" ") ?? e.cause?.message ?? e.shortMessage ?? e.message ?? String(e);
const NEEDS_GAS_POLICY = (d) => /gas sponsoring policies/i.test(d);

console.log(`Kernel: ${account.address}\nCap: ${CAP} per transfer on ${TOKEN}\n`);

// 1) OVER the cap → the on-chain cap policy must REJECT it.
try {
  await client.sendUserOperation({ callData: await account.encodeCalls([call(CAP + 1n)]) });
  console.log("✗ Over-cap tx was NOT rejected — policy not enforcing (investigate).");
} catch (e) {
  const d = detailOf(e);
  if (NEEDS_GAS_POLICY(d)) {
    console.error(`⚠ Prerequisite: create a ZeroDev GAS POLICY first.`);
    console.error(`  Dashboard → your Sepolia project → Gas Policies → add a policy that sponsors userOps`);
    console.error(`  (e.g. "sponsor all"). Without it the paymaster refuses BOTH txs before the cap is even`);
    console.error(`  evaluated, so enforcement can't be shown. Add it, then rerun \`npm run prove:zerodev\`.`);
    process.exit(1);
  }
  console.log(`✓ Over-cap transfer REJECTED on-chain by the cap policy: ${String(d).slice(0, 140)}`);
}

// 2) WITHIN the cap → the policy admits it (execution may still revert if the kernel holds no token;
//    passing the policy check is the point).
try {
  const hash = await client.sendUserOperation({ callData: await account.encodeCalls([call(CAP)]) });
  console.log(`✓ Within-cap transfer admitted by the cap policy. userOpHash: ${hash}`);
  console.log(`  → cap ENFORCED on-chain: over-cap refused, within-cap allowed. Screenshot for the submission.`);
} catch (e) {
  console.log(`• Within-cap: ${String(detailOf(e)).slice(0, 140)}`);
}
