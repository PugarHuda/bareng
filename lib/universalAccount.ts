// Particle Universal Accounts (EIP-7702 mode) — one balance, every chain.
// Owner = the Magic EOA. We build a transfer and sign its rootHash with the
// owner's signer (Magic in the app, a Wallet in tests/scripts).
//
// SDK v2.0.3 (the supported version; v1.1.1 is deprecated and its contract-call path
// returned a bogus "System maintenance" on Arbitrum). In v2's 7702 mode the account IS
// the owner EOA — getSmartAccountOptions() resolves the owner address itself. The EOA
// starts UNDELEGATED, so the first tx per chain carries an EIP-7702 authorization
// (sendTransaction's 3rd arg — see build7702Authorizations); once delegated, 2 args
// suffice. Proven on Arbitrum (Aave tx needed the auth; later transfers went 2-arg).
// See docs/ONCHAIN_PROOF.md.

import { CHAIN_ID, UniversalAccount } from "@particle-network/universal-account-sdk";

export { CHAIN_ID };

/** Native USDC on Arbitrum One — the default settlement token. */
export const ARBITRUM_USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

export function createUniversalAccount(ownerAddress: string): UniversalAccount {
  return new UniversalAccount({
    projectId: process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID!,
    projectClientKey: process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY!,
    projectAppUuid: process.env.NEXT_PUBLIC_PARTICLE_APP_ID!,
    // ponytail: SDK types mark name/version required, but the runtime defaults them (verified);
    // in 7702 mode the account address is the owner EOA regardless, so cast the minimal options.
    smartAccountOptions: { ownerAddress, useEIP7702: true } as never,
    tradeConfig: { slippageBps: 100 },
  });
}

/** A signer abstracts Magic (browser) vs ethers.Wallet (tests). */
export type SignRootHash = (rootHash: string) => Promise<string>;

/** Signs an EIP-7702 authorization tuple, returning the serialized 65-byte signature. Backed by
 *  ethers `wallet.authorize(...).signature.serialized` in scripts, or Magic's sign7702Authorization
 *  in the browser. Sign the chainId Particle gives (usually 0 = chain-agnostic) — not a fallback. */
export type Authorize7702 = (auth: { address: string; nonce: number; chainId: number }) => Promise<string>;

/**
 * In v2's 7702 mode the account is the owner EOA, which starts UNDELEGATED — the first tx per chain
 * must carry an EIP-7702 authorization (sendTransaction's 3rd arg) delegating the EOA to Particle's
 * UA implementation. Build one per undelegated userOp from tx.userOps[].eip7702Auth. Returns [] once
 * the account is delegated (subsequent txs need none). Without this, a fresh account's first spend
 * fails with AA24. Mirrors Particle's ua-7702-magic-demo signAndSend.
 */
export async function build7702Authorizations(
  tx: { userOps?: any[] },
  authorize: Authorize7702,
): Promise<{ userOpHash: string; signature: string }[]> {
  const authorizations: { userOpHash: string; signature: string }[] = [];
  const byNonce = new Map<number, string>();
  for (const op of tx.userOps ?? []) {
    if (op.eip7702Auth && !op.eip7702Delegated) {
      let signature = byNonce.get(op.eip7702Auth.nonce);
      if (!signature) {
        signature = await authorize({
          address: op.eip7702Auth.address,
          nonce: op.eip7702Auth.nonce,
          chainId: op.eip7702Auth.chainId ?? op.chainId, // ?? keeps a genuine 0 (chain-agnostic)
        });
        byNonce.set(op.eip7702Auth.nonce, signature);
      }
      authorizations.push({ userOpHash: op.userOpHash, signature });
    }
  }
  return authorizations;
}

/**
 * Cross-chain transfer from the shared balance. Settles on Arbitrum by default
 * (Arbitrum bounty). The source funds can sit on ANY chain — UA routes them.
 * Pass `authorize` to cover a fresh (undelegated) account's first tx; omit once delegated.
 */
export async function sendShared(
  ua: UniversalAccount,
  params: { amount: string; receiver: string; tokenAddress: string },
  sign: SignRootHash,
  authorize?: Authorize7702,
) {
  const tx = await ua.createTransferTransaction({
    token: { chainId: CHAIN_ID.ARBITRUM_MAINNET_ONE, address: params.tokenAddress },
    amount: params.amount,
    receiver: params.receiver,
  });
  const authorizations = authorize ? await build7702Authorizations(tx as { userOps?: any[] }, authorize) : [];
  const signature = await sign(tx.rootHash);
  return ua.sendTransaction(tx, signature, authorizations.length ? (authorizations as never) : undefined);
}
