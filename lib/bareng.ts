// Bareng domain glue: a shared Universal Account + its members.
// The UA holds one cross-chain balance; each member has a 7702 session key
// with a spend cap (enforced by lib/limits.ts, mirrored on-chain).

import { canSpend, recordSpend, spentInPeriod, type Member } from "./limits.ts";
import { sendShared, type SignRootHash } from "./universalAccount.ts";
import { verifyGrant, type SpendPermission } from "./sessionKey.ts";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";

/** An owner-signed session-key grant that authorizes a member's spend cap. */
export type SignedGrant = { permission: SpendPermission; signature: string; owner: string };

export type SharedAccount = {
  name: string;
  /** UA owner address (the admin's Magic EOA) */
  ownerAddress: string;
  members: Member[];
};

const WEEK = 604800;

export function newMember(address: string, name: string, weeklyLimit: number, now: number): Member {
  return { address, name, limit: weeklyLimit, periodSeconds: WEEK, spent: 0, periodStart: now };
}

/**
 * A member spends from the shared balance. Checks the cap, sends cross-chain
 * (settles on Arbitrum), then records the spend. Returns the updated member.
 * Throws before any on-chain call if over limit.
 */
export async function spend(
  ua: UniversalAccount,
  member: Member,
  params: { amount: number; receiver: string; tokenAddress: string },
  sign: SignRootHash,
  now: number,
  /** The pot's real owner address (SharedAccount.ownerAddress). A grant is only authority if
   *  it was signed by THIS owner — never by whoever the grant claims. Without this binding a
   *  member could self-sign a grant with their own key and forge any cap. */
  expectedOwner: string,
  /** Optional owner-signed 7702 session-key grant. When present it's the source of
   *  authority: a spend is refused unless the owner really signed this member's cap. */
  grant?: SignedGrant,
): Promise<{ member: Member; txHash: string }> {
  if (grant) {
    const { permission: p } = grant;
    // Bind the grant to the REAL owner — not to grant.owner (caller-controlled). Otherwise a
    // member self-signs owner=theirKey, limit=huge and it passes verifyGrant + the cap gate.
    if (grant.owner.toLowerCase() !== expectedOwner.toLowerCase()) {
      throw new Error(`Bareng: grant not signed by the pot owner`);
    }
    if (!verifyGrant(p, grant.signature, grant.owner)) {
      throw new Error(`Bareng: ${member.name} — invalid session-key grant`);
    }
    if (p.member.toLowerCase() !== member.address.toLowerCase()) {
      throw new Error(`Bareng: grant is not for ${member.name}`);
    }
    // The cap is denominated in p.token — enforcing it against a different token would let a
    // "10 USDC" grant authorize 10 units of a pricier token from the shared balance.
    if (p.token.toLowerCase() !== params.tokenAddress.toLowerCase()) {
      throw new Error(`Bareng: grant caps a different token than this spend`);
    }
    // spentInPeriod resets on member.periodSeconds; if it's shorter than the signed period the
    // window rolls over early and re-allows the full cap sooner than the owner authorized.
    if (Number(p.periodSeconds) !== member.periodSeconds) {
      throw new Error(`Bareng: grant period does not match member period`);
    }
    // The signed cap is the ACTUAL authority for the amount — not just proof it's authentic.
    // Without this the owner's signature vouches for a number (p.limit) nothing enforces, and
    // the real ceiling is the parallel app-side member.limit. Gate the period spend on p.limit.
    // ponytail: settlement token is USDC (6dp); pass token decimals here if a pot ever caps a
    // non-6dp token.
    const base = (v: number) => BigInt(Math.round(v * 1e6));
    if (base(spentInPeriod(member, now)) + base(params.amount) > p.limit) {
      throw new Error(`Bareng: ${member.name} — over the owner-signed cap`);
    }
  }
  if (!canSpend(member, params.amount, now)) {
    throw new Error(`Bareng: ${member.name} over limit`);
  }
  // ponytail: TOCTOU — check here, recordSpend after the await. Fine for the single-user
  // in-memory demo; add a per-member lock (or record-then-settle) if spend() ever runs
  // server-side with concurrent callers.
  const result = await sendShared(
    ua,
    { amount: String(params.amount), receiver: params.receiver, tokenAddress: params.tokenAddress },
    sign,
  );
  return { member: recordSpend(member, params.amount, now), txHash: (result as { transactionId?: string }).transactionId ?? "" };
}
