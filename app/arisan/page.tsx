"use client";

// Arisan (ROSCA) — Indonesia's rotating savings circle, trustless on-chain. Every round each member
// pays into the shared pot; one member collects the whole pot. Over N rounds everyone collects once.
// Demo runs keyless; live, contributions are UA spends in and the payout is a UA transfer out.

import { useState } from "react";
import Link from "next/link";
import {
  newArisan, potThisRound, recipientThisRound, roundReady, isComplete, contribute, payout, type Arisan,
} from "@/lib/arisan";

const MEMBERS = ["@budi", "@sari", "@dewi"];

export default function ArisanPage() {
  const [a, setA] = useState<Arisan>(() => newArisan(MEMBERS, 10));
  const [note, setNote] = useState("Everyone chips in $10 a round. Each round one person takes the pot.");
  const recipient = recipientThisRound(a);
  const done = isComplete(a);

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
    setNote("Fresh circle. Everyone chips in $10 a round.");
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Arisan</h1>
        <Link href="/" className="text-sm text-indigo-400">← Dashboard</Link>
      </header>

      <section className="rounded-2xl border border-neutral-800 p-4 text-sm text-neutral-300">
        <p>
          <b>Arisan</b> is Indonesia&apos;s rotating savings circle — <i>gotong royong</i> for money.
          Each round everyone pays in; one member takes the whole pot. Bareng makes it <b>trustless</b>:
          the shared account holds the pot and the rules are code.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          {done ? "Circle complete" : `Round ${a.round + 1} of ${a.members.length}`} · pot ${potThisRound(a)} ·
          {" "}${a.contribution}/member
        </p>
      </section>

      {!done && (
        <section className="rounded-2xl border border-indigo-800/40 bg-indigo-900/15 p-4 text-center">
          <p className="text-xs text-neutral-400">This round collects</p>
          <p className="text-2xl font-bold text-indigo-300">{recipient}</p>
          <p className="text-xs text-neutral-500">takes ${potThisRound(a)} when everyone has paid</p>
        </section>
      )}

      <section className="flex flex-col gap-2">
        {a.members.map((m) => {
          const paid = a.paidThisRound.includes(m);
          const won = a.received.includes(m);
          return (
            <div key={m} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 text-sm">
              <span>
                <span className="text-indigo-400">{m}</span>
                {won && <span className="ml-2 text-[10px] text-emerald-400">✓ collected</span>}
                {m === recipient && <span className="ml-2 text-[10px] text-indigo-300">← this round</span>}
              </span>
              <button
                onClick={() => pay(m)}
                disabled={paid || done}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  paid ? "bg-neutral-800 text-neutral-500" : "bg-indigo-600 text-white"
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
          className="rounded-xl bg-emerald-600 py-3 font-semibold disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
        >
          {roundReady(a) ? `Pay out $${potThisRound(a)} to ${recipient}` : "Waiting for everyone to pay in"}
        </button>
      )}
      {done && (
        <button onClick={reset} className="rounded-xl bg-indigo-600 py-3 font-semibold">Start a new circle</button>
      )}

      <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-2 text-center text-xs text-neutral-400">{note}</p>

      <footer className="pb-6 pt-2 text-center text-xs text-neutral-600">
        Gotong royong onchain · rotating savings · one shared Universal Account
      </footer>
    </main>
  );
}
