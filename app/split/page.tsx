"use client";

// Split-the-bill / settle-up — the everyday half of gotong royong. People front money for the
// group; this nets who owes whom and shows the FEWEST transfers to square up. Each settle routes
// through the same shared Universal Account as the rest of Bareng (demo settles in-UI).

import { useState } from "react";
import Link from "next/link";
import { settleUp, netBalances, type Expense } from "@/lib/settle";

const MEMBERS = ["@budi", "@sari", "@dewi"];
const usd = (n: number) => `$${n.toFixed(2)}`;

export default function SplitPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { payer: "@budi", amount: 30, split: MEMBERS, memo: "Lunch" },
  ]);
  const [payer, setPayer] = useState("@budi");
  const [amount, setAmount] = useState(20);
  const [memo, setMemo] = useState("");
  const [settled, setSettled] = useState<string[]>([]);

  const bal = netBalances(expenses);
  const transfers = settleUp(expenses);

  function add() {
    if (amount <= 0) return;
    setExpenses((xs) => [...xs, { payer, amount, split: MEMBERS, memo: memo.trim() || "Expense" }]);
    setMemo("");
    setSettled([]); // balances changed → any prior "settled" ticks no longer apply
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Split &amp; settle up</h1>
        <Link href="/app" className="text-sm text-blue-700 font-bold">← Dashboard</Link>
      </header>

      <section className="rounded-2xl neo-sm p-4 text-sm text-black">
        <p>
          Someone always fronts the bill. Log who paid for what; Bareng nets it down to the{" "}
          <b>fewest transfers</b> that make everyone even — then each settles through the shared
          Universal Account. <i>Patungan</i>, without the spreadsheet.
        </p>
      </section>

      {/* Add an expense */}
      <section className="flex flex-col gap-2 rounded-2xl neo-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Add an expense</p>
        <div className="flex gap-2">
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            aria-label="Who paid"
            className="rounded-lg bg-[var(--panel)] px-2 py-2 text-sm outline-none"
          >
            {MEMBERS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="self-center text-xs text-black/60">paid</span>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            aria-label="Amount paid"
            className="w-20 rounded-lg bg-[var(--panel)] px-2 py-2 text-sm outline-none"
          />
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="for… (dinner)"
            aria-label="What the expense was for"
            className="flex-1 rounded-lg bg-[var(--panel)] px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          onClick={add}
          disabled={amount <= 0}
          className="rounded-lg neo-btn bg-[var(--blue)] py-2 text-sm font-semibold disabled:bg-[var(--panel)] disabled:text-black/60"
        >
          Add · split equally across {MEMBERS.length}
        </button>
      </section>

      {/* Expense log */}
      <section className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-black/70">Expenses</p>
        {expenses.map((e, i) => (
          <div key={i} className="flex justify-between rounded-lg neo-sm bg-[var(--panel)] px-3 py-2 text-sm">
            <span><span className="text-blue-700 font-bold">{e.payer}</span> · {e.memo}</span>
            <span className="text-black">{usd(e.amount)}</span>
          </div>
        ))}
      </section>

      {/* Net position */}
      <section className="rounded-2xl neo-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-black/60">Where everyone stands</p>
        <div className="mt-2 flex flex-col gap-1 text-sm">
          {MEMBERS.map((m) => {
            const v = bal[m] ?? 0;
            const owed = v > 0.005;
            const owes = v < -0.005;
            return (
              <div key={m} className="flex justify-between">
                <span className="text-blue-700 font-bold">{m}</span>
                <span className={owed ? "text-green-700" : owes ? "text-orange-600" : "text-black/60"}>
                  {owed ? `is owed ${usd(v)}` : owes ? `owes ${usd(-v)}` : "settled"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Minimized settle-up */}
      <section className="rounded-2xl neo-sm bg-[var(--green)] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-black">
          Settle up · {transfers.length} transfer{transfers.length === 1 ? "" : "s"}
        </p>
        {transfers.length === 0 ? (
          <p className="mt-2 text-sm text-black/70">Everyone&apos;s even. 🎉</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {transfers.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-orange-600">{t.from}</span>
                  <span className="text-black/60"> → </span>
                  <span className="text-green-700">{t.to}</span>
                  <span className="ml-2 text-black">{usd(t.amount)}</span>
                </span>
                <button
                  onClick={() => setSettled((s) => (s.includes(String(i)) ? s : [...s, String(i)]))}
                  disabled={settled.includes(String(i))}
                  className="rounded-lg neo-btn bg-[var(--green)] px-3 py-1 text-xs font-semibold disabled:bg-[var(--panel)] disabled:text-black/60"
                >
                  {settled.includes(String(i)) ? "sent ✓" : "settle via UA"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="pb-6 pt-2 text-center text-xs text-black/50">
        Debt netting · fewest transfers · settled on one shared Universal Account
      </footer>
    </main>
  );
}
