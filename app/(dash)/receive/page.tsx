"use client";

// Private receive (stealth addresses, ERC-5564). The pot publishes a meta-address;
// an outside payer derives a FRESH one-time address per payment, so the pot's
// Universal Account never appears on-chain as the recipient. The pot scans the
// announcement, recovers the controlling key, and sweeps funds into the shared
// balance. All derivation is real (lib/stealth) and runs live in the browser.

import { useEffect, useState } from "react";
import {
  generateMetaAddress,
  generateStealthAddress,
  scan,
  computeStealthPrivateKey,
  addressFromPrivateKey,
  type StealthPayment,
} from "@/lib/stealth";
import { qrDataUrl } from "@/lib/qr";

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

export default function Receive() {
  // Pot's meta-address: generated CLIENT-SIDE after mount. It uses randomness, so generating it
  // during render (SSR + hydration) would mismatch the server HTML → React #418. null until mounted.
  const [pot, setPot] = useState<ReturnType<typeof generateMetaAddress> | null>(null);
  useEffect(() => setPot(generateMetaAddress()), []);
  const [payments, setPayments] = useState<StealthPayment[]>([]);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  function generate() {
    if (!pot) return;
    setPayments((p) => [generateStealthAddress(pot.spendPub, pot.viewPub), ...p].slice(0, 5));
  }

  // Prove the pot can detect this payment and recover the key that controls it.
  function verify(pay: StealthPayment) {
    if (!pot) return;
    const found = scan(pay.ephemeralPub, pay.viewTag, pot.viewPriv, pot.spendPub);
    const key = computeStealthPrivateKey(pay.ephemeralPub, pot.viewPriv, pot.spendPriv);
    const controls = found === pay.stealthAddress && addressFromPrivateKey(key) === pay.stealthAddress;
    setVerified((v) => ({ ...v, [pay.stealthAddress]: controls }));
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 p-5">
      <header className="flex items-center justify-between pt-4">
        <h1 className="text-xl font-bold">Receive privately</h1>
      </header>

      {/* Proof: a real private receive was auto-swept into the pot on-chain (gasless EIP-3009). */}
      <a
        href="https://arbiscan.io/tx/0xb338f36d10db2af93df49db33181c469c6ea552e782618fe25e78ac92e7f3ebe"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between rounded-xl border border-black bg-[var(--green)] px-3 py-2 text-xs text-black"
      >
        <span>✓ Real stealth receive swept into the pot on Arbitrum</span>
        <span className="font-mono text-green-700">0xb338f3…3ebe ↗</span>
      </a>

      <section className="rounded-2xl neo-sm p-4 text-sm text-black">
        <p>
          Each payment lands on a <b>fresh one-time address</b>. The pot&apos;s Universal Account
          stays unlinkable on-chain, then sweeps the funds into the shared balance.
        </p>
        <p className="mt-2 text-xs text-black/60">Pot meta-address (public): {pot ? short(pot.spendPub) : "generating…"}</p>
      </section>

      <button onClick={generate} disabled={!pot} className="rounded-xl neo-btn bg-[var(--blue)] py-3 font-semibold disabled:opacity-50">
        Generate one-time receive address
      </button>

      <section className="flex flex-col gap-2">
        {payments.length === 0 && (
          <p className="text-xs text-black/60">Tap above — every address will be different.</p>
        )}
        {payments.map((pay) => (
          <div key={pay.stealthAddress} className="flex items-start justify-between gap-3 rounded-xl neo-sm bg-[var(--panel)] p-3">
            <div className="min-w-0">
              <p className="font-mono text-sm">{short(pay.stealthAddress)}</p>
              <p className="text-xs text-black/60">view tag {pay.viewTag} · eph {short(pay.ephemeralPub)}</p>
              <button onClick={() => verify(pay)} className="mt-2 text-xs text-blue-700 font-bold">
                {verified[pay.stealthAddress] === undefined
                  ? "Verify pot can claim →"
                  : verified[pay.stealthAddress]
                    ? "✓ pot controls this address"
                    : "✗ verification failed"}
              </button>
            </div>
            <div className="shrink-0 rounded-lg bg-white p-1.5">
              {/* EIP-681 payment URI — a wallet scanning this opens a send to the one-time address. */}
              <img
                src={qrDataUrl(`ethereum:${pay.stealthAddress}`, 3, 2)}
                alt="Scan to pay this one-time address"
                width={84}
                height={84}
                className="[image-rendering:pixelated]"
              />
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
