"use client";

// Earn on idle balance — the pot's shared fund earns in Aave v3 between spends, one tap from liquid.
// Demo runs keyless (mock balance, projections real). Live mode builds an approve+supply batch
// (lib/yield) and sends it through the Universal Account (createUniversalTransaction) — the same
// proven UA path as scripts/prove-onchain.

import { useState } from "react";
import Link from "next/link";
import { idleAmount, projectedYield } from "@/lib/yield";

const BALANCE = 420; // demo pot balance (USD)
const APY = 0.042; // representative Aave v3 USDC rate on Arbitrum (variable) — ponytail: read live from getReserveData

export default function Earn() {
  const [reserve, setReserve] = useState(100);
  const [lent, setLent] = useState(0);
  const [note, setNote] = useState("");
  const idle = idleAmount(BALANCE - lent, reserve);

  function putToWork() {
    // Demo: reflect the lend locally. Live: buildSupply(USDC, idle*1e6, UA) → ua.createUniversalTransaction.
    setLent((l) => l + idle);
    setNote(`Lent $${idle} into Aave v3 · earning ~$${projectedYield(lent + idle, APY, 365).toFixed(2)}/yr · still one tap to spend`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Earn on idle balance</h1>
        <Link href="/" className="text-sm text-indigo-400">← Dashboard</Link>
      </header>

      <section className="rounded-2xl border border-neutral-800 p-4 text-sm text-neutral-300">
        <p>
          A shared fund mostly sits still between spends. Bareng routes the <b>idle part</b> into{" "}
          <b>Aave v3 on Arbitrum</b> so it earns — kept <b>one tap</b> from being spent.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Pot balance ${BALANCE} · lent ${lent} · <span className="text-emerald-400">~{(APY * 100).toFixed(1)}% APY</span> (variable)
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-4">
        <label className="text-xs text-neutral-400">Keep liquid for spending: ${reserve}</label>
        <input
          type="range"
          min={0}
          max={BALANCE}
          step={10}
          value={reserve}
          onChange={(e) => setReserve(Number(e.target.value))}
          aria-label={`Reserve to keep liquid: $${reserve}`}
          className="accent-indigo-500"
        />
        <div className="flex items-center justify-between text-sm">
          <span>Idle → earn: <b className="text-emerald-400">${idle}</b></span>
          <span className="text-neutral-400">~${projectedYield(idle, APY, 365).toFixed(2)}/yr · ${projectedYield(idle, APY, 30).toFixed(2)}/mo</span>
        </div>
        <button
          onClick={putToWork}
          disabled={idle <= 0}
          className="rounded-xl bg-emerald-600 py-3 font-semibold disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
        >
          {idle > 0 ? `Put $${idle} to work` : "Nothing idle to lend"}
        </button>
        {lent > 0 && (
          <button onClick={() => { setLent(0); setNote("Withdrew everything back to liquid."); }} className="text-xs text-neutral-500">
            Withdraw all
          </button>
        )}
      </section>

      {note && (
        <p className="rounded-xl border border-emerald-800/40 bg-emerald-900/15 p-2 text-center text-xs text-emerald-300">{note}</p>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-neutral-600">
        Aave v3 · Arbitrum · idle-balance yield · reference demo
      </footer>
    </main>
  );
}
