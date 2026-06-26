"use client";

// Private receive (stealth addresses, ERC-5564). The pot publishes a meta-address;
// an outside payer derives a FRESH one-time address per payment, so the pot's
// Universal Account never appears on-chain as the recipient. The pot scans the
// announcement, recovers the controlling key, and sweeps funds into the shared
// balance. All derivation is real (lib/stealth) and runs live in the browser.

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  generateMetaAddress,
  generateStealthAddress,
  scan,
  computeStealthPrivateKey,
  addressFromPrivateKey,
  type StealthPayment,
} from "@/lib/stealth";

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

export default function Receive() {
  // Pot's meta-address: generated once. In production this is created at pot setup
  // and only the public halves are published.
  const pot = useMemo(() => generateMetaAddress(), []);
  const [payments, setPayments] = useState<StealthPayment[]>([]);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  function generate() {
    setPayments((p) => [generateStealthAddress(pot.spendPub, pot.viewPub), ...p].slice(0, 5));
  }

  // Prove the pot can detect this payment and recover the key that controls it.
  function verify(pay: StealthPayment) {
    const found = scan(pay.ephemeralPub, pay.viewTag, pot.viewPriv, pot.spendPub);
    const key = computeStealthPrivateKey(pay.ephemeralPub, pot.viewPriv, pot.spendPriv);
    const controls = found === pay.stealthAddress && addressFromPrivateKey(key) === pay.stealthAddress;
    setVerified((v) => ({ ...v, [pay.stealthAddress]: controls }));
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Receive privately</h1>
        <Link href="/" className="text-sm text-indigo-400">
          ← Dashboard
        </Link>
      </header>

      <section className="rounded-2xl border border-neutral-800 p-4 text-sm text-neutral-300">
        <p>
          Each payment lands on a <b>fresh one-time address</b>. The pot&apos;s Universal Account
          stays unlinkable on-chain, then sweeps the funds into the shared balance.
        </p>
        <p className="mt-2 text-xs text-neutral-500">Pot meta-address (public): {short(pot.spendPub)}</p>
      </section>

      <button onClick={generate} className="rounded-xl bg-indigo-600 py-3 font-semibold">
        Generate one-time receive address
      </button>

      <section className="flex flex-col gap-2">
        {payments.length === 0 && (
          <p className="text-xs text-neutral-500">Tap above — every address will be different.</p>
        )}
        {payments.map((pay) => (
          <div key={pay.stealthAddress} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <p className="font-mono text-sm">{short(pay.stealthAddress)}</p>
            <p className="text-xs text-neutral-500">view tag {pay.viewTag} · eph {short(pay.ephemeralPub)}</p>
            <button onClick={() => verify(pay)} className="mt-2 text-xs text-indigo-400">
              {verified[pay.stealthAddress] === undefined
                ? "Verify pot can claim →"
                : verified[pay.stealthAddress]
                  ? "✓ pot controls this address"
                  : "✗ verification failed"}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
