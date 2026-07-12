"use client";

// Bareng demo screen. Runs visually with mock members BEFORE any SDK keys are
// set — the spend-limit logic (lib/limits) and handle registry (lib/handles) are
// real; only the on-chain send is stubbed. Wire Magic + UA where marked.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet } from "ethers";
import { canSpend, remaining, recordSpend, type Member } from "@/lib/limits";
import { newMember, spend, type SignedGrant } from "@/lib/bareng";
import { claimHandle, handleFor, potLink, resolveHandle } from "@/lib/handles";
import { signRootHash } from "@/lib/magic";
import { createSessionKey, signGrant, verifyGrant } from "@/lib/sessionKey";
import { ARBITRUM_USDC } from "@/lib/universalAccount";
import { useSession, MAGIC_CONFIGURED } from "@/lib/session";

const NOW = 1_000_000; // ponytail: fixed clock for the demo; use Date.now()/1000 when wired
const WEEK = 604800n;
const USDC_DECIMALS = 1_000000n;

// ponytail: demo pot owner so grants sign/verify with no keys set (matches admin).
const DEMO_OWNER = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

// ponytail: valid demo EOAs so the 7702 grant crypto actually signs (fake "0x..budi"
// strings can't be EIP-712-encoded). Real addresses arrive on Magic login.
const PEOPLE = [
  { address: createSessionKey().address, name: "Budi", handle: "budi", limit: 100 },
  { address: createSessionKey().address, name: "Sari", handle: "sari", limit: 50 },
  { address: createSessionKey().address, name: "Dewi", handle: "dewi", limit: 25 },
];
const POT_ADDRESS = createSessionKey().address;
const POT_HANDLE = "lunchsquad";

// Seed the handle registry (real claim/resolve, not hardcoded strings).
PEOPLE.forEach((p) => claimHandle(p.handle, p.address));
claimHandle(POT_HANDLE, POT_ADDRESS);

const SEED: Member[] = PEOPLE.map((p) => newMember(p.address, p.name, p.limit, NOW));

/** Owner-sign a real 7702 SpendPermission for one member (demo owner in this screen). */
async function signMemberGrant(m: Member): Promise<SignedGrant> {
  const permission = {
    account: DEMO_OWNER.address,
    sessionKey: createSessionKey().address,
    member: m.address,
    limit: BigInt(m.limit) * USDC_DECIMALS,
    periodSeconds: WEEK,
    token: ARBITRUM_USDC,
  };
  const signature = await signGrant(DEMO_OWNER, permission);
  return { permission, signature, owner: DEMO_OWNER.address };
}

export default function Home() {
  const [balance, setBalance] = useState(420);
  const [members, setMembers] = useState<Member[]>(SEED);
  const [active, setActive] = useState(0);
  const [amount, setAmount] = useState(10);
  const [feed, setFeed] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [grants, setGrants] = useState<Record<string, SignedGrant>>({});
  const [payee, setPayee] = useState("@sari");
  const session = useSession();

  // Sign a real 7702 grant per member on mount — the cap becomes cryptographic,
  // not just an app-side counter. Same primitive the admin uses.
  useEffect(() => {
    let live = true;
    Promise.all(SEED.map(signMemberGrant)).then((gs) => {
      if (live) setGrants(Object.fromEntries(gs.map((g) => [g.permission.member, g])));
    });
    return () => {
      live = false;
    };
  }, []);

  const me = members[active];
  const grant = grants[me.address];
  const left = remaining(me, NOW);
  // Pay to a @handle (resolved via the registry) or a raw 0x address.
  const receiver = /^0x[0-9a-fA-F]{40}$/.test(payee.trim()) ? payee.trim() : resolveHandle(payee);
  const ok = canSpend(me, amount, NOW) && amount <= balance && Boolean(receiver);

  function logSpend(updated: Member, note: string) {
    setMembers((ms) => ms.map((m, i) => (i === active ? updated : m)));
    setBalance((b) => b - amount);
    const to = handleFor(receiver ?? "") ? `@${handleFor(receiver ?? "")}` : payee.trim();
    setFeed((f) => [`@${handleFor(me.address)} paid $${amount} → ${to} · ${note}`, ...f].slice(0, 6));
  }

  async function doSpend() {
    if (!ok) return;
    if (session.ua) {
      // Real path: route the spend through the Universal Account, settle on Arbitrum.
      // The signed 7702 grant gates it — spend() refuses without a valid owner signature.
      try {
        const res = await spend(
          session.ua,
          me,
          { amount, receiver: receiver ?? session.address!, tokenAddress: ARBITRUM_USDC },
          signRootHash,
          NOW,
          grant,
        );
        logSpend(res.member, res.txHash || "settled on Arbitrum");
      } catch (e) {
        setFeed((f) => [`spend failed: ${(e as Error).message}`, ...f].slice(0, 6));
      }
      return;
    }
    // Demo path (no keys): same limit logic, on-chain call stubbed — but the 7702 grant
    // is verified for real so the "grant-authorized" claim on screen is honest.
    if (grant && !verifyGrant(grant.permission, grant.signature, grant.owner)) {
      setFeed((f) => ["spend blocked: invalid 7702 grant", ...f].slice(0, 6));
      return;
    }
    logSpend(recordSpend(me, amount, NOW), grant ? "7702 grant-authorized · Arbitrum (demo)" : "Arbitrum (demo)");
  }

  async function share() {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://bareng.me";
    await navigator.clipboard.writeText(potLink(POT_HANDLE, origin));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="pt-4">
        <h1 className="text-2xl font-bold tracking-tight">Bareng</h1>
        <p className="text-sm text-neutral-400">money, together — one balance, every chain</p>
        <nav className="mt-3 flex gap-4 text-sm">
          <Link href="/admin" className="text-indigo-400">Manage pot</Link>
          <Link href="/receive" className="text-indigo-400">Receive privately</Link>
        </nav>
      </header>

      {!MAGIC_CONFIGURED ? (
        <p className="rounded-xl border border-amber-700/40 bg-amber-900/20 p-2 text-center text-xs text-amber-300">
          Demo mode — add NEXT_PUBLIC_MAGIC_KEY + Particle keys to go live
        </p>
      ) : session.address ? (
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 p-2 text-sm">
          <span className="text-neutral-300">
            Signed in · {session.address.slice(0, 6)}…{session.address.slice(-4)}
          </span>
          <button onClick={session.signOut} className="text-indigo-400">Sign out</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-3">
          <button
            onClick={session.google}
            disabled={session.busy}
            className="rounded-lg bg-indigo-600 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Continue with Google
          </button>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={() => session.email(email)}
              disabled={session.busy || !email}
              className="rounded-lg bg-neutral-800 px-3 text-sm disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-200">Group Pot</p>
            <p className="text-sm font-semibold text-white">@{POT_HANDLE}</p>
          </div>
          <button
            onClick={share}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/25"
          >
            {copied ? "Copied!" : "Share link"}
          </button>
        </div>
        <p className="mt-3 text-4xl font-bold">${balance.toFixed(2)}</p>
        <p className="mt-1 text-xs text-indigo-200">unified balance · any token · any chain</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-300">Members & weekly limits</h2>
        {members.map((m, i) => {
          const r = remaining(m, NOW);
          return (
            <button
              key={m.address}
              onClick={() => setActive(i)}
              className={`flex items-center justify-between rounded-xl border p-3 text-left transition ${
                i === active ? "border-indigo-500 bg-neutral-900" : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-indigo-400">@{handleFor(m.address)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${r} left</p>
                <p className="text-xs text-neutral-500">of ${m.limit}/wk</p>
              </div>
            </button>
          );
        })}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-sm font-semibold">
          Spend as <span className="text-indigo-400">@{handleFor(me.address)}</span>
        </h2>
        <p className="text-xs text-neutral-500">
          {grant ? "🔒 7702 session-key grant · owner-signed & verified" : "signing 7702 grant…"}
        </p>
        <label className="text-xs text-neutral-400">Pay to (@handle or 0x address)</label>
        <input
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder="@sari or 0x…"
          className={`rounded-xl bg-neutral-900 px-3 py-2 text-sm outline-none ${
            payee.trim() && !receiver ? "ring-1 ring-red-500/60" : ""
          }`}
        />
        <input
          type="range"
          min={1}
          max={Math.max(me.limit, 1)}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="accent-indigo-500"
        />
        <div className="flex items-center justify-between text-sm">
          <span>Amount: <b>${amount}</b></span>
          <span className="text-neutral-400">${left} limit left</span>
        </div>
        <button
          onClick={doSpend}
          disabled={!ok}
          className="rounded-xl bg-indigo-600 py-3 font-semibold disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
        >
          {!receiver
            ? "Enter a valid payee"
            : ok
              ? `Pay $${amount}`
              : amount > left
                ? "Over limit"
                : "Not enough balance"}
        </button>
      </section>

      {feed.length > 0 && (
        <section className="flex flex-col gap-1 text-xs text-neutral-400">
          {feed.map((line, i) => (
            <p key={i}>· {line}</p>
          ))}
        </section>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-neutral-600">
        Particle UA · EIP-7702 session keys · Magic login · settled on Arbitrum
      </footer>
    </main>
  );
}
