// Backend auto-sweep of stealth receives into the shared Universal Account.
//
// Private receive (lib/stealth) lands outside funds on fresh one-time addresses. Something must
// detect those and move them into the pot — a BACKEND automation, exactly Openfort's policy-driven
// backend wallet. Both halves are real here: detection (stealth scan + key derivation) AND the move
// — buildSweepAuthorization signs a real EIP-3009 transferWithAuthorization so a gasless relayer can
// broadcast it (the stealth address holds no ETH). Only that final broadcast needs a relayer.

import { Wallet, Interface, getAddress, hexlify, randomBytes } from "ethers";
import { scan, computeStealthPrivateKey } from "./stealth.ts";
import type { StealthPayment, MetaAddress } from "./stealth.ts";

export type Sweepable = { stealthAddress: string; privateKey: string };

const ERC20 = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);

// EIP-3009 — same authorization USDC accepts (and the x402 rail uses). Lets a stealth address with
// ZERO ETH be swept gaslessly: it signs, a relayer/Openfort backend broadcasts
// `transferWithAuthorization` and pays the gas. Real signature, no funds needed to produce it.
const EIP3009_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
};

/**
 * Turn a detected receive into a READY-TO-BROADCAST sweep: an ERC20 `transfer(ua, amount)` from
 * the stealth address into the pot's Universal Account, signed by the recovered stealth key.
 * Broadcast + gas are NOT here on purpose — the stealth address holds no ETH, so a sponsored
 * relayer / Openfort paymaster submits it. This is the piece that makes the pot's control
 * actionable (detection -> movable funds), without faking the gas story.
 */
export function buildSweepTransfer(
  s: Sweepable,
  ua: string,
  token: string,
  amount: bigint,
  chainId = 42161,
) {
  const wallet = new Wallet(s.privateKey);
  const data = ERC20.encodeFunctionData("transfer", [getAddress(ua), amount]);
  return {
    signer: wallet.address, // == s.stealthAddress; proves the recovered key controls the funds
    tx: { to: getAddress(token), data, value: 0n, chainId },
  };
}

/**
 * A REAL, gasless, broadcast-ready sweep: the recovered stealth key signs an EIP-3009
 * `transferWithAuthorization` moving `amount` USDC from the stealth address into the pot's UA. The
 * stealth address needs no ETH — a relayer broadcasts the returned authorization + signature and
 * pays gas. Signing is real crypto (ethers signTypedData); only the broadcast needs a relayer.
 * Deterministic when `opts.nonce`/`opts.now` are given (tests).
 */
export async function buildSweepAuthorization(
  s: Sweepable,
  ua: string,
  usdc: string,
  amount: bigint,
  chainId = 42161,
  opts: { now?: number; ttl?: number; nonce?: string } = {},
) {
  const wallet = new Wallet(s.privateKey);
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const authorization = {
    from: wallet.address, // == the stealth address
    to: getAddress(ua),
    value: amount.toString(),
    validAfter: String(now - 60),
    validBefore: String(now + (opts.ttl ?? 3600)),
    nonce: opts.nonce ?? hexlify(randomBytes(32)),
  };
  const domain = { name: "USD Coin", version: "2", chainId, verifyingContract: getAddress(usdc) };
  const signature = await wallet.signTypedData(domain, EIP3009_TYPES, {
    ...authorization,
    value: amount,
    validAfter: BigInt(authorization.validAfter),
    validBefore: BigInt(authorization.validBefore),
  });
  return { authorization, signature, domain }; // hand to a relayer → USDC.transferWithAuthorization
}

/** The pot only needs its private view/spend keys to detect and control its receives. */
export type PotKeys = Pick<MetaAddress, "viewPriv" | "spendPub" | "spendPriv">;

/**
 * From a batch of announcements, return the ones that belong to this pot — each with the
 * private key that controls it, ready for a backend wallet to sweep into the UA. Announcements
 * that aren't ours (or fail the derivation check) are skipped.
 */
export function findSweepable(announcements: StealthPayment[], pot: PotKeys): Sweepable[] {
  const out: Sweepable[] = [];
  for (const a of announcements) {
    const found = scan(a.ephemeralPub, a.viewTag, pot.viewPriv, pot.spendPub);
    if (found === a.stealthAddress) {
      out.push({
        stealthAddress: found,
        privateKey: computeStealthPrivateKey(a.ephemeralPub, pot.viewPriv, pot.spendPriv),
      });
    }
  }
  return out;
}
