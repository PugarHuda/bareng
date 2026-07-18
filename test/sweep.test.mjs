// Run: npm test  (node --test). Proves backend sweep detection: the pot finds exactly its
// own stealth receives and recovers the controlling key; a stranger's payment is ignored.
import assert from "node:assert/strict";
import test from "node:test";
import { generateMetaAddress, generateStealthAddress, addressFromPrivateKey } from "../lib/stealth.ts";
import { findSweepable, buildSweepTransfer } from "../lib/sweep.ts";
import { Interface, getAddress } from "ethers";

test("finds only the pot's receives, each with the controlling key", () => {
  const pot = generateMetaAddress();
  const other = generateMetaAddress();

  const mine1 = generateStealthAddress(pot.spendPub, pot.viewPub);
  const mine2 = generateStealthAddress(pot.spendPub, pot.viewPub);
  const notMine = generateStealthAddress(other.spendPub, other.viewPub);

  const sweepable = findSweepable([mine1, notMine, mine2], pot);

  const got = sweepable.map((s) => s.stealthAddress).sort();
  assert.deepEqual(got, [mine1.stealthAddress, mine2.stealthAddress].sort());
  assert.equal(sweepable.some((s) => s.stealthAddress === notMine.stealthAddress), false);

  // The recovered key actually controls each swept address.
  for (const s of sweepable) {
    assert.equal(addressFromPrivateKey(s.privateKey), s.stealthAddress);
  }
});

test("empty batch → nothing to sweep", () => {
  const pot = generateMetaAddress();
  assert.deepEqual(findSweepable([], pot), []);
});

test("buildSweepTransfer signs a transfer INTO the UA from the controlling key", () => {
  const pot = generateMetaAddress();
  const [s] = findSweepable([generateStealthAddress(pot.spendPub, pot.viewPub)], pot);
  const UA = "0x14eB5B6A11C6Dd3e5f5a1AeeB126ab3a2fe0a22c";
  const USDC = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";

  const { signer, tx } = buildSweepTransfer(s, UA, USDC, 5_000000n);

  // The tx is sent from the stealth address the pot controls...
  assert.equal(signer.toLowerCase(), s.stealthAddress.toLowerCase());
  // ...and it's an ERC20 transfer of the funds INTO the UA.
  assert.equal(tx.to, getAddress(USDC));
  const erc20 = new Interface(["function transfer(address to, uint256 amount)"]);
  const decoded = erc20.decodeFunctionData("transfer", tx.data);
  assert.equal(decoded[0], getAddress(UA));
  assert.equal(decoded[1], 5_000000n);
});
