"use client";

// Session hook: Magic login → Particle Universal Account.
// Falls back to "demo mode" when NEXT_PUBLIC_MAGIC_KEY is absent, so the app
// always runs for dev/judges without keys.

import { useEffect, useState } from "react";
import type { UniversalAccount } from "@particle-network/universal-account-sdk";
import { loginWithGoogle, loginWithEmail, logout as magicLogout, getRedirectResult } from "./magic";
import { createUniversalAccount } from "./universalAccount";

export const MAGIC_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_MAGIC_KEY);

export function useSession() {
  const [address, setAddress] = useState<string | null>(null);
  const [ua, setUa] = useState<UniversalAccount | null>(null);
  const [busy, setBusy] = useState(false);

  function connect(addr: string) {
    setAddress(addr);
    setUa(createUniversalAccount(addr));
  }

  // Restore a session / complete a Google redirect when the page loads.
  useEffect(() => {
    if (!MAGIC_CONFIGURED) return;
    getRedirectResult()
      .then((addr) => addr && connect(addr))
      .catch(() => {});
  }, []);

  async function google() {
    setBusy(true);
    try {
      await loginWithGoogle(); // redirects away; getRedirectResult() finishes on return
    } finally {
      setBusy(false);
    }
  }

  async function email(addr: string) {
    setBusy(true);
    try {
      connect(await loginWithEmail(addr));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await magicLogout();
    setAddress(null);
    setUa(null);
  }

  return { address, ua, busy, google, email, signOut };
}
