import { describe, expect, it } from "vitest";
import { getDaysDifference, getCurrentYear, formatDate } from "../../src/index";

describe("Datetime", () => {
  it("getDaysDifference should compute differences", () => {
    expect(getDaysDifference(new Date("2023-01-01"), new Date("2023-01-10"))).toBe(9);
    expect(getDaysDifference(new Date("2023-01-02T10:00:00"), new Date("2023-01-03T08:00:00"))).toBe(1);
  });

  it("getCurrentYear returns current year", () => {
    expect(getCurrentYear()).toBe(new Date().getFullYear());
  });

  it("formatDate should format and handle invalid", () => {
    expect(formatDate(new Date("2023-01-15"))).toContain("2023");
    expect(formatDate(new Date("invalid-date"))).toBe("");
  });
});
