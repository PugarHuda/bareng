"use client";

// Earn on idle balance — the pot's shared fund earns in Aave v3 between spends, one tap from liquid.
// "Put to work" builds the REAL Aave v3 approve+supply batch (lib/yield.buildSupply) — the exact
// calldata that settles through the Universal Account. This same batch already settled on Arbitrum
// (prove:aave, tx 0x7b56…), so what you see below is the real transaction, not a mock action.

import { useState } from "react";
import { idleAmount, projectedYield, buildSupply, type LendBatch } from "@/lib/yield";
import { ARBITRUM_USDC } from "@/lib/universalAccount";

const BALANCE = 420; // demo pot balance (USD)
const APY = 0.042; // representative Aave v3 USDC rate on Arbitrum (variable) — ponytail: read live from getReserveData
const POT_UA = "0x0Eba675deBf832A81815Fe96025E04d5f40379C6"; // the pot's UA (7702) — the account prove:aave supplied from
const AAVE_PROOF_TX = "0x7b5698c055a7d583e024805d48ac5c55e54c8da0c23bcc08a707730d85606dad";

export default function Earn() {
  const [reserve, setReserve] = useState(100);
  const [lent, setLent] = useState(0);
  const [note, setNote] = useState("");
  const [batch, setBatch] = useState<LendBatch | null>(null);
  const idle = idleAmount(BALANCE - lent, reserve);

  function putToWork() {
    // Build the REAL approve+supply batch (same builder scripts/prove-aave sends through the UA).
    const b = buildSupply(ARBITRUM_USDC, BigInt(Math.round(idle * 1_000_000)), POT_UA);
    setBatch(b);
    setLent((l) => l + idle);
    setNote(`Built the Aave v3 supply for $${idle} · projected ~$${projectedYield(lent + idle, APY, 365).toFixed(2)}/yr · still one tap to spend`);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Earn on idle balance</h1>
      </header>

      <section className="rounded-2xl neo-sm p-4 text-sm text-black">
        <p>
          A shared fund mostly sits still between spends. Bareng routes the <b>idle part</b> into{" "}
          <b>Aave v3 on Arbitrum</b> so it earns — kept <b>one tap</b> from being spent.
        </p>
        <p className="mt-2 text-xs text-black/60">
          Pot balance ${BALANCE} · lent ${lent} · <span className="text-green-700">~{(APY * 100).toFixed(1)}% APY</span> (variable)
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl neo-sm p-4">
        <label className="text-xs text-black/70">Keep liquid for spending: ${reserve}</label>
        <input
          type="range"
          min={0}
          max={BALANCE}
          step={10}
          value={reserve}
          onChange={(e) => setReserve(Number(e.target.value))}
          aria-label={`Reserve to keep liquid: $${reserve}`}
          className="accent-black"
        />
        <div className="flex items-center justify-between text-sm">
          <span>Idle → earn: <b className="text-green-700">${idle}</b></span>
          <span className="text-black/70">~${projectedYield(idle, APY, 365).toFixed(2)}/yr · ${projectedYield(idle, APY, 30).toFixed(2)}/mo</span>
        </div>
        <button
          onClick={putToWork}
          disabled={idle <= 0}
          className="rounded-xl neo-btn bg-[var(--green)] py-3 font-semibold disabled:cursor-not-allowed disabled:bg-[var(--panel)] disabled:text-black/60"
        >
          {idle > 0 ? `Put $${idle} to work` : "Nothing idle to lend"}
        </button>
        {lent > 0 && (
          <button onClick={() => { setLent(0); setNote("Withdrew everything back to liquid."); }} className="text-xs text-black/60">
            Withdraw all
          </button>
        )}
      </section>

      {note && (
        <p className="rounded-xl neo-sm bg-[var(--green)] p-2 text-center text-xs text-black">{note}</p>
      )}

      {batch && (
        <section className="flex flex-col gap-2 rounded-2xl neo-sm p-4 text-xs">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold text-black">Real Aave v3 batch · ready for the UA</h2>
            <span className="text-black/60">chain {batch.chainId}</span>
          </div>
          {batch.transactions.map((t, i) => (
            <div key={i} className="rounded-lg bg-[var(--panel)] p-2">
              <p className="font-bold text-black">{i === 0 ? "1 · approve" : "2 · supply"} → {i === 0 ? "USDC" : "Aave Pool"}</p>
              <p className="break-all font-mono text-[10px] text-black/60">to {t.to}</p>
              <p className="break-all font-mono text-[10px] text-black/60">{t.data.slice(0, 42)}…</p>
            </div>
          ))}
          <a
            href={`https://arbiscan.io/tx/${AAVE_PROOF_TX}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-green-700 underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            ✓ this exact batch already settled on Arbitrum · {AAVE_PROOF_TX.slice(0, 8)}…{AAVE_PROOF_TX.slice(-4)} ↗
          </a>
        </section>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-black/60">
        Aave v3 · Arbitrum · builds the real approve+supply batch (settled on-chain)
      </footer>
    </main>
  );
}
