// Stealth addresses (ERC-5564 scheme on secp256k1).
//
// Used for PRIVATE money movement that the shared Universal Account shouldn't
// expose publicly:
//   • Receiving from OUTSIDE the pot — an external payer sends to a fresh
//     one-time address derived from the pot's published meta-address, so the
//     pot's UA isn't linkable on-chain.
//   • Paying OUT to a member's personal address without doxxing it.
//
// Real cryptography via audited @noble libs (secp256k1 v3) — no hand-rolled
// curve math. Verified by test/stealth.test.mjs: the recipient recovers the
// controlling key, a stranger cannot, and repeat payments are unlinkable.

import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3.js";

type Pt = InstanceType<typeof secp.Point>;
const Point = secp.Point;
const G = Point.BASE;
// secp256k1 group order. noble v3 no longer exposes it on Point.CURVE, so pin it.
const N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const { bytesToNumberBE: big, numberToBytesBE, mod, hexToBytes, bytesToHex } = secp.etc;

function hex(b: Uint8Array): string {
  return "0x" + bytesToHex(b);
}
function unhex(h: string): Uint8Array {
  return hexToBytes(h.startsWith("0x") ? h.slice(2) : h);
}

/** address = last 20 bytes of keccak256(uncompressed pubkey w/o 0x04 prefix). Lowercased. */
function pointToAddress(pt: Pt): string {
  return hex(keccak_256(pt.toBytes(false).slice(1)).slice(12));
}

export function addressFromPrivateKey(priv: string): string {
  return pointToAddress(G.multiply(mod(big(unhex(priv)), N)));
}

export type MetaAddress = {
  spendPriv: string;
  spendPub: string; // P — published
  viewPriv: string;
  viewPub: string; // N — published
};

/** Recipient (the pot) generates this once and publishes spendPub + viewPub. */
export function generateMetaAddress(): MetaAddress {
  const spendPriv = secp.utils.randomSecretKey();
  const viewPriv = secp.utils.randomSecretKey();
  return {
    spendPriv: hex(spendPriv),
    spendPub: hex(secp.getPublicKey(spendPriv, true)),
    viewPriv: hex(viewPriv),
    viewPub: hex(secp.getPublicKey(viewPriv, true)),
  };
}

export type StealthPayment = {
  stealthAddress: string; // where the sender pays
  ephemeralPub: string; // R — announced so the recipient can find it
  viewTag: number; // first byte of the shared secret, for fast scanning
};

/** Sender: derive a one-time stealth address from the recipient's meta-address. */
export function generateStealthAddress(spendPub: string, viewPub: string): StealthPayment {
  const r = secp.utils.randomSecretKey();
  const R = secp.getPublicKey(r, true);
  const P = Point.fromBytes(unhex(spendPub));
  const Npub = Point.fromBytes(unhex(viewPub));
  const sh = keccak_256(Npub.multiply(big(r)).toBytes(true)); // hash of shared secret r·N
  const s = mod(big(sh), N);
  return { stealthAddress: pointToAddress(P.add(G.multiply(s))), ephemeralPub: hex(R), viewTag: sh[0] };
}

/** Recipient: scan one announcement. Returns the stealth address if it's ours, else null. */
export function scan(
  ephemeralPub: string,
  viewTag: number,
  viewPriv: string,
  spendPub: string,
): string | null {
  const R = Point.fromBytes(unhex(ephemeralPub));
  const sh = keccak_256(R.multiply(big(unhex(viewPriv))).toBytes(true)); // n·R == r·N
  if (sh[0] !== viewTag) return null; // fast reject
  const P = Point.fromBytes(unhex(spendPub));
  return pointToAddress(P.add(G.multiply(mod(big(sh), N))));
}

/** Recipient: the private key controlling a detected stealth address (to sweep). */
export function computeStealthPrivateKey(
  ephemeralPub: string,
  viewPriv: string,
  spendPriv: string,
): string {
  const R = Point.fromBytes(unhex(ephemeralPub));
  const sh = keccak_256(R.multiply(big(unhex(viewPriv))).toBytes(true));
  const stealthPriv = mod(big(unhex(spendPriv)) + mod(big(sh), N), N);
  return hex(numberToBytesBE(stealthPriv, 32));
}
