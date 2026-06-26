// Bareng domain glue: a shared Universal Account + its members.
// The UA holds one cross-chain balance; each member has a 7702 session key
// with a spend cap (enforced by lib/limits.ts, mirrored on-chain).

import { canSpend, recordSpend, type Member } from "./limits";
import { sendShared, type SignRootHash } from "./universalAccount";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";

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
): Promise<{ member: Member; txHash: string }> {
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
