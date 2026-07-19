// Arisan (ROSCA) — Indonesia's 500-year-old rotating savings circle, trustless on-chain.
// Every round each member contributes a fixed amount into the shared pot; one member collects the
// whole pot that round. Over N rounds everyone collects exactly once. The shared Universal Account
// holds the pot; contributions are spends in, the payout is a UA transfer out — same rails as the
// rest of Bareng, so "gotong royong" becomes a real financial primitive, not just a group wallet.
//
// Pure state machine (no SDK/network). This is a money path → thoroughly tested (test/arisan.test.mjs).
// ponytail: recipient order is a fixed rotation (fair: one turn each). Swap in a verifiable on-chain
// draw (e.g. block-hash seed) if a random order matters more than determinism.

export type Arisan = {
  members: string[]; // fixed roster + rotation order (handles or addresses)
  contribution: number; // fixed amount each member pays every round
  round: number; // 0-indexed current round (also indexes this round's recipient)
  paidThisRound: string[]; // members who have contributed in the current round
  received: string[]; // members who have already collected a pot (past rounds)
};

export function newArisan(members: string[], contribution: number): Arisan {
  if (members.length < 2) throw new Error("Arisan: need at least 2 members");
  if (new Set(members).size !== members.length) throw new Error("Arisan: duplicate member");
  if (!(contribution > 0)) throw new Error("Arisan: contribution must be > 0"); // !(>0) also rejects NaN
  return { members: [...members], contribution, round: 0, paidThisRound: [], received: [] };
}

/** The whole pot handed to this round's recipient = everyone's contribution. */
export function potThisRound(a: Arisan): number {
  return a.contribution * a.members.length;
}

/** Whoever collects this round (rotates by round index). Null once the circle is complete. */
export function recipientThisRound(a: Arisan): string | null {
  return a.round < a.members.length ? a.members[a.round] : null;
}

/** Has everyone contributed this round? Then the pot is ready to pay out. */
export function roundReady(a: Arisan): boolean {
  return !isComplete(a) && a.paidThisRound.length === a.members.length;
}

/** Every member has collected once → the arisan has run its full cycle. */
export function isComplete(a: Arisan): boolean {
  return a.round >= a.members.length;
}

/** A member pays their contribution for the current round. Everyone pays every round — including
 *  the person collecting this round (that's how arisan works; net they receive pot − contribution). */
export function contribute(a: Arisan, member: string): Arisan {
  if (isComplete(a)) throw new Error("Arisan: circle already complete");
  if (!a.members.includes(member)) throw new Error(`Arisan: ${member} is not a member`);
  if (a.paidThisRound.includes(member)) throw new Error(`Arisan: ${member} already paid this round`);
  return { ...a, paidThisRound: [...a.paidThisRound, member] };
}

/** Pay the full pot to this round's recipient and advance. Throws unless the round is fully funded. */
export function payout(a: Arisan): { arisan: Arisan; recipient: string; amount: number } {
  if (!roundReady(a)) throw new Error("Arisan: not everyone has contributed yet");
  const recipient = recipientThisRound(a)!;
  return {
    arisan: { ...a, round: a.round + 1, paidThisRound: [], received: [...a.received, recipient] },
    recipient,
    amount: potThisRound(a),
  };
}
