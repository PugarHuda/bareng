"use client";

// Session hook: Magic login → Particle Universal Account.
// Falls back to "demo mode" when NEXT_PUBLIC_MAGIC_KEY is absent, so the app
// always runs for dev/judges without keys.

import { useEffect, useState } from "react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { loginWithGoogle, loginWithEmail, logout as magicLogout, getRedirectResult } from "./magic";
import { createUniversalAccount } from "./universalAccount";

// Live mode needs BOTH Magic AND the three Particle keys — createUniversalAccount dereferences all
// of them. Gating on the Magic key alone would let a half-config (Magic set, Particle blank) skip
// the demo banner and build a UA from undefined config → silent breakage. Require all four.
export const MAGIC_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_MAGIC_KEY &&
    process.env.NEXT_PUBLIC_PARTICLE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_PARTICLE_CLIENT_KEY &&
    process.env.NEXT_PUBLIC_PARTICLE_APP_ID,
);

export function useSession() {
  const [address, setAddress] = useState<string | null>(null);
  const [ua, setUa] = useState<UniversalAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function connect(addr: string) {
    setAddress(addr);
    setUa(createUniversalAccount(addr));
  }

  // Restore a session / complete a Google redirect when the page loads.
  useEffect(() => {
    if (!MAGIC_CONFIGURED) return;
    getRedirectResult()
      .then((addr) => addr && connect(addr))
      .catch((e) => setError(`Login could not complete: ${(e as Error).message}`));
  }, []);

  async function google() {
    setBusy(true);
    setError(null);
    try {
      await loginWithGoogle(); // redirects away; getRedirectResult() finishes on return
    } catch (e) {
      setError(`Google login failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function email(addr: string) {
    setBusy(true);
    setError(null);
    try {
      connect(await loginWithEmail(addr));
    } catch (e) {
      setError(`Email login failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    try {
      await magicLogout();
    } catch {
      /* ignore — clear local state regardless */
    }
    setAddress(null);
    setUa(null);
  }

  return { address, ua, busy, error, google, email, signOut };
}
