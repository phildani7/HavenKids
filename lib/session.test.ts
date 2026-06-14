import { describe, it, expect, beforeAll } from "vitest";
import { signValue, verifySigned, signWithTs, verifyWithTs } from "./session";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-please-change";
});

describe("signValue / verifySigned", () => {
  it("round-trips a value", () => {
    const s = signValue("abc-123");
    expect(verifySigned(s)).toBe("abc-123");
  });
  it("rejects a tampered value", () => {
    const s = signValue("abc-123");
    const tampered = "xyz" + s.slice(3);
    expect(verifySigned(tampered)).toBeNull();
  });
  it("rejects garbage", () => {
    expect(verifySigned("not-a-cookie")).toBeNull();
  });
});

describe("signWithTs / verifyWithTs (TTL)", () => {
  it("accepts a fresh value within ttl", () => {
    const s = signWithTs("acct-1");
    expect(verifyWithTs(s, 60_000)).toBe("acct-1");
  });
  it("rejects an expired value", () => {
    const past = Date.now() - 120_000;
    const s = signWithTs("acct-1", past);
    expect(verifyWithTs(s, 60_000)).toBeNull();
  });
});
