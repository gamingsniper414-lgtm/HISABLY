import test from "node:test";
import assert from "node:assert/strict";

import {
  parseRupeesToPaise,
  formatPaise,
} from "../utils/money.js";

test("converts rupees and paise to whole paise", () => {
  assert.equal(parseRupeesToPaise("12.50"), 1250);
  assert.equal(parseRupeesToPaise("12.5"), 1250);
  assert.equal(parseRupeesToPaise("12"), 1200);
  assert.equal(parseRupeesToPaise("0.01"), 1);
  assert.equal(parseRupeesToPaise(" 10.25 "), 1025);
});

test("accepts the maximum supported amount", () => {
  assert.equal(
    parseRupeesToPaise("10000000000.00"),
    1_000_000_000_000
  );
});

test("rejects zero, negative and over-limit amounts", () => {
  for (const value of ["0", "0.00", "-1", "10000000000.01"]) {
    assert.throws(() => parseRupeesToPaise(value));
  }
});

test("rejects invalid formats rather than rounding", () => {
  for (const value of ["", "1.234", "1.", ".5", "1,000", "₹10", "abc", "1e3"]) {
    assert.throws(() => parseRupeesToPaise(value));
  }
});

test("formats positive, zero and negative paise as INR", () => {
  assert.equal(formatPaise(1250), "₹12.50");
  assert.equal(formatPaise(0), "₹0.00");
  assert.equal(formatPaise(-1250), "-₹12.50");
});

test("returns a dash for invalid paise", () => {
  for (const value of [1.5, NaN, Infinity, "100"]) {
    assert.equal(formatPaise(value), "—");
  }
});