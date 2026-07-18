// Transparent group receipts — every spend is a tagged, auditable line the whole pot can see.
// Pure model (no SDK/network); the money path already enforces the cap, this just records intent.
// ponytail: in-memory in the demo like the rest of the app state; persist alongside handles if the
// pot ever needs history across sessions.

export const CATEGORIES = ["Food", "Transport", "Bills", "Fun", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

export type Receipt = {
  from: string; // @handle or address of the spender
  to: string; // @handle or address of the payee
  amount: number;
  category: Category;
  memo: string; // free text, e.g. "team lunch"
  note: string; // settlement note or tx hash, e.g. "Arbitrum (demo)" / "0x…"
  ts: number; // unix seconds — caller supplies (keeps this testable / deterministic)
};

/** Build a receipt, clamping an unknown category to "Other" and bounding the memo. */
export function makeReceipt(r: {
  from: string;
  to: string;
  amount: number;
  category?: string;
  memo?: string;
  note?: string;
  ts: number;
}): Receipt {
  const category = (CATEGORIES as readonly string[]).includes(r.category ?? "")
    ? (r.category as Category)
    : "Other";
  return {
    from: r.from,
    to: r.to,
    amount: r.amount,
    category,
    memo: (r.memo ?? "").trim().slice(0, 80),
    note: r.note ?? "",
    ts: r.ts,
  };
}

/** One-line human form (feed fallback, tests, the /agent screen). */
export function formatReceipt(r: Receipt): string {
  const memo = r.memo ? ` — ${r.memo}` : "";
  return `${r.from} paid $${r.amount} → ${r.to} · ${r.category}${memo}`;
}
