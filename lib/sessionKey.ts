// Per-member EIP-7702 session-key grant.
//
// This is the primitive that turns "we enforce a spend cap app-side" (lib/limits.ts)
// into "the cap is a signed, on-chain-shaped authorization." Each member gets their
// own session key; the UA owner signs an EIP-712 SpendPermission binding that key to a
// cap over a period. That signed grant IS the payload a 7702 session key delegates —
// on-chain enforcement is one validator call away, but the authorization is real crypto
// now, not an app-side promise.
//
// Real EIP-712 via ethers v6 (signTypedData / verifyTypedData) — no hand-rolled signing.
// Verified by test/sessionKey.test.mjs.

import { Wallet, verifyTypedData, getAddress } from "ethers";

// Arbitrum One — the bounty settlement chain (CHAIN_ID.ARBITRUM_MAINNET_ONE).
const ARBITRUM_ONE = 42161;

/** The permission the owner signs. Amounts are token BASE units (uint256), not decimals. */
export type SpendPermission = {
  /** the shared Universal Account the key spends from */
  account: string;
  /** the member's delegated session-key address */
  sessionKey: string;
  /** the member's own EOA (record/attribution) */
  member: string;
  /** spend cap per period, in token base units (e.g. USDC 6dp) */
  limit: bigint;
  /** rolling window length in seconds */
  periodSeconds: bigint;
  /** token the cap applies to */
  token: string;
};

const TYPES = {
  SpendPermission: [
    { name: "account", type: "address" },
    { name: "sessionKey", type: "address" },
    { name: "member", type: "address" },
    { name: "limit", type: "uint256" },
    { name: "periodSeconds", type: "uint256" },
    { name: "token", type: "address" },
  ],
};

// Settlement chain = Arbitrum One (the bounty backend). verifyingContract = the UA.
function domain(account: string) {
  return {
    name: "Bareng",
    version: "1",
    chainId: ARBITRUM_ONE,
    verifyingContract: getAddress(account),
  };
}

/** Fresh per-member session key. Keep privateKey client-side; publish only address. */
export function createSessionKey(): { address: string; privateKey: string } {
  const w = Wallet.createRandom();
  return { address: w.address, privateKey: w.privateKey };
}

export type SignerLike = {
  signTypedData(domain: object, types: object, value: object): Promise<string>;
};

/** UA owner signs the permission. `owner` is the Magic EOA (browser) or a Wallet (tests). */
export function signGrant(owner: SignerLike, p: SpendPermission): Promise<string> {
  return owner.signTypedData(domain(p.account), TYPES, p);
}

/** True iff `signature` over `p` was produced by `expectedOwner`. */
export function verifyGrant(p: SpendPermission, signature: string, expectedOwner: string): boolean {
  try {
    return verifyTypedData(domain(p.account), TYPES, p, signature) === getAddress(expectedOwner);
  } catch {
    return false; // malformed sig/address → not a valid grant
  }
}
