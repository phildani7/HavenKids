import { describe, it, expect } from "vitest";
import { moderateText } from "./text";

describe("moderateText", () => {
  it("detects flagged words case-insensitively", () => {
    expect(moderateText("You are DUMB")).toEqual({ flagged: true, word: "dumb" });
    expect(moderateText("That is STUPID")).toEqual({ flagged: true, word: "stupid" });
    expect(moderateText("I HATE this")).toEqual({ flagged: true, word: "hate" });
    expect(moderateText("SHUT UP already")).toEqual({ flagged: true, word: "shut up" });
  });

  it("detects flagged words in mixed case", () => {
    expect(moderateText("Dumb idea")).toEqual({ flagged: true, word: "dumb" });
    expect(moderateText("Stupid move")).toEqual({ flagged: true, word: "stupid" });
  });

  it("returns flagged: false for clean text", () => {
    expect(moderateText("Hello, how are you?")).toEqual({ flagged: false });
    expect(moderateText("I love this community")).toEqual({ flagged: false });
  });

  it("returns flagged: false for empty string", () => {
    expect(moderateText("")).toEqual({ flagged: false });
  });
});
