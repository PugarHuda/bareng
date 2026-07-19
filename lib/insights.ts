// "Where the pot goes" — aggregate the transparent receipts into a group-spending view. Every
// member sees how the shared money splits across categories and who's spending. Pure over the
// receipt log (lib/receipts); no SDK/network. Tested (test/insights.test.mjs).

import { type Category, type Receipt } from "./receipts.ts";

export type CategoryTotal = { category: Category; total: number; share: number };

/** Spend per category, largest first, each as a share (0–1) of the whole. Empty log → []. */
export function spendByCategory(receipts: Receipt[]): CategoryTotal[] {
  const sum: Record<string, number> = {};
  let grand = 0;
  for (const r of receipts) {
    sum[r.category] = (sum[r.category] ?? 0) + r.amount;
    grand += r.amount;
  }
  return Object.entries(sum)
    .map(([category, total]) => ({ category: category as Category, total, share: grand ? total / grand : 0 }))
    .sort((a, b) => b.total - a.total);
}

/** Spend per member (the spender side of each receipt), largest first. */
export function spendByMember(receipts: Receipt[]): { member: string; total: number }[] {
  const sum: Record<string, number> = {};
  for (const r of receipts) sum[r.from] = (sum[r.from] ?? 0) + r.amount;
  return Object.entries(sum)
    .map(([member, total]) => ({ member, total }))
    .sort((a, b) => b.total - a.total);
}

export function totalSpent(receipts: Receipt[]): number {
  return receipts.reduce((s, r) => s + r.amount, 0);
}
