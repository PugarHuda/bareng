// x402 (HTTP-402) agent payments, guarded by the on-chain 7702 spend cap.
//
// The pitch: give an autonomous agent a 7702-capped key and it can pay per-request for a
// service via x402 while being bounded by a spend cap — it can't drain the pot. The cap guard
// (chargeWithinCap) is ours and tested; it mirrors the SHAPE of a 7702 policy.
//
// SCOPE (see docs/ARCHITECTURE.md): the protocol is implemented for real — the `pay` step signs a
// real EIP-3009 authorization (lib/x402pay) and /api/x402 verifies it server-side (full 402→pay→200
// handshake, tested). The ONLY unwired piece is the final on-chain broadcast of that signed
// `transferWithAuthorization` (needs the payer to hold USDC + a facilitator/relayer). The on-chain
// cap via ZeroDev (lib/zerodev.ts) is standalone, NOT composed with the Particle UA. Schema = x402
// v1 PaymentRequirements (x402 Foundation).

import { canSpend, type Member } from "./limits.ts";

export const OPENFORT_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_OPENFORT_FACILITATOR);

const USDC_DECIMALS = 1_000_000; // 6dp

/** One accepted way to pay, from a 402 response's `accepts` list. */
export type PaymentRequirement = {
  scheme: string; // "exact"
  network: string; // e.g. "arbitrum"
  maxAmountRequired: string; // atomic token units (USDC = 6dp), as a string
  asset: string; // token contract
  payTo: string; // recipient
  resource: string; // the paid URL
  description?: string;
  maxTimeoutSeconds?: number;
};

export type PaymentRequired = { x402Version: number; accepts: PaymentRequirement[]; error?: string };

/** Parse a response body that came with HTTP 402. Throws if it isn't a well-formed 402. */
export function parsePaymentRequired(status: number, body: unknown): PaymentRequirement[] {
  if (status !== 402) throw new Error(`x402: expected 402, got ${status}`);
  const b = body as PaymentRequired;
  if (!b || !Array.isArray(b.accepts) || b.accepts.length === 0) {
    throw new Error("x402: malformed 402 response — no `accepts`");
  }
  return b.accepts;
}

/** Charge in whole token units (e.g. USDC dollars) for a requirement. */
export function chargeAmount(req: PaymentRequirement): number {
  return Number(req.maxAmountRequired) / USDC_DECIMALS;
}

/** Pick the requirement matching our token + network, or null if none is payable by us. */
export function selectRequirement(
  reqs: PaymentRequirement[],
  want: { asset: string; network: string },
): PaymentRequirement | null {
  return (
    reqs.find(
      (r) =>
        r.asset.toLowerCase() === want.asset.toLowerCase() &&
        r.network.toLowerCase() === want.network.toLowerCase(),
    ) ?? null
  );
}

/**
 * THE GUARDRAIL. Would paying this x402 charge stay within the member's 7702 cap? Same
 * canSpend() the on-chain policy mirrors — the agent can never spend past it.
 */
export function chargeWithinCap(req: PaymentRequirement, member: Member, now: number): boolean {
  return canSpend(member, chargeAmount(req), now);
}

/** Minimal fetch shape we need — real fetch satisfies it; tests pass a fake. */
export type FetchLike = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<{ status: number; json: () => Promise<unknown> }>;

/**
 * Agent flow: GET the resource; on 402, if the charge fits the member's cap, settle via the
 * capped session key (`pay` → the X-PAYMENT header value, Openfort facilitator) and retry.
 * If the charge EXCEEDS the cap it throws WITHOUT paying — the agent is bounded, not trusted.
 */
export async function payAndRetry(
  fetchLike: FetchLike,
  url: string,
  member: Member,
  want: { asset: string; network: string },
  now: number,
  pay: (req: PaymentRequirement) => Promise<string>,
): Promise<{ status: number; paid: boolean; charge: number; body?: unknown }> {
  const first = await fetchLike(url);
  if (first.status !== 402) return { status: first.status, paid: false, charge: 0 };

  const req = selectRequirement(parsePaymentRequired(first.status, await first.json()), want);
  if (!req) throw new Error("x402: no requirement we can pay (token/network mismatch)");

  const charge = chargeAmount(req);
  if (!chargeWithinCap(req, member, now)) {
    throw new Error(`x402: $${charge} exceeds ${member.name}'s cap — refused, not paid`);
  }
  const header = await pay(req);
  const retried = await fetchLike(url, { headers: { "X-PAYMENT": header } });
  const body = await retried.json().catch(() => undefined);
  return { status: retried.status, paid: true, charge, body };
}
