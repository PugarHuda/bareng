// Earn on the pot's idle balance. A shared lunch/trip fund mostly sits still between spends —
// route the idle part into Aave v3 on Arbitrum so it earns, kept one tap from being spent.
//
// The UA can make arbitrary contract calls via createUniversalTransaction({transactions:[...]}),
// so a lend is a two-call batch: approve the Pool, then supply on behalf of the UA. Pure builders
// here (calldata + projections); the actual send reuses the proven UA path (see scripts/prove-onchain).
//
// ponytail: APY is passed in (the UI shows a representative Aave v3 rate). Upgrade path = read the
// live supply rate from Pool.getReserveData(asset) instead of quoting a static number.

import { Interface, getAddress } from "ethers";

// Aave v3 Pool — canonical deployment on Arbitrum One.
export const AAVE_V3_POOL_ARBITRUM = "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

const POOL = new Interface([
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
]);
const ERC20 = new Interface(["function approve(address spender, uint256 amount) returns (bool)"]);

/** How much can safely be lent: balance beyond a reserve kept liquid for spending. */
export function idleAmount(balance: number, reserve: number): number {
  return Math.max(0, balance - reserve);
}

/** Projected earnings on `amount` at `apy` (fraction, e.g. 0.042) over `days`. */
export function projectedYield(amount: number, apy: number, days: number): number {
  return amount * apy * (days / 365);
}

export type LendBatch = {
  chainId: number;
  transactions: { to: string; data: string; value: string }[];
};

/**
 * approve + supply calldata to lend `amount` (token base units) of `usdc` into Aave v3 on behalf
 * of `onBehalfOf` (the UA). Feed straight into ua.createUniversalTransaction({...}).
 */
export function buildSupply(
  usdc: string,
  amount: bigint,
  onBehalfOf: string,
  chainId = 42161,
): LendBatch {
  const pool = getAddress(AAVE_V3_POOL_ARBITRUM);
  const asset = getAddress(usdc);
  return {
    chainId,
    transactions: [
      { to: asset, data: ERC20.encodeFunctionData("approve", [pool, amount]), value: "0" },
      {
        to: pool,
        data: POOL.encodeFunctionData("supply", [asset, amount, getAddress(onBehalfOf), 0]),
        value: "0",
      },
    ],
  };
}
