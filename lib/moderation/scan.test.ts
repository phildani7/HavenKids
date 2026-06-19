import { describe, it, expect, afterEach, vi } from "vitest";

// server-only throws in non-Next.js environments; stub it out for unit tests.
vi.mock("server-only", () => ({}));

// We test getScanProvider in isolation — no Supabase, no Next.js aliases needed.
// scanAndAct is integration-level (needs DB) and is not unit-tested here.

describe("getScanProvider", () => {
  afterEach(() => {
    delete process.env.SCAN_PROVIDER;
  });

  it("returns the manual provider when SCAN_PROVIDER is unset", async () => {
    delete process.env.SCAN_PROVIDER;
    const { getScanProvider } = await import("./scan");
    const provider = getScanProvider();
    expect(provider.name).toBe("manual");
    const verdict = await provider.scanImage("any/path");
    expect(verdict).toBe("review");
  });

  it("returns a gated photodna provider that throws when invoked", async () => {
    process.env.SCAN_PROVIDER = "photodna";
    const { getScanProvider } = await import("./scan");
    const provider = getScanProvider();
    expect(provider.name).toBe("photodna");
    await expect(provider.scanImage("any/path")).rejects.toThrow("not configured");
  });
});
