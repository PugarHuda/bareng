// Username handles — pay/join by @handle instead of a raw 0x address (PIVY-style UX).
// This gives the "no wallet doxxing" feel without any stealth-address crypto: you
// share @lunchsquad, not 0x1234…  Backed by localStorage in the browser so claims
// survive refresh; a plain Map on the server (SSR) or in tests.
// ponytail: localStorage = per-device. Upgrade path = an onchain ENS-style registry
// or a small KV backend for global uniqueness across devices.

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

const byHandle = new Map<string, string>(); // handle -> address
const byAddress = new Map<string, string>(); // address(lowercased) -> handle

const LS_KEY = "bareng.handles";

// Restore prior claims once, on first import in the browser.
(function hydrate() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return;
    for (const [h, a] of JSON.parse(raw) as [string, string][]) {
      byHandle.set(h, a);
      byAddress.set(a.toLowerCase(), h);
    }
  } catch {
    /* corrupt/absent storage — start empty */
  }
})();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify([...byHandle]));
  } catch {
    /* storage full/blocked — the in-memory Map still works this session */
  }
}

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

export function isValidHandle(input: string): boolean {
  return HANDLE_RE.test(normalizeHandle(input));
}

/** Claim a handle for an address. Idempotent for the same owner; throws if taken by another. */
export function claimHandle(input: string, address: string): string {
  const h = normalizeHandle(input);
  if (!HANDLE_RE.test(h)) throw new Error(`Bareng: invalid handle "${input}" (3-20 chars, a-z 0-9 _)`);
  const owner = byHandle.get(h);
  if (owner && owner.toLowerCase() !== address.toLowerCase()) {
    throw new Error(`Bareng: @${h} is already taken`);
  }
  byHandle.set(h, address);
  byAddress.set(address.toLowerCase(), h);
  persist();
  return h;
}

/** @handle -> address, or null if unknown. */
export function resolveHandle(input: string): string | null {
  return byHandle.get(normalizeHandle(input)) ?? null;
}

/** address -> handle, or null if none claimed. */
export function handleFor(address: string): string | null {
  return byAddress.get(address.toLowerCase()) ?? null;
}

/** Shareable link to fund or join a pot — drop it in a group chat. */
export function potLink(potHandle: string, origin: string): string {
  return `${origin}/?pot=${normalizeHandle(potHandle)}`;
}

/** Pull the pot handle back out of a shared link, or null if absent/invalid. */
export function parsePotLink(url: string): string | null {
  try {
    const h = new URL(url).searchParams.get("pot");
    return h && isValidHandle(h) ? normalizeHandle(h) : null;
  } catch {
    return null;
  }
}
