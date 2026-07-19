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
 *  Computed in integer cents and sums to EXACTLY 0 — the indivisible remainder cents from an
 *  uneven split (e.g. $10 / 3) are spread one-each across the first few consumers, never dropped,
 *  so no value is created or destroyed. Returned in dollars (each value is a whole number of cents). */
export function netBalances(expenses: Expense[]): Record<string, number> {
  const cents: Record<string, number> = {};
  for (const e of expenses) {
    if (!(e.amount > 0)) throw new Error("Settle: expense amount must be > 0"); // !(>0) also rejects NaN
    if (e.split.length === 0) throw new Error("Settle: expense needs at least one person to split among");
    if (new Set(e.split).size !== e.split.length) throw new Error("Settle: duplicate member in split");
    const total = Math.round(e.amount * 100);
    const n = e.split.length;
    const base = Math.floor(total / n);
    const extra = total - base * n; // leftover cents → the first `extra` consumers pay 1c more
    cents[e.payer] = (cents[e.payer] ?? 0) + total; // payer fronted the whole amount
    e.split.forEach((p, i) => {
      cents[p] = (cents[p] ?? 0) - (base + (i < extra ? 1 : 0)); // shares sum exactly to `total`
    });
  }
  const bal: Record<string, number> = {};
  for (const [k, c] of Object.entries(cents)) bal[k] = c / 100;
  return bal;
}

/**
 * Minimize the transfers that settle everyone back to zero. Greedy: the biggest debtor pays the
 * biggest creditor each step. netBalances already returns exact-cent balances that sum to zero, so
 * creditor cents and debtor cents match and nobody is left with a stray cent. Not guaranteed the
 * theoretical minimum (that's NP-hard) but always ≤ n−1 transfers and optimal for the everyday cases.
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
