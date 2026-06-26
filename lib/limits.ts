// Bareng — per-member spending-limit core.
// Pure functions, no SDK/network. This is the money path, so it has a test
// (test/limits.test.mjs). On-chain this maps to an EIP-7702 session key with a
// spend cap; here we enforce it app-side and mirror it on-chain.
// ponytail: app-side enforcement is the demo ceiling. Upgrade path = encode the
// same cap in the 7702 session key so it's enforced on-chain, not just in the UI.

export type Member = {
  address: string;
  name: string;
  /** spend cap per period, in token units (e.g. USDC) */
  limit: number;
  /** rolling window length in seconds (e.g. 604800 = 1 week) */
  periodSeconds: number;
  /** amount spent in the current period */
  spent: number;
  /** unix seconds when the current period started */
  periodStart: number;
};

/** Has the member's rolling period elapsed at `now`? */
function periodElapsed(m: Member, now: number): boolean {
  return now - m.periodStart >= m.periodSeconds;
}

/** Spent-so-far in the period that contains `now` (auto-resets a stale window). */
export function spentInPeriod(m: Member, now: number): number {
  return periodElapsed(m, now) ? 0 : m.spent;
}

/** How much the member can still spend right now. */
export function remaining(m: Member, now: number): number {
  return Math.max(0, m.limit - spentInPeriod(m, now));
}

/** Can the member spend `amount` right now? amount must be > 0. */
export function canSpend(m: Member, amount: number, now: number): boolean {
  return amount > 0 && amount <= remaining(m, now);
}

/**
 * Record a spend. Returns a NEW member (no mutation). Throws if over limit —
 * callers must check canSpend first; the throw is the last line of defense.
 */
export function recordSpend(m: Member, amount: number, now: number): Member {
  if (!canSpend(m, amount, now)) {
    throw new Error(`Bareng: over limit — ${amount} > ${remaining(m, now)} remaining`);
  }
  const fresh = periodElapsed(m, now);
  return {
    ...m,
    spent: (fresh ? 0 : m.spent) + amount,
    periodStart: fresh ? now : m.periodStart,
  };
}
