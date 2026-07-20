"use client";

// x402 agent — the Openfort angle, implemented for real.
// A member's 7702-capped session key is a SAFE agent wallet: it pays per-request for a service via
// x402 and PHYSICALLY cannot exceed the member's cap. This hits a REAL x402 endpoint (/api/x402):
// the agent gets a 402, signs a real EIP-3009 `transferWithAuthorization` (lib/x402pay), and the
// server verifies the signature before returning 200. The signed authorization is settlement-ready
// (a facilitator broadcasts it to USDC to settle). Only the final on-chain broadcast needs funds.

import { useRef, useState } from "react";
import { newMember } from "@/lib/bareng";
import { recordSpend, remaining, type Member } from "@/lib/limits";
import { payAndRetry } from "@/lib/x402";
import { signPayment } from "@/lib/x402pay";
import { ARBITRUM_USDC } from "@/lib/universalAccount";
import type { Hex } from "viem";

const NOW = 1_000_000;
// A REAL x402 payment that settled on-chain via EIP-3009 transferWithAuthorization (scripts/prove-x402).
const PROVEN_X402_TX = "0x4870c99abff9c1e2aeaec80ca39df1e25f78fc5ba3195cd0d6b9fad14f3ad67e";
const WANT = { asset: ARBITRUM_USDC, network: "arbitrum" };
const RESOURCE = "/api/x402";
// The agent's 7702-capped session key. A throwaway, well-known Anvil key (public) → its address is
// @budi's. The EIP-3009 signature it makes is real and verified server-side.
const AGENT_KEY: Hex = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

type Line = { id: number; text: string; kind: "info" | "pay" | "ok" | "block" };

export default function Agent() {
  // The agent spends as @budi, capped at $100/week. Real x402 handshake against /api/x402 with a
  // real EIP-3009 signature; only on-chain settlement (broadcasting it) needs funds.
  const [member, setMember] = useState<Member>(() => newMember("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "Budi", 100, NOW));
  const [charge, setCharge] = useState(20);
  const [log, setLog] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0); // stable ids for the prepended log (index keys mis-reconcile on prepend)
  const left = remaining(member, NOW);

  async function run() {
    setBusy(true);
    const add = (l: Omit<Line, "id">) => setLog((ls) => [{ ...l, id: seq.current++ }, ...ls].slice(0, 8));
    add({ text: `Agent GETs ${RESOURCE}?price=${charge} → expect 402 Payment Required`, kind: "info" });
    try {
      const res = await payAndRetry(
        // Real fetch to the real x402 endpoint. Response has .status + .json() — the FetchLike shape.
        (url, init) => fetch(url, init),
        `${RESOURCE}?price=${charge}`,
        member,
        WANT,
        NOW,
        // The pay step, for real: sign an EIP-3009 transferWithAuthorization with the capped key.
        async (req) => {
          add({ text: `Signing EIP-3009 authorization for $${charge} (capped key)…`, kind: "pay" });
          return (await signPayment(req, AGENT_KEY)).header;
        },
      );
      if (!res.paid) {
        add({ text: `${res.status} — resource was free, nothing to pay`, kind: "ok" });
        return;
      }
      const body = res.body as { paidBy?: string; settlementReady?: boolean } | undefined;
      if (res.status !== 200) {
        add({ text: `${res.status} — server rejected the payment, cap untouched`, kind: "block" });
        return;
      }
      // Only charge the cap once the server actually accepted (verified) the payment.
      const updated = recordSpend(member, res.charge, NOW);
      setMember(updated);
      add({ text: `Server verified the signature · paidBy ${body?.paidBy?.slice(0, 10)}…${body?.paidBy?.slice(-4)}`, kind: "pay" });
      add({ text: `200 OK — resource unlocked${body?.settlementReady ? " · settlement-ready" : ""}. Cap left: $${remaining(updated, NOW)}`, kind: "ok" });
    } catch (e) {
      add({ text: `${(e as Error).message}`, kind: "block" });
    } finally {
      setBusy(false);
    }
  }

  const color: Record<Line["kind"], string> = {
    info: "text-black/70",
    pay: "text-blue-700",
    ok: "text-green-700",
    block: "text-orange-600",
  };

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Agent wallet</h1>
      </header>

      {/* Proof this isn't a mock: a real x402 payment settled on-chain via transferWithAuthorization. */}
      <a
        href={`https://arbiscan.io/tx/${PROVEN_X402_TX}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl border border-black bg-[var(--green)] px-3 py-2 text-xs text-black"
      >
        <span>✓ Real x402 payment settled on Arbitrum</span>
        <span className="font-mono text-green-700">{PROVEN_X402_TX.slice(0, 8)}…{PROVEN_X402_TX.slice(-4)} ↗</span>
      </a>

      <section className="rounded-2xl neo-sm p-4 text-sm text-black">
        <p>
          The agent spends as <b className="text-blue-700 font-bold">@budi</b> using his{" "}
          <b>7702-capped key</b>. It pays for a service per-request via <b>x402</b>, bounded by a
          spend cap so it <b>can’t drain the pot</b>.
        </p>
        <p className="mt-2 text-xs text-black/60">
          Weekly cap $100 · <span className="text-black">${left} left</span>
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl neo-sm p-4">
        <label className="text-xs text-black/70">Service charge for this request: ${charge}</label>
        <input
          type="range"
          min={5}
          max={150}
          step={5}
          value={charge}
          onChange={(e) => setCharge(Number(e.target.value))}
          aria-label={`Service charge for this request: $${charge}`}
          className="accent-black"
        />
        <p className="text-xs text-black/60">
          Drag past ${left} left to watch the agent get refused — before paying anything.
        </p>
        <button
          onClick={run}
          disabled={busy}
          className="rounded-xl neo-btn bg-[var(--blue)] py-3 font-semibold disabled:opacity-50"
        >
          {busy ? "Running…" : "Agent: fetch premium data"}
        </button>
        <button
          onClick={() => { setMember(newMember("0x70997970C51812dc3A010C7d01b50e0d17dc79C8", "Budi", 100, NOW)); setLog([]); }}
          className="text-xs text-black/60"
        >
          Reset week
        </button>
      </section>

      {log.length > 0 && (
        <section className="flex flex-col gap-1 rounded-2xl neo-sm bg-[var(--panel)] p-4 text-xs">
          {log.map((l) => (
            <p key={l.id} className={color[l.kind]}>· {l.text}</p>
          ))}
        </section>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-black/60">
        Real x402 handshake (/api/x402) · EIP-3009 · <b>settled on-chain</b> · bounded by a 7702 cap
      </footer>
    </main>
  );
}
