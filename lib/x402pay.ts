// The REAL x402 "exact" scheme payload — an EIP-3009 `transferWithAuthorization` signed with EIP-712.
// This is what an x402 client actually sends in the `X-PAYMENT` header and what a facilitator
// verifies. Signing and verifying are real cryptography and need NO funds; on-chain settlement is a
// facilitator broadcasting this exact signed authorization (`transferWithAuthorization`) to USDC —
// so the authorization here is settlement-ready, not a stub. USDC (Circle) supports EIP-3009 on
// every chain we target.
//
// Header wire format (x402 v1): base64( JSON({ x402Version, scheme:"exact", network, payload:{
//   signature, authorization:{ from, to, value, validAfter, validBefore, nonce } } }) ).

import { recoverTypedDataAddress, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PaymentRequirement } from "./x402.ts";

export const NETWORK_CHAIN_ID: Record<string, number> = { arbitrum: 42161, base: 8453, optimism: 10 };

// EIP-3009 authorization. Values are strings on the wire; bigint for signing/verifying.
export type Authorization = {
  from: Address;
  to: Address;
  value: string; // atomic USDC (6dp)
  validAfter: string; // unix seconds
  validBefore: string; // unix seconds
  nonce: Hex; // bytes32
};

export type PaymentPayload = {
  x402Version: number;
  scheme: string;
  network: string;
  payload: { signature: Hex; authorization: Authorization };
};

const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

// USDC's EIP-712 domain. Name/version can be overridden via the requirement's `extra` (x402 carries
// them there); Circle USDC is "USD Coin" / "2" on our chains.
function domainFor(req: PaymentRequirement, extra?: { name?: string; version?: string }) {
  const chainId = NETWORK_CHAIN_ID[req.network.toLowerCase()];
  if (!chainId) throw new Error(`x402: unknown network "${req.network}"`);
  return {
    name: extra?.name ?? "USD Coin",
    version: extra?.version ?? "2",
    chainId,
    verifyingContract: req.asset as Address,
  } as const;
}

const toMessage = (a: Authorization) => ({
  from: a.from,
  to: a.to,
  value: BigInt(a.value),
  validAfter: BigInt(a.validAfter),
  validBefore: BigInt(a.validBefore),
  nonce: a.nonce,
});

const randomNonce = (): Hex => {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return `0x${Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")}`;
};

const b64 = {
  encode: (s: string) => (typeof btoa !== "undefined" ? btoa(s) : Buffer.from(s, "utf8").toString("base64")),
  decode: (s: string) => (typeof atob !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("utf8")),
};

/**
 * Sign an x402 payment: build the EIP-3009 authorization for `req` and sign it with `privateKey`
 * (the agent's 7702-capped session key). Returns the base64 `X-PAYMENT` header value + the payload.
 * Deterministic when `opts.nonce`/`opts.now` are supplied (tests); random/now otherwise.
 */
export async function signPayment(
  req: PaymentRequirement,
  privateKey: Hex,
  opts: { now?: number; ttl?: number; nonce?: Hex; extra?: { name?: string; version?: string } } = {},
): Promise<{ header: string; payload: PaymentPayload }> {
  const account = privateKeyToAccount(privateKey);
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const authorization: Authorization = {
    from: account.address,
    to: req.payTo as Address,
    value: req.maxAmountRequired, // pay exactly the required amount
    validAfter: String(now - 60), // small backdate for clock skew
    validBefore: String(now + (opts.ttl ?? req.maxTimeoutSeconds ?? 600)),
    nonce: opts.nonce ?? randomNonce(),
  };
  const signature = await account.signTypedData({
    domain: domainFor(req, opts.extra),
    types: EIP3009_TYPES,
    primaryType: "TransferWithAuthorization",
    message: toMessage(authorization),
  });
  const payload: PaymentPayload = { x402Version: 1, scheme: "exact", network: req.network, payload: { signature, authorization } };
  return { header: b64.encode(JSON.stringify(payload)), payload };
}

/**
 * Facilitator-side verification of an `X-PAYMENT` header against a requirement. Recovers the EIP-712
 * signer and checks it authorized THIS payment (recipient, at-least amount, still valid). Returns the
 * payer on success. This is the real x402 verify step; a facilitator then broadcasts the same
 * `transferWithAuthorization` to settle on-chain.
 */
export async function verifyPayment(
  header: string,
  req: PaymentRequirement,
  opts: { now?: number; extra?: { name?: string; version?: string } } = {},
): Promise<{ valid: boolean; from?: Address; reason?: string }> {
  let p: PaymentPayload;
  try {
    p = JSON.parse(b64.decode(header));
  } catch {
    return { valid: false, reason: "malformed X-PAYMENT header" };
  }
  if (p.scheme !== "exact") return { valid: false, reason: `unsupported scheme "${p.scheme}"` };
  if (p.network?.toLowerCase() !== req.network.toLowerCase()) return { valid: false, reason: "network mismatch" };

  const a = p.payload?.authorization;
  const sig = p.payload?.signature;
  if (!a || !sig) return { valid: false, reason: "missing authorization/signature" };
  if (a.to?.toLowerCase() !== req.payTo.toLowerCase()) return { valid: false, reason: "wrong payTo" };
  if (BigInt(a.value) < BigInt(req.maxAmountRequired)) return { valid: false, reason: "underpaid" };

  const now = opts.now ?? Math.floor(Date.now() / 1000);
  if (now < Number(a.validAfter)) return { valid: false, reason: "not yet valid" };
  if (now > Number(a.validBefore)) return { valid: false, reason: "authorization expired" };

  let recovered: Address;
  try {
    recovered = await recoverTypedDataAddress({
      domain: domainFor(req, opts.extra),
      types: EIP3009_TYPES,
      primaryType: "TransferWithAuthorization",
      message: toMessage(a),
      signature: sig,
    });
  } catch (e) {
    return { valid: false, reason: `bad signature: ${(e as Error).message}` };
  }
  if (recovered.toLowerCase() !== a.from.toLowerCase()) return { valid: false, reason: "signature does not match `from`" };
  return { valid: true, from: recovered };
}
