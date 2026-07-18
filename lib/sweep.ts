// Backend auto-sweep of stealth receives into the shared Universal Account.
//
// Private receive (lib/stealth) lands outside funds on fresh one-time addresses. Something
// must detect those and move them into the pot — a BACKEND automation, exactly Openfort's
// policy-driven backend wallet (gated behind NEXT_PUBLIC_OPENFORT_FACILITATOR). The detection
// here is ours (reuses stealth scan + key derivation) and is tested; the send-into-UA is the
// backend wallet's job. Completes the "stealth sweep" to-do while claiming the Openfort angle.

import { Wallet, Interface, getAddress } from "ethers";
import { scan, computeStealthPrivateKey } from "./stealth.ts";
import type { StealthPayment, MetaAddress } from "./stealth.ts";

export type Sweepable = { stealthAddress: string; privateKey: string };

const ERC20 = new Interface(["function transfer(address to, uint256 amount) returns (bool)"]);

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
