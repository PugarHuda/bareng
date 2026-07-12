// Magic embedded wallet — social/email login → an EOA we hand to Universal Accounts.
// Targets the Magic Labs bonus ($500): seedless onboarding that feels Web2.
"use client";

import { Magic } from "magic-sdk";
import { OAuthExtension } from "@magic-ext/oauth2";
import { BrowserProvider, getBytes } from "ethers";

let _magic: Magic<[OAuthExtension]> | null = null;

/** Lazy singleton — Magic must only init in the browser. */
export function getMagic(): Magic<[OAuthExtension]> {
  if (typeof window === "undefined") {
    throw new Error("getMagic() is browser-only");
  }
  if (!_magic) {
    _magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_KEY!, {
      // ponytail: default network is Ethereum; point it at Arbitrum so the
      // signer/EOA lines up with where we settle. Verify chainId at office hours.
      network: { rpcUrl: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
      extensions: [new OAuthExtension()],
    });
  }
  return _magic;
}

// ponytail: rpcProvider is Magic's EIP-1193 provider; ethers wraps it. We read
// the EOA from the provider instead of getInfo() — v33 moved the address into a
// multi-chain `wallets` map, but the signer address is stable across versions.
function magicProvider(): BrowserProvider {
  return new BrowserProvider(getMagic().rpcProvider as never);
}

async function eoaAddress(): Promise<string> {
  return (await magicProvider().getSigner()).getAddress();
}

/** Google login. Redirects away; getRedirectResult() finishes the flow on return. */
export async function loginWithGoogle(): Promise<void> {
  await getMagic().oauth2.loginWithRedirect({
    provider: "google",
    redirectURI: window.location.origin,
  });
}

/** Email OTP login. Returns the user's EOA address (the UA owner). */
export async function loginWithEmail(email: string): Promise<string> {
  await getMagic().auth.loginWithEmailOTP({ email });
  return eoaAddress();
}

export async function logout(): Promise<void> {
  await getMagic().user.logout();
}

/** Complete a pending Google redirect (or restore an existing session). Returns the EOA or null. */
export async function getRedirectResult(): Promise<string | null> {
  const magic = getMagic();
  try {
    await magic.oauth2.getRedirectResult(); // completes login when returning from Google
  } catch {
    // no pending oauth redirect — fall through to the session check
  }
  return (await magic.user.isLoggedIn()) ? eoaAddress() : null;
}

/** Sign the Universal Account transaction rootHash with the Magic-backed EOA. */
export async function signRootHash(rootHash: string): Promise<string> {
  const signer = await magicProvider().getSigner();
  return signer.signMessage(getBytes(rootHash));
}

/** Sign an EIP-712 typed payload (the 7702 session-key SpendPermission) with the owner EOA. */
export async function signTypedData(domain: object, types: object, value: object): Promise<string> {
  const signer = await magicProvider().getSigner();
  return signer.signTypedData(domain as never, types as never, value as never);
}
