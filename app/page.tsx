"use client";

// Bareng demo screen. Runs visually with mock members BEFORE any SDK keys are
// set — the spend-limit logic (lib/limits) and handle registry (lib/handles) are
// real; only the on-chain send is stubbed. Wire Magic + UA where marked.

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAddress } from "viem";
import { canSpend, remaining, recordSpend, type Member } from "@/lib/limits";
import { newMember, spend, type SignedGrant } from "@/lib/bareng";
import { claimHandle, handleFor, potLink, resolveHandle } from "@/lib/handles";
import { signRootHash } from "@/lib/magic";
import { createSessionKey, signGrant, verifyGrant } from "@/lib/sessionKey";
import { DEMO_OWNER } from "@/lib/demo";
import { ARBITRUM_USDC } from "@/lib/universalAccount";
import { useSession, MAGIC_CONFIGURED } from "@/lib/session";
import { makeReceipt, CATEGORIES, type Receipt } from "@/lib/receipts";

const NOW = 1_000_000; // ponytail: fixed clock for the demo; use Date.now()/1000 when wired
const WEEK = 604800n;
const USDC_DECIMALS = 1_000000n;

// Fixed, valid checksummed demo EOAs — STABLE across refresh (so @budi is always the same
// identity) and EIP-712-encodable so the 7702 grant crypto actually signs. Real addresses
// arrive on Magic login. (Well-known Anvil test addresses.)
const PEOPLE = [
  { address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", name: "Budi", handle: "budi", limit: 100 },
  { address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", name: "Sari", handle: "sari", limit: 50 },
  { address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", name: "Dewi", handle: "dewi", limit: 25 },
];
const POT_ADDRESS = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65";
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
  const [feed, setFeed] = useState<Receipt[]>([]);
  const [notice, setNotice] = useState("");
  const [memo, setMemo] = useState("");
  const [category, setCategory] = useState<string>("Food");
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [grants, setGrants] = useState<Record<string, SignedGrant>>({});
  const [payee, setPayee] = useState("@sari");
  const [srcChain, setSrcChain] = useState("Base");
  const [now, setNow] = useState(NOW); // advance to demo the rolling weekly window
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
  const left = remaining(me, now);
  // Pay to a @handle (resolved via the registry) or a checksum-valid 0x address.
  const receiver = isAddress(payee.trim(), { strict: false }) ? payee.trim() : resolveHandle(payee);
  const ok = canSpend(me, amount, now) && amount <= balance && Boolean(receiver);

  function logSpend(updated: Member, note: string) {
    setMembers((ms) => ms.map((m, i) => (i === active ? updated : m)));
    setBalance((b) => b - amount);
    const to = handleFor(receiver ?? "") ? `@${handleFor(receiver ?? "")}` : payee.trim();
    const receipt = makeReceipt({
      from: `@${handleFor(me.address)}`,
      to,
      amount,
      category,
      memo,
      note,
      ts: now,
    });
    setFeed((f) => [receipt, ...f].slice(0, 8));
    setMemo("");
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
          now,
          grant,
        );
        logSpend(res.member, res.txHash || "settled on Arbitrum");
      } catch (e) {
        setNotice(`spend failed: ${(e as Error).message}`);
      }
      return;
    }
    // Demo path (no keys): same limit logic, on-chain call stubbed — but the 7702 grant
    // is verified for real so the "grant-authorized" claim on screen is honest.
    if (grant && !verifyGrant(grant.permission, grant.signature, grant.owner)) {
      setNotice("spend blocked: invalid 7702 grant");
      return;
    }
    logSpend(recordSpend(me, amount, now), grant ? "7702 grant-authorized · Arbitrum (demo)" : "Arbitrum (demo)");
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
          <Link href="/agent" className="text-indigo-400">Agent wallet</Link>
          <Link href="/earn" className="text-indigo-400">Earn</Link>
          <Link href="/arisan" className="text-indigo-400">Arisan</Link>
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
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-indigo-200">Top up from</span>
          <select
            value={srcChain}
            onChange={(e) => setSrcChain(e.target.value)}
            aria-label="Source chain to top up from"
            className="rounded-lg bg-white/15 px-2 py-1 text-xs font-medium text-white outline-none"
          >
            {["Base", "Polygon", "Optimism", "Arbitrum"].map((c) => (
              <option key={c} value={c} className="text-black">{c}</option>
            ))}
          </select>
          <button
            onClick={() => {
              setBalance((b) => b + 50);
              setNotice(`topped up $50 from ${srcChain} → unified on Arbitrum (demo)`);
            }}
            aria-label={`Top up $50 from ${srcChain}`}
            className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-white"
          >
            +$50
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-300">Members & weekly limits</h2>
          <button
            onClick={() => {
              setNow((n) => n + 604800);
              setNotice("⏭ a week passed — every cap reset");
            }}
            className="text-xs text-indigo-400"
          >
            Simulate next week →
          </button>
        </div>
        {members.map((m, i) => {
          const r = remaining(m, now);
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
          aria-label={`Amount to spend, up to $${me.limit}`}
          className="accent-indigo-500"
        />
        <div className="flex items-center justify-between text-sm">
          <span>Amount: <b>${amount}</b></span>
          <span className="text-neutral-400">${left} limit left</span>
        </div>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="What's it for? (e.g. team lunch)"
          maxLength={80}
          aria-label="Memo — what this spend is for"
          className="rounded-xl bg-neutral-900 px-3 py-2 text-sm outline-none"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`rounded-full px-3 py-1 text-xs ${
                category === c ? "bg-indigo-600 text-white" : "bg-neutral-900 text-neutral-400"
              }`}
            >
              {c}
            </button>
          ))}
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

      {notice && (
        <p className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-2 text-center text-xs text-neutral-400">{notice}</p>
      )}

      {feed.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold text-neutral-400">Group receipts · everyone can see</h2>
          {feed.map((r, i) => (
            <div key={i} className="flex items-start justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-2.5 text-xs">
              <div className="min-w-0">
                <p className="text-neutral-200">
                  <span className="text-indigo-400">{r.from}</span> → {r.to}
                  {r.memo && <span className="text-neutral-400"> · {r.memo}</span>}
                </p>
                <p className="text-neutral-500">{r.note}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-neutral-100">${r.amount}</p>
                <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300">{r.category}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <footer className="pb-6 pt-2 text-center text-xs text-neutral-600">
        Particle UA · EIP-7702 session keys · Magic login · settled on Arbitrum
      </footer>
    </main>
  );
}
