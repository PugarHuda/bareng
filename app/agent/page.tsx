"use client";

// x402 agent demo — the headline of the Openfort angle.
// A member's 7702-capped session key is a SAFE agent wallet: it pays per-request for a
// service via x402, and PHYSICALLY cannot exceed the member's cap. Runs live against a
// mock endpoint (no network) so it works in demo mode; wire the real Openfort facilitator
// behind NEXT_PUBLIC_OPENFORT_FACILITATOR to settle for real.

import { useState } from "react";
import Link from "next/link";
import { newMember } from "@/lib/bareng";
import { recordSpend, remaining, type Member } from "@/lib/limits";
import { payAndRetry, type FetchLike, type PaymentRequirement } from "@/lib/x402";
import { ARBITRUM_USDC } from "@/lib/universalAccount";

const NOW = 1_000_000;
const WANT = { asset: ARBITRUM_USDC, network: "arbitrum" };
const RESOURCE = "https://api.premium.example/insight";

type Line = { text: string; kind: "info" | "pay" | "ok" | "block" };

export default function Agent() {
  // The agent spends as @budi, capped at $100/week — enforced on-chain by the 7702 key.
  const [member, setMember] = useState<Member>(() => newMember("0xA1budi", "Budi", 100, NOW));
  const [charge, setCharge] = useState(20);
  const [log, setLog] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const left = remaining(member, NOW);

  // Mock x402 server: first request 402s with a price; retry-with-payment returns 200.
  function mockServer(price: number): FetchLike {
    const req: PaymentRequirement = {
      scheme: "exact",
      network: "arbitrum",
      maxAmountRequired: String(Math.round(price * 1_000_000)),
      asset: ARBITRUM_USDC,
      payTo: "0xServiceProvider",
      resource: RESOURCE,
      description: "Premium market insight",
    };
    return async (_url, init) =>
      init?.headers?.["X-PAYMENT"]
        ? { status: 200, json: async () => ({ insight: "BTC regime: risk-on" }) }
        : { status: 402, json: async () => ({ x402Version: 1, accepts: [req] }) };
  }

  async function run() {
    setBusy(true);
    const add = (l: Line) => setLog((ls) => [l, ...ls].slice(0, 8));
    add({ text: `Agent requests ${RESOURCE} → 402 Payment Required ($${charge})`, kind: "info" });
    try {
      const res = await payAndRetry(
        mockServer(charge),
        RESOURCE,
        member,
        WANT,
        NOW,
        // The pay step: settle via the capped session key (Openfort facilitator in prod).
        async () => "0xPAYMENT_PROOF",
      );
      const updated = recordSpend(member, res.charge, NOW);
      setMember(updated);
      add({ text: `Paid $${res.charge} via 7702 session key · X-PAYMENT sent`, kind: "pay" });
      add({ text: `200 OK — resource unlocked. Cap left: $${remaining(updated, NOW)}`, kind: "ok" });
    } catch (e) {
      add({ text: `${(e as Error).message}`, kind: "block" });
    } finally {
      setBusy(false);
    }
  }

  const color: Record<Line["kind"], string> = {
    info: "text-neutral-400",
    pay: "text-indigo-300",
    ok: "text-emerald-400",
    block: "text-amber-400",
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Agent wallet</h1>
        <Link href="/" className="text-sm text-indigo-400">← Dashboard</Link>
      </header>

      <section className="rounded-2xl border border-neutral-800 p-4 text-sm text-neutral-300">
        <p>
          The agent spends as <b className="text-indigo-400">@budi</b> using his{" "}
          <b>7702 session key</b>. It pays for a service per-request via <b>x402</b> — and the
          on-chain cap means it <b>can never overspend the pot</b>.
        </p>
        <p className="mt-2 text-xs text-neutral-500">
          Weekly cap $100 · <span className="text-neutral-300">${left} left</span>
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-4">
        <label className="text-xs text-neutral-400">Service charge for this request: ${charge}</label>
        <input
          type="range"
          min={5}
          max={150}
          step={5}
          value={charge}
          onChange={(e) => setCharge(Number(e.target.value))}
          className="accent-indigo-500"
        />
        <p className="text-xs text-neutral-500">
          Drag past ${left} left to watch the agent get refused on-chain — without paying.
        </p>
        <button
          onClick={run}
          disabled={busy}
          className="rounded-xl bg-indigo-600 py-3 font-semibold disabled:opacity-50"
        >
          {busy ? "Running…" : "Agent: fetch premium data"}
        </button>
        <button
          onClick={() => { setMember(newMember("0xA1budi", "Budi", 100, NOW)); setLog([]); }}
          className="text-xs text-neutral-500"
        >
          Reset week
        </button>
      </section>

      {log.length > 0 && (
        <section className="flex flex-col gap-1 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs">
          {log.map((l, i) => (
            <p key={i} className={color[l.kind]}>· {l.text}</p>
          ))}
        </section>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-neutral-600">
        Openfort x402 · bounded by the ZeroDev 7702 cap · settles on Arbitrum
      </footer>
    </main>
  );
}
