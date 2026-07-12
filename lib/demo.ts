// DEMO-ONLY. A well-known PUBLIC test key used to sign per-member grants when no real owner
// (Magic) is present, so the app runs fully keyless for judges/dev.
//
// This is NOT a secret and proves nothing on its own — anyone can forge these signatures. It
// exists purely so the grant flow is exercisable offline. In live mode the grant is signed by
// the actual Magic owner EOA (see app/admin/page.tsx `ownerSigner`). One place, clearly labeled,
// so the fake key isn't scattered.

import { Wallet } from "ethers";

// Anvil/hardhat account #0 — intentionally well-known, never use with real funds.
export const DEMO_OWNER = new Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
