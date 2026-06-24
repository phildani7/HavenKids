import { describe, it, expect } from "vitest";
import { isRegionBlocked } from "./geo";

describe("isRegionBlocked", () => {
  it("blocks UK + EU/EEA", () => {
    for (const c of ["GB", "DE", "FR", "NO", "ie"]) expect(isRegionBlocked(c)).toBe(true);
  });
  it("allows India, US, and rest-of-world", () => {
    for (const c of ["IN", "US", "CA", "AU", "BR"]) expect(isRegionBlocked(c)).toBe(false);
  });
  it("allows when country is unknown (best-effort)", () => {
    expect(isRegionBlocked(undefined)).toBe(false);
    expect(isRegionBlocked(null)).toBe(false);
    expect(isRegionBlocked("")).toBe(false);
  });
});
