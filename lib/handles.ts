// Username handles — pay/join by @handle instead of a raw 0x address (PIVY-style UX).
// This gives the "no wallet doxxing" feel without any stealth-address crypto: you
// share @lunchsquad, not 0x1234…  In-memory registry for the demo.
// ponytail: in-memory = demo ceiling. Upgrade path = an onchain ENS-style registry
// or a small KV backend, so handles survive refresh and are globally unique.

const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

const byHandle = new Map<string, string>(); // handle -> address
const byAddress = new Map<string, string>(); // address(lowercased) -> handle

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
