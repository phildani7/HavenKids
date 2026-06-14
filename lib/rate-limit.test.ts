import { describe, it, expect } from "vitest";
import { allow, recordFailure, isLocked, resetFailures } from "./rate-limit";

describe("allow (fixed window)", () => {
  it("permits up to the limit then blocks", () => {
    const key = "k1";
    for (let i = 0; i < 3; i++) expect(allow(key, 3, 10_000)).toBe(true);
    expect(allow(key, 3, 10_000)).toBe(false);
  });
});

describe("PIN throttle", () => {
  it("locks after 5 failures and resets on success", () => {
    const key = "p1";
    resetFailures(key);
    for (let i = 0; i < 5; i++) recordFailure(key, 5, 60_000);
    expect(isLocked(key)).toBe(true);
    resetFailures(key);
    expect(isLocked(key)).toBe(false);
  });
});
