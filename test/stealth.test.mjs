// Run: npm test  (needs `npm install` for @noble libs)
import assert from "node:assert/strict";
import test from "node:test";
import {
  generateMetaAddress,
  generateStealthAddress,
  scan,
  computeStealthPrivateKey,
  addressFromPrivateKey,
} from "../lib/stealth.ts";

test("round trip: sender derives, recipient detects the same address", () => {
  const pot = generateMetaAddress();
  const pay = generateStealthAddress(pot.spendPub, pot.viewPub);
  const found = scan(pay.ephemeralPub, pay.viewTag, pot.viewPriv, pot.spendPub);
  assert.equal(found, pay.stealthAddress);
});

test("recipient recovers the private key that controls the stealth address", () => {
  const pot = generateMetaAddress();
  const pay = generateStealthAddress(pot.spendPub, pot.viewPub);
  const priv = computeStealthPrivateKey(pay.ephemeralPub, pot.viewPriv, pot.spendPriv);
  assert.equal(addressFromPrivateKey(priv), pay.stealthAddress);
});

test("a different recipient cannot derive the same address", () => {
  const pot = generateMetaAddress();
  const stranger = generateMetaAddress();
  const pay = generateStealthAddress(pot.spendPub, pot.viewPub);
  const found = scan(pay.ephemeralPub, pay.viewTag, stranger.viewPriv, stranger.spendPub);
  assert.notEqual(found, pay.stealthAddress); // null, or a different (useless) address
});

test("two payments to the same pot produce unlinkable addresses", () => {
  const pot = generateMetaAddress();
  const a = generateStealthAddress(pot.spendPub, pot.viewPub);
  const b = generateStealthAddress(pot.spendPub, pot.viewPub);
  assert.notEqual(a.stealthAddress, b.stealthAddress);
});
