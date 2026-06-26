// Stealth addresses (ERC-5564 scheme on secp256k1).
//
// Used for PRIVATE money movement that the shared Universal Account shouldn't
// expose publicly:
//   • Receiving from OUTSIDE the pot — an external payer sends to a fresh
//     one-time address derived from the pot's published meta-address, so the
//     pot's UA isn't linkable on-chain.
//   • Paying OUT to a member's personal address without doxxing it.
//
// Real cryptography via audited @noble libs — no hand-rolled curve math.
// The on-chain leg (announce + sweep) reuses the same Universal Accounts flow as
// the rest of the app; the derivation below is fully functional and tested.

import * as secp from "@noble/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";

const G = secp.ProjectivePoint.BASE;
const N = secp.CURVE.n;

function bytesToBig(b: Uint8Array): bigint {
  let x = 0n;
  for (const byte of b) x = (x << 8n) | BigInt(byte);
  return x;
}
function bigToBytes32(x: bigint): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  return out;
}
function toHex(b: Uint8Array): string {
  return "0x" + Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(h: string): Uint8Array {
  const s = h.startsWith("0x") ? h.slice(2) : h;
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** address = last 20 bytes of keccak256(uncompressed pubkey w/o 0x04 prefix). Lowercased. */
function pointToAddress(point: InstanceType<typeof secp.ProjectivePoint>): string {
  const hash = keccak_256(point.toRawBytes(false).slice(1));
  return toHex(hash.slice(12));
}

export function addressFromPrivateKey(priv: string): string {
  return pointToAddress(G.multiply(bytesToBig(hexToBytes(priv))));
}

export type MetaAddress = {
  spendPriv: string;
  spendPub: string; // P — published
  viewPriv: string;
  viewPub: string; // N — published
};

/** Recipient (the pot) generates this once and publishes spendPub + viewPub. */
export function generateMetaAddress(): MetaAddress {
  const spendPriv = secp.utils.randomPrivateKey();
  const viewPriv = secp.utils.randomPrivateKey();
  return {
    spendPriv: toHex(spendPriv),
    spendPub: toHex(secp.getPublicKey(spendPriv, true)),
    viewPriv: toHex(viewPriv),
    viewPub: toHex(secp.getPublicKey(viewPriv, true)),
  };
}

export type StealthPayment = {
  stealthAddress: string; // where the sender pays
  ephemeralPub: string; // R — announced so the recipient can find it
  viewTag: number; // first byte of the shared secret, for fast scanning
};

/** Sender: derive a one-time stealth address from the recipient's meta-address. */
export function generateStealthAddress(spendPub: string, viewPub: string): StealthPayment {
  const r = secp.utils.randomPrivateKey();
  const R = secp.getPublicKey(r, true);
  const P = secp.ProjectivePoint.fromHex(spendPub.slice(2));
  const Npub = secp.ProjectivePoint.fromHex(viewPub.slice(2));
  const S = Npub.multiply(bytesToBig(r)); // shared secret point = r·N
  const sh = keccak_256(S.toRawBytes(true));
  const sScalar = bytesToBig(sh) % N;
  const stealthPub = P.add(G.multiply(sScalar)); // P + s·G
  return { stealthAddress: pointToAddress(stealthPub), ephemeralPub: toHex(R), viewTag: sh[0] };
}

/** Recipient: scan one announcement. Returns the stealth address if it's ours, else null. */
export function scan(
  ephemeralPub: string,
  viewTag: number,
  viewPriv: string,
  spendPub: string,
): string | null {
  const R = secp.ProjectivePoint.fromHex(ephemeralPub.slice(2));
  const S = R.multiply(bytesToBig(hexToBytes(viewPriv))); // n·R == r·N
  const sh = keccak_256(S.toRawBytes(true));
  if (sh[0] !== viewTag) return null; // fast reject
  const sScalar = bytesToBig(sh) % N;
  const P = secp.ProjectivePoint.fromHex(spendPub.slice(2));
  return pointToAddress(P.add(G.multiply(sScalar)));
}

/** Recipient: the private key controlling a detected stealth address (to sweep). */
export function computeStealthPrivateKey(
  ephemeralPub: string,
  viewPriv: string,
  spendPriv: string,
): string {
  const R = secp.ProjectivePoint.fromHex(ephemeralPub.slice(2));
  const S = R.multiply(bytesToBig(hexToBytes(viewPriv)));
  const sh = keccak_256(S.toRawBytes(true));
  const sScalar = bytesToBig(sh) % N;
  const stealthPriv = (bytesToBig(hexToBytes(spendPriv)) + sScalar) % N;
  return toHex(bigToBytes32(stealthPriv));
}
