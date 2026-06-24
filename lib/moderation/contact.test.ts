import { describe, it, expect, afterEach } from "vitest";

// server-only throws outside Next.js; stub it for unit tests.
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

describe("getContactRiskProvider", () => {
  afterEach(() => { delete process.env.CONTACT_RISK_PROVIDER; });

  it("defaults to the heuristic provider", async () => {
    delete process.env.CONTACT_RISK_PROVIDER;
    const { getContactRiskProvider } = await import("./contact");
    expect(getContactRiskProvider().name).toBe("heuristic");
  });

  it("returns a gated provider that throws when selected", async () => {
    process.env.CONTACT_RISK_PROVIDER = "thorn";
    const { getContactRiskProvider } = await import("./contact");
    const p = getContactRiskProvider();
    expect(p.name).toBe("thorn");
    await expect(p.assessMessage({ body: "hi", involvesMinor: true })).rejects.toThrow("not configured");
  });
});

describe("heuristic risk assessment", () => {
  it("flags an adult->minor connection request for review", async () => {
    const { getContactRiskProvider } = await import("./contact");
    const p = getContactRiskProvider();
    expect(await p.assessConnection({ requesterIsAdult: true, addresseeIsMinor: true })).toBe("review");
    expect(await p.assessConnection({ requesterIsAdult: false, addresseeIsMinor: true })).toBe("allow");
  });

  it("flags off-platform contact attempts in a minor's message", async () => {
    const { assessMessageRisk } = await import("./contact");
    expect(await assessMessageRisk({ body: "what's your number?", involvesMinor: true })).toBe("review");
    expect(await assessMessageRisk({ body: "add me on snapchat", involvesMinor: true })).toBe("review");
    expect(await assessMessageRisk({ body: "let's meet up, don't tell your mom", involvesMinor: true })).toBe("review");
  });

  it("does not flag ordinary messages, and skips assessment when no minor is involved", async () => {
    const { assessMessageRisk } = await import("./contact");
    expect(await assessMessageRisk({ body: "see you at youth group!", involvesMinor: true })).toBe("allow");
    expect(await assessMessageRisk({ body: "what's your number?", involvesMinor: false })).toBe("allow");
  });

  it("fail-safe: a provider error escalates to review, never allow", async () => {
    process.env.CONTACT_RISK_PROVIDER = "thorn"; // gated stub throws
    const { assessMessageRisk, assessConnectionRisk } = await import("./contact");
    expect(await assessMessageRisk({ body: "hi", involvesMinor: true })).toBe("review");
    expect(await assessConnectionRisk({ requesterIsAdult: true, addresseeIsMinor: true })).toBe("review");
  });
});
