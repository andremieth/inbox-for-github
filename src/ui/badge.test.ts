import { describe, expect, it } from "vitest";
import { badgeText } from "./badge";

describe("badgeText", () => {
  it("shows the count while it fits the overlay", () => {
    expect(badgeText(1)).toBe("1");
    expect(badgeText(42)).toBe("42");
    expect(badgeText(99)).toBe("99");
  });

  it("falls back to a plain disc beyond two digits", () => {
    expect(badgeText(100)).toBeNull();
    expect(badgeText(1234)).toBeNull();
  });
});
