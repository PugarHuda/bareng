"use client";

// Arisan (ROSCA) — Indonesia's rotating savings circle, trustless on-chain. Every round each member
// pays into the shared pot; one member collects the whole pot. Over N rounds everyone collects once.
// Demo runs keyless; live, contributions are UA spends in and the payout is a UA transfer out.

import { useState } from "react";
import {
  newArisan, potThisRound, recipientThisRound, roundReady, isComplete, contribute, payout, type Arisan,
} from "@/lib/arisan";
import { drawOrder } from "@/lib/draw";

const MEMBERS = ["@budi", "@sari", "@dewi"];

export default function ArisanPage() {
  const [a, setA] = useState<Arisan>(() => newArisan(MEMBERS, 10));
  const [seed, setSeed] = useState<string | null>(null);
  const [note, setNote] = useState("Everyone chips in $10 a round. Each round one person takes the pot.");
  const recipient = recipientThisRound(a);
  const done = isComplete(a);
  const canDraw = a.round === 0 && a.paidThisRound.length === 0; // only before the circle starts

  // Verifiable fair draw: derive the collection order from a public seed (here a stand-in for a
  // future Arbitrum block hash). Anyone recomputes drawOrder(MEMBERS, seed) to check it was fair.
  function fairDraw() {
    const s = `block#${Math.floor(Math.random() * 1e7)}`;
    const order = drawOrder(MEMBERS, s);
    setSeed(s);
    setA(newArisan(order, 10));
    setNote(`🎲 Fair draw → ${order.join(" → ")}. Recompute from the seed to verify nobody rigged it.`);
  }

  function pay(member: string) {
    try {
      contribute(a, member); // validate synchronously so invalid clicks surface the error
    } catch (e) {
      setNote((e as Error).message);
      return;
    }
    // Apply against the LATEST state, not the closed-over `a` — two rapid clicks on different
    // members must both land. Guard the same-member race so we never throw inside the updater.
    setA((prev) => (prev.paidThisRound.includes(member) ? prev : contribute(prev, member)));
    setNote(`${member} paid in $${a.contribution}.`);
  }

  function collect() {
    const { arisan, recipient, amount } = payout(a);
    setA(arisan);
    setNote(`🎉 ${recipient} collected the $${amount} pot! ${isComplete(arisan) ? "Circle complete — everyone got a turn." : "Next round begins."}`);
  }

  function reset() {
    setA(newArisan(MEMBERS, 10));
    setSeed(null);
    setNote("Fresh circle. Everyone chips in $10 a round.");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Arisan</h1>
      </header>

      <section className="rounded-2xl neo-sm p-4 text-sm text-black">
        <p>
          <b>Arisan</b> is Indonesia&apos;s rotating savings circle — <i>gotong royong</i> for money.
          Each round everyone pays in; one member takes the whole pot. Bareng makes it <b>trustless</b>:
          the shared account holds the pot and the rules are code.
        </p>
        <p className="mt-2 text-xs text-black/60">
          {done ? "Circle complete" : `Round ${a.round + 1} of ${a.members.length}`} · pot ${potThisRound(a)} ·
          {" "}${a.contribution}/member
        </p>
      </section>

      <section className="rounded-2xl border border-black bg-[var(--purple)] p-3 text-xs">
        {seed ? (
          <p className="text-black">
            🎲 <b>Verifiable fair draw</b> · seed <span className="font-mono text-black">{seed}</span>
            <span className="mt-1 block text-black/70">
              Order: {a.members.join(" → ")}. Recompute <span className="font-mono">drawOrder(members, seed)</span>
              {" "}to prove it — nobody chose who collects first.
            </span>
          </p>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-black/70">Order is fixed. Draw a <b>provably-fair</b> one from a public seed?</span>
            <button
              onClick={fairDraw}
              disabled={!canDraw}
              className="shrink-0 rounded-lg neo-btn bg-[var(--pink)] px-3 py-1 font-semibold disabled:bg-[var(--panel)] disabled:text-black/60"
            >
              🎲 Fair draw
            </button>
          </div>
        )}
      </section>

      {!done && (
        <section className="rounded-2xl border border-black bg-[var(--panel)]/15 p-4 text-center">
          <p className="text-xs text-black/70">This round collects</p>
          <p className="text-2xl font-bold text-blue-700">{recipient}</p>
          <p className="text-xs text-black/60">takes ${potThisRound(a)} when everyone has paid</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        {a.members.map((m) => {
          const paid = a.paidThisRound.includes(m);
          const won = a.received.includes(m);
          return (
            <div key={m} className="flex items-center justify-between rounded-xl neo-sm bg-[var(--panel)] p-3 text-sm">
              <span>
                <span className="text-blue-700 font-bold">{m}</span>
                {won && <span className="ml-2 text-[10px] text-green-700">✓ collected</span>}
                {m === recipient && <span className="ml-2 text-[10px] text-blue-700">← this round</span>}
              </span>
              <button
                onClick={() => pay(m)}
                disabled={paid || done}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  paid ? "bg-[var(--panel)] text-black/60" : "neo-btn bg-[var(--blue)]"
                }`}
              >
                {paid ? "paid ✓" : `pay $${a.contribution}`}
              </button>
            </div>
          );
        })}
      </section>

      {!done && (
        <button
          onClick={collect}
          disabled={!roundReady(a)}
          className="rounded-xl neo-btn bg-[var(--green)] py-3 font-semibold disabled:cursor-not-allowed disabled:bg-[var(--panel)] disabled:text-black/60"
        >
          {roundReady(a) ? `Pay out $${potThisRound(a)} to ${recipient}` : "Waiting for everyone to pay in"}
        </button>
      )}
      {done && (
        <button onClick={reset} className="rounded-xl neo-btn bg-[var(--blue)] py-3 font-semibold">Start a new circle</button>
      )}

      <p className="rounded-xl neo-sm bg-[var(--panel)] p-2 text-center text-xs text-black/70">{note}</p>

      <footer className="pb-6 pt-2 text-center text-xs text-black/50">
        Gotong royong onchain · rotating savings · one shared Universal Account
      </footer>
    </main>
  );
}
