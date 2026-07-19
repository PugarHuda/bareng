// Settle-up (split the bill) — the everyday other half of gotong royong. Someone fronts money for
// the group (pays the whole dinner, books the villa); this nets who owes whom and computes the
// FEWEST transfers to square everyone up. Each transfer then settles through the same shared-UA
// rails as the rest of Bareng, so "patungan" becomes a real financial primitive, not a chat thread.
//
// Pure — no SDK/network. Money path → tested (test/settle.test.mjs).

export type Expense = {
  payer: string; // who fronted the money
  amount: number; // total they paid
  split: string[]; // who shares it equally (include the payer if they also consumed)
  memo?: string;
};

export type Transfer = { from: string; to: string; amount: number };

/** Net position per member: positive = is owed money (creditor), negative = owes (debtor).
 *  Sums to ~0 by construction. */
export function netBalances(expenses: Expense[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const e of expenses) {
    if (e.amount <= 0) throw new Error("Settle: expense amount must be > 0");
    if (e.split.length === 0) throw new Error("Settle: expense needs at least one person to split among");
    const share = e.amount / e.split.length;
    bal[e.payer] = (bal[e.payer] ?? 0) + e.amount; // payer fronted the whole amount
    for (const p of e.split) bal[p] = (bal[p] ?? 0) - share; // each consumer owes their share
  }
  return bal;
}

/**
 * Minimize the transfers that settle everyone back to zero. Greedy: the biggest debtor pays the
 * biggest creditor each step. Works in integer cents so float dust never leaves someone owing
 * $0.0000001. Not guaranteed the theoretical minimum (that's NP-hard) but always ≤ n−1 transfers
 * and optimal for the everyday cases. The final match absorbs any rounding remainder.
 */
export function settleUp(expenses: Expense[]): Transfer[] {
  const bal = netBalances(expenses);
  const creditors = Object.entries(bal)
    .map(([who, v]) => ({ who, c: Math.round(v * 100) }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c);
  const debtors = Object.entries(bal)
    .map(([who, v]) => ({ who, c: -Math.round(v * 100) }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c);

  const transfers: Transfer[] = [];
  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const pay = Math.min(creditors[i].c, debtors[j].c);
    if (pay > 0) transfers.push({ from: debtors[j].who, to: creditors[i].who, amount: pay / 100 });
    creditors[i].c -= pay;
    debtors[j].c -= pay;
    if (creditors[i].c === 0) i++;
    if (debtors[j].c === 0) j++;
  }
  return transfers;
}
