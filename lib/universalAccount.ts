// Particle Universal Accounts (EIP-7702 mode) — one balance, every chain.
// Owner = the Magic EOA. We build a transfer and sign its rootHash with the
// owner's signer (Magic in the app, a Wallet in tests/scripts).
//
// The 7702-mode first-tx authorization is RESOLVED: a real spend settled on Arbitrum
// (tx 0x40a4722a…d50f7) with plain 2-arg sendTransaction(tx, signature) — Particle
// handles the EIP-7702 authorization server-side. The transfer/sign/send flow below
// is verbatim from docs; see docs/ONCHAIN_PROOF.md.

import { CHAIN_ID, UniversalAccount } from "@particle-network/universal-account-sdk";

export { CHAIN_ID };

/** Native USDC on Arbitrum One — the default settlement token. */
export const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

export function createUniversalAccount(ownerAddress: string): UniversalAccount {
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    ownerAddress,
    tradeConfig: { slippageBps: 100 },
  });
}

/** A signer abstracts Magic (browser) vs ethers.Wallet (tests). */
export type SignRootHash = (rootHash: string) => Promise<string>;

/**
 * Cross-chain transfer from the shared balance. Settles on Arbitrum by default
 * (Arbitrum bounty). The source funds can sit on ANY chain — UA routes them.
 * Address below is USDC on Arbitrum; swap per token.
 */
export async function sendShared(
  ua: UniversalAccount,
  params: { amount: string; receiver: string; tokenAddress: string },
  sign: SignRootHash,
) {
  const tx = await ua.createTransferTransaction({
    token: { chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE, address: params.tokenAddress },
    amount: params.amount,
    receiver: params.receiver,
  });
  const signature = await sign(tx.rootHash);
  return ua.sendTransaction(tx, signature);
}
