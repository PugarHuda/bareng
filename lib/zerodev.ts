// On-chain 7702 spend-cap enforcement — a STANDALONE ZeroDev Kernel7702 reference impl.
//
// IMPORTANT (see docs/ARCHITECTURE.md): this does NOT compose with the Particle UA. The UA is
// a single-owner account with no session-key API; ZeroDev's kernel is a *different* account.
// This genuinely demonstrates on-chain 7702 enforcement (real ZeroDev SDK) and targets the
// ZeroDev bounty — but the chain only refuses over-limit txs if the pot IS a ZeroDev kernel,
// which trades away the UA's cross-chain balance. On the UA the cap is app-side + owner-signed
// grant (lib/limits.ts, lib/sessionKey.ts). Each member's session key is a permission validator
// whose policy allows exactly one thing: call USDC.transfer with amount <= cap.
//
// There is no toSpendingLimitPolicy in @zerodev/permissions — an ERC20 cap is expressed as
// a toCallPolicy that restricts the session key to `transfer(to, amount)` on the token,
// with a LESS_THAN_OR_EQUAL rule on `amount`. Real SDK, gated behind NEXT_PUBLIC_ZERODEV_RPC
// like Magic/Particle are. Pure policy shape tested in test/zerodev.test.mjs.
//
// ponytail: toCallPolicy caps PER-TRANSACTION amount on-chain. The rolling weekly total
// stays in lib/limits.ts (ZeroDev has no cumulative-token-per-period policy — toRateLimitPolicy
// caps tx COUNT, not summed value). Upgrade path: add a rate-limit policy for tx count, or a
// custom cumulative policy, once a contract is worth writing.

import { parseAbi, getAddress, type Address, type PublicClient, type Account } from "viem";
import { toCallPolicy, CallPolicyVersion, ParamCondition } from "@zerodev/permissions/policies";
import { toPermissionValidator } from "@zerodev/permissions";
import { toECDSASigner } from "@zerodev/permissions/signers";
import { createKernelAccount, addressToEmptyAccount } from "@zerodev/sdk";
import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";

export const ZERODEV_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_ZERODEV_RPC);

const entryPoint = getEntryPoint("0.7");
const kernelVersion = KERNEL_V3_3; // 7702 kernel

const ERC20_TRANSFER_ABI = parseAbi(["function transfer(address to, uint256 amount) returns (bool)"]);

/** A per-member cap: at most `limit` (token base units) of `token` per transfer. */
export type SpendCap = { token: string; limit: bigint };

/**
 * Pure: the permission descriptor. Session key may ONLY call token.transfer, to any
 * recipient, with amount <= limit, and may never move native ETH (valueLimit 0).
 */
export function spendCapPermission({ token, limit }: SpendCap) {
  return {
    target: getAddress(token) as Address,
    valueLimit: 0n,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer" as const,
    args: [
      null, // recipient: unconstrained
      { condition: ParamCondition.LESS_THAN_OR_EQUAL, value: limit }, // amount <= cap
    ],
  };
}

/** The on-chain call policy for this cap. */
export function spendCapPolicy(cap: SpendCap) {
  return toCallPolicy({
    policyVersion: CallPolicyVersion.V0_0_5,
    permissions: [spendCapPermission(cap) as never],
  });
}

/** The permission validator: this session key, bound to the spend-cap policy. */
export function buildMemberSessionValidator(
  publicClient: PublicClient,
  sessionKeyAddress: string,
  cap: SpendCap,
) {
  const emptySessionKeySigner = toECDSASigner({
    signer: addressToEmptyAccount(getAddress(sessionKeyAddress)),
  });
  return toPermissionValidator(publicClient, {
    entryPoint,
    kernelVersion,
    signer: emptySessionKeySigner as never,
    policies: [spendCapPolicy(cap)],
  });
}

/**
 * Assemble the member's Kernel7702 account: the pot owner's EOA is upgraded in place
 * (eip7702Account = sudo), the capped session key is the `regular` validator that the
 * chain checks on every op.
 *
 * ponytail: 7702 sudo + a `regular` permission validator is the composition we want; the
 * published createKernelAccount types don't yet expose both fields together, so the options
 * are cast. Confirm the exact field at Particle/ZeroDev Office Hours before mainnet.
 */
export async function createMemberKernel(
  publicClient: PublicClient,
  eip7702Account: Account,
  sessionKeyAddress: string,
  cap: SpendCap,
) {
  const regular = await buildMemberSessionValidator(publicClient, sessionKeyAddress, cap);
  return createKernelAccount(publicClient, {
    eip7702Account,
    entryPoint,
    kernelVersion,
    plugins: { regular },
  } as never);
}
