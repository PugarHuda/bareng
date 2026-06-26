"use client";

// Admin: invite members by @handle and set their weekly spend limit.
// The limit becomes an EIP-7702 session key cap (enforced by lib/limits, mirrored
// on-chain once Particle keys are wired). Real handle + limit logic; the invitee's
// address is a placeholder until they log in with Magic and we capture their EOA.

import { useState } from "react";
import Link from "next/link";
import { remaining, type Member } from "@/lib/limits";
import { newMember } from "@/lib/bareng";
import { claimHandle, isValidHandle } from "@/lib/handles";

const NOW = 1_000_000;

export default function Admin() {
  const [members, setMembers] = useState<Member[]>([]);
  const [handle, setHandle] = useState("");
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState("");

  function invite() {
    setError("");
    if (!isValidHandle(handle)) {
      setError("Handle must be 3-20 chars: a-z, 0-9, _");
      return;
    }
    // ponytail: real address = the invitee's Magic EOA on first login. Placeholder here.
    const address = "0x" + handle.toLowerCase();
    try {
      const h = claimHandle(handle, address);
      setMembers((ms) => [...ms, newMember(address, h, limit, NOW)]);
      setHandle("");
      setLimit(50);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Manage pot</h1>
        <Link href="/" className="text-sm text-indigo-400">
          ← Dashboard
        </Link>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold">Invite a member</h2>
        <label className="text-xs text-neutral-400">Handle</label>
        <div className="flex items-center rounded-xl bg-neutral-900 px-3">
          <span className="text-neutral-500">@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="budi"
            className="flex-1 bg-transparent py-3 pl-1 outline-none"
          />
        </div>
        <label className="text-xs text-neutral-400">Weekly limit: ${limit}</label>
        <input
          type="range"
          min={5}
          max={500}
          step={5}
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="accent-indigo-500"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button onClick={invite} className="rounded-xl bg-indigo-600 py-3 font-semibold">
          Invite @{handle || "…"}
        </button>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-300">Members ({members.length})</h2>
        {members.length === 0 && <p className="text-xs text-neutral-500">No members yet.</p>}
        {members.map((m) => (
          <div
            key={m.address}
            className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
          >
            <p className="font-medium text-indigo-400">@{m.name}</p>
            <p className="text-sm text-neutral-400">
              ${remaining(m, NOW)} of ${m.limit}/wk
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
