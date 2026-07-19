// Verifiable fair draw — the trustless upgrade to Arisan's rotation. Instead of a fixed order
// (whoever's listed first collects first), derive the order from a PUBLIC seed anyone can check:
// a future Arbitrum block hash, or a commit-reveal nonce the circle agrees on. Same seed →
// same order, so every member can recompute it and prove nobody rigged who collects the pot first.
//
// Pure keccak-seeded Fisher–Yates. No SDK/network. Tested (test/draw.test.mjs).
//
// SECURITY — the fairness rests ENTIRELY on the seed being unpredictable at the moment the circle
// commits. drawOrder is a cheap offline hash, so a member who gets to CHOOSE the seed can grind it
// (~n tries) to land themselves in position 0. Use a seed nobody can pick to their advantage: a
// FUTURE Arbitrum block hash the circle agrees on in advance, or a commit-reveal nonce. Never a
// caller-chosen string in production.

import { keccak256, toUtf8Bytes } from "ethers";

/**
 * Deterministic shuffle of `members` seeded by `seed`. Fisher–Yates where each swap index is
 * keccak256(seed || ":" || i) mod (i+1) — a fresh hash per step so the whole permutation is
 * pinned by the seed. Recompute with the same seed to verify the draw was fair.
 */
export function drawOrder(members: string[], seed: string): string[] {
  if (!seed) throw new Error("Draw: seed required (use a block hash or agreed nonce)");
  const out = [...members];
  for (let i = out.length - 1; i > 0; i--) {
    const h = keccak256(toUtf8Bytes(`${seed}:${i}`));
    const j = Number(BigInt(h) % BigInt(i + 1)); // bias is negligible for real roster sizes
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Re-derive the order from the seed and check it matches a claimed order — one call for a member
 *  to audit that the posted rotation really came from the posted seed. */
export function verifyDraw(members: string[], seed: string, claimedOrder: string[]): boolean {
  const fair = drawOrder(members, seed);
  return fair.length === claimedOrder.length && fair.every((m, k) => m === claimedOrder[k]);
}
