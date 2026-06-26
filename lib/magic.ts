// Magic embedded wallet — social/email login → an EOA we hand to Universal Accounts.
// Targets the Magic Labs bonus ($500): seedless onboarding that feels Web2.
"use client";

import { Magic } from "magic-sdk";
import { BrowserProvider, getBytes } from "ethers";

let _magic: Magic | null = null;

/** Lazy singleton — Magic must only init in the browser. */
export function getMagic(): Magic {
  if (typeof window === "undefined") {
    throw new Error("getMagic() is browser-only");
  }
  if (!_magic) {
    _magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_KEY!, {
      // ponytail: default network is Ethereum; point it at Arbitrum so the
      // signer/EOA lines up with where we settle. Verify chainId at office hours.
      network: { rpcUrl: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
    });
  }
  return _magic;
}

/** Google/email login. Returns the user's EOA address (the UA owner). */
export async function loginWithGoogle(): Promise<string> {
  const magic = getMagic();
  await magic.oauth2.loginWithRedirect({ provider: "google", redirectURI: window.location.origin });
  const info = await magic.user.getInfo();
  return info.publicAddress!;
}

/** Email OTP login fallback. */
export async function loginWithEmail(email: string): Promise<string> {
  const magic = getMagic();
  await magic.auth.loginWithEmailOTP({ email });
  const info = await magic.user.getInfo();
  return info.publicAddress!;
}

export async function logout(): Promise<void> {
  await getMagic().user.logout();
}

/** Complete a pending Google redirect (or restore an existing session). Returns the EOA or null. */
export async function getRedirectResult(): Promise<string | null> {
  const magic = getMagic();
  try {
    const res = await magic.oauth2.getRedirectResult();
    const addr = res?.magic?.userMetadata?.publicAddress;
    if (addr) return addr;
  } catch {
    // no pending oauth redirect — fall through to session check
  }
  if (await magic.user.isLoggedIn()) {
    return (await magic.user.getInfo()).publicAddress ?? null;
  }
  return null;
}

/** Sign the Universal Account transaction rootHash with the Magic-backed EOA. */
export async function signRootHash(rootHash: string): Promise<string> {
  // ponytail: rpcProvider is Magic's EIP-1193 provider; ethers wraps it to sign.
  const provider = new BrowserProvider(getMagic().rpcProvider as never);
  const signer = await provider.getSigner();
  return signer.signMessage(getBytes(rootHash));
}
