"use client";

// Admin: invite members by @handle and set their weekly spend limit.
// The limit becomes a REAL EIP-7702 session-key grant: we mint the member a session
// key and the pot owner signs an EIP-712 SpendPermission binding that key to the cap
// (lib/sessionKey). Signed by the admin's Magic EOA when live, by a demo owner wallet
// otherwise — either way the grant is verified on the spot, so the cap is cryptographic,
// not an app-side promise. On-chain validator enforcement is the last step (Office Hours).

import { useState } from "react";
import Link from "next/link";
import { Wallet } from "ethers";
import { remaining, type Member } from "@/lib/limits";
import { newMember } from "@/lib/bareng";
import { claimHandle, isValidHandle } from "@/lib/handles";
import { createSessionKey, signGrant, verifyGrant, type SignerLike } from "@/lib/sessionKey";
import { signTypedData as magicSignTypedData } from "@/lib/magic";
import { ARBITRUM_USDC } from "@/lib/universalAccount";
import { useSession, MAGIC_CONFIGURED } from "@/lib/session";

const NOW = 1_000_000;
const WEEK = 604800n;
const USDC_DECIMALS = 1_000000n; // 6dp

// ponytail: demo UA owner so the grant signs/verifies with no keys set. Real owner =
// the admin's Magic EOA (used automatically once signed in). Well-known test key.
const DEMO_OWNER = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

type Row = Member & { sessionKey: string; grantOk: boolean };

export default function Admin() {
  const [members, setMembers] = useState<Row[]>([]);
  const [handle, setHandle] = useState("");
  const [limit, setLimit] = useState(50);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useSession();

  // Whoever owns the pot signs the grant: the live Magic EOA, else the demo owner.
  function ownerSigner(): { signer: SignerLike; owner: string } {
    if (session.address) return { signer: { signTypedData: magicSignTypedData }, owner: session.address };
    return { signer: DEMO_OWNER, owner: DEMO_OWNER.address };
  }

  async function invite() {
    setError("");
    if (!isValidHandle(handle)) {
      setError("Handle must be 3-20 chars: a-z, 0-9, _");
      return;
    }
    setBusy(true);
    try {
      // ponytail: real member EOA is captured on their first Magic login. Until then a
      // fresh valid address stands in so the grant's crypto actually signs/verifies.
      const address = createSessionKey().address;
      const h = claimHandle(handle, address);
      const sk = createSessionKey();
      const { signer, owner } = ownerSigner();
      const permission = {
        account: owner, // the UA owner (admin) — settles on Arbitrum One
        sessionKey: sk.address,
        member: address,
        limit: BigInt(limit) * USDC_DECIMALS,
        periodSeconds: WEEK,
        token: ARBITRUM_USDC,
      };
      const signature = await signGrant(signer, permission);
      const grantOk = verifyGrant(permission, signature, owner);
      setMembers((ms) => [
        ...ms,
        { ...newMember(address, h, limit, NOW), sessionKey: sk.address, grantOk },
      ]);
      setHandle("");
      setLimit(50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
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

      <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-2 text-center text-xs text-neutral-400">
        {MAGIC_CONFIGURED && session.address
          ? `Grants signed by owner ${session.address.slice(0, 6)}…${session.address.slice(-4)}`
          : "Demo owner signs grants — sign in with Magic to sign as the real pot owner"}
      </p>

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
        <button
          onClick={invite}
          disabled={busy}
          className="rounded-xl bg-indigo-600 py-3 font-semibold disabled:opacity-50"
        >
          {busy ? "Signing grant…" : `Invite @${handle || "…"}`}
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
            <div>
              <p className="font-medium text-indigo-400">@{m.name}</p>
              <p className="text-xs text-neutral-500">
                {m.grantOk ? "🔒 7702 grant signed & verified" : "⚠ grant unverified"} · key{" "}
                {m.sessionKey.slice(0, 6)}…{m.sessionKey.slice(-4)}
              </p>
            </div>
            <p className="text-sm text-neutral-400">
              ${remaining(m, NOW)} of ${m.limit}/wk
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
