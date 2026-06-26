// Run: npm test
import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeHandle,
  isValidHandle,
  claimHandle,
  resolveHandle,
  handleFor,
  potLink,
  parsePotLink,
} from "../lib/handles.ts";

test("normalize strips @ and lowercases", () => {
  assert.equal(normalizeHandle("  @Budi "), "budi");
});

test("validation: format rules", () => {
  assert.equal(isValidHandle("budi"), true);
  assert.equal(isValidHandle("@lunch_squad99"), true);
  assert.equal(isValidHandle("ab"), false); // too short
  assert.equal(isValidHandle("has space"), false);
  assert.equal(isValidHandle("UPPER"), true); // normalized to lower first
});

test("claim then resolve, both directions", () => {
  claimHandle("budi", "0xBUDI");
  assert.equal(resolveHandle("@Budi"), "0xBUDI");
  assert.equal(handleFor("0xbudi"), "budi"); // case-insensitive address
});

test("re-claim by same owner is idempotent; by another throws", () => {
  claimHandle("sari", "0xSARI");
  assert.doesNotThrow(() => claimHandle("sari", "0xSARI"));
  assert.throws(() => claimHandle("sari", "0xSOMEONE_ELSE"));
});

test("invalid handle claim throws", () => {
  assert.throws(() => claimHandle("x", "0xZ"));
});

test("pot link round-trips", () => {
  const link = potLink("@LunchSquad", "https://bareng.me");
  assert.equal(link, "https://bareng.me/?pot=lunchsquad");
  assert.equal(parsePotLink(link), "lunchsquad");
  assert.equal(parsePotLink("https://bareng.me/"), null);
});
