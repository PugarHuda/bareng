// Bareng domain glue: a shared Universal Account + its members.
// The UA holds one cross-chain balance; each member has a 7702 session key
// with a spend cap (enforced by lib/limits.ts, mirrored on-chain).

import { canSpend, recordSpend, type Member } from "./limits";
import { sendShared, type SignRootHash } from "./universalAccount";
import { verifyGrant, type SpendPermission } from "./sessionKey";
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
  /** Optional owner-signed 7702 session-key grant. When present it's the source of
   *  authority: a spend is refused unless the owner really signed this member's cap. */
  grant?: SignedGrant,
): Promise<{ member: Member; txHash: string }> {
  if (grant) {
    const { permission: p } = grant;
    if (!verifyGrant(p, grant.signature, grant.owner)) {
      throw new Error(`Bareng: ${member.name} — invalid session-key grant`);
    }
    if (p.member.toLowerCase() !== member.address.toLowerCase()) {
      throw new Error(`Bareng: grant is not for ${member.name}`);
    }
  }
  if (!canSpend(member, params.amount, now)) {
    throw new Error(`Bareng: ${member.name} over limit`);
  }
  const result = await sendShared(
    ua,
    { amount: String(params.amount), receiver: params.receiver, tokenAddress: params.tokenAddress },
    sign,
  );
  return { member: recordSpend(member, params.amount, now), txHash: (result as { transactionId?: string }).transactionId ?? "" };
}
