import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("ms", async (orig) => await orig());
vi.mock("chrono-node", async (orig) => await orig());

import {
  getAdjustedBillingCycleStart,
  getBillingStartDate,
  getLastDayOfMonth,
} from "../../src/functions/datetime/billing-utils";
import { formatDateTime } from "../../src/functions/datetime/format-datetime";
import { formatDateTimeSmart } from "../../src/functions/datetime/format-datetime-smart";
import { formatPeriod } from "../../src/functions/datetime/format-period";
import { formatTime } from "../../src/functions/datetime/format-time";
import { getDateTimeLocal } from "../../src/functions/datetime/get-datetime-local";
import { getFirstAndLastDay } from "../../src/functions/datetime/get-first-and-last-day";
import { parseDateTime } from "../../src/functions/datetime/parse-datetime";
import { timeAgo } from "../../src/functions/datetime/time-ago";
import { getTimeZones } from "../../src/functions/datetime/timezone";

describe("billing-utils", () => {
  it("getLastDayOfMonth returns correct day for February 2023", () => {
    expect(getLastDayOfMonth(new Date("2023-02-15"))).toBe(28);
  });

  it("getLastDayOfMonth returns 31 for January", () => {
    expect(getLastDayOfMonth(new Date("2023-01-10"))).toBe(31);
  });

  it("getAdjustedBillingCycleStart clamps to last day", () => {
    expect(getAdjustedBillingCycleStart(30, new Date("2023-02-15"))).toBe(28);
  });

  it("getAdjustedBillingCycleStart keeps valid day", () => {
    expect(getAdjustedBillingCycleStart(15, new Date("2023-02-15"))).toBe(15);
  });

  it("getBillingStartDate uses current month when past cycle start", () => {
    const result = getBillingStartDate(15, new Date("2023-01-20"));
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(15);
  });

  it("getBillingStartDate goes back a month when before cycle start", () => {
    const result = getBillingStartDate(10, new Date("2023-01-05"));
    expect(result.getFullYear()).toBe(2022);
    expect(result.getMonth()).toBe(11);
  });

  it("getBillingStartDate returns a date for high cycle start", () => {
    const result = getBillingStartDate(31, new Date("2023-03-15"));
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2023);
  });
});

describe("getFirstAndLastDay", () => {
  it("returns current period when day already passed", () => {
    const { firstDay, lastDay } = getFirstAndLastDay(15, new Date("2023-05-20"));
    expect(firstDay.getMonth()).toBe(4);
    expect(firstDay.getDate()).toBe(15);
    expect(lastDay.getMonth()).toBe(5);
    expect(lastDay.getDate()).toBe(14);
  });

  it("returns previous period when day not yet reached", () => {
    const { firstDay, lastDay } = getFirstAndLastDay(15, new Date("2023-05-10"));
    expect(firstDay.getMonth()).toBe(3);
    expect(lastDay.getMonth()).toBe(4);
  });

  it("handles January boundary", () => {
    const { firstDay } = getFirstAndLastDay(15, new Date("2023-01-05"));
    expect(firstDay.getFullYear()).toBe(2022);
    expect(firstDay.getMonth()).toBe(11);
  });
});

describe("formatDateTime", () => {
  it("returns empty string for an invalid Date object", () => {
    expect(formatDateTime(new Date("invalid"))).toBe("");
  });

  it("formats a valid date", () => {
    const result = formatDateTime(new Date("2023-01-15T14:30:00Z"));
    expect(result).toContain("2023");
  });

  it("respects custom options", () => {
    const result = formatDateTime(new Date("2023-01-15T14:30:00Z"), { hour12: false });
    expect(typeof result).toBe("string");
  });
});

describe("formatDateTimeSmart", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-06-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows time for current year", () => {
    const result = formatDateTimeSmart(new Date("2023-06-15T10:30:00Z"));
    expect(result).toContain("Jun");
  });

  it("shows year for a previous year", () => {
    const result = formatDateTimeSmart(new Date("2022-06-15T10:30:00Z"));
    expect(result).toContain("2022");
  });
});

describe("formatTime", () => {
  it("formats time in en-US", () => {
    const result = formatTime(new Date("2023-12-25T14:30:00Z"));
    expect(result).toMatch(/[0-9]/);
  });

  it("accepts a date string", () => {
    const result = formatTime("2023-12-25T14:30:00Z");
    expect(typeof result).toBe("string");
  });
});

describe("formatPeriod", () => {
  it("returns dash when dates missing", () => {
    expect(formatPeriod({ periodStart: null, periodEnd: new Date() })).toBe("-");
    expect(formatPeriod({ periodStart: new Date(), periodEnd: null })).toBe("-");
  });

  it("formats a range within the same year", () => {
    const result = formatPeriod({
      periodStart: new Date("2023-01-15"),
      periodEnd: new Date("2023-06-30"),
    });
    expect(result).toContain("Jan");
    expect(result).toContain("Jun");
    expect(result).toContain("-");
  });

  it("includes year when spanning years", () => {
    const result = formatPeriod({
      periodStart: new Date("2022-11-01"),
      periodEnd: new Date("2023-02-28"),
    });
    expect(result).toContain("2022");
  });
});

describe("getDateTimeLocal", () => {
  it("returns empty for invalid date", () => {
    expect(getDateTimeLocal(new Date("invalid"))).toBe("");
  });

  it("returns YYYY-MM-DDThh:mm format", () => {
    const result = getDateTimeLocal(new Date("2023-06-15T14:30:00Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("defaults to now when no arg", () => {
    const result = getDateTimeLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});

describe("parseDateTime", () => {
  it("passes through Date objects", () => {
    const d = new Date("2023-06-15");
    expect(parseDateTime(d)).toBe(d);
  });

  it("parses natural language", () => {
    const result = parseDateTime("2023-06-15");
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for unparseable input", () => {
    expect(parseDateTime("!!!nonsense!!!")).toBeNull();
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2023-06-20T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns neverText for null", () => {
    expect(timeAgo(null)).toBe("Never");
    expect(timeAgo(null, { neverText: "Nunca" })).toBe("Nunca");
  });

  it("returns justNow for very recent", () => {
    expect(timeAgo(new Date(Date.now() - 500))).toBe("Just now");
  });

  it("returns relative time with ago suffix", () => {
    const result = timeAgo(new Date(Date.now() - 1000 * 60 * 30), { withAgo: true });
    expect(result).toContain("ago");
  });

  it("returns date for older than 23h same year", () => {
    const result = timeAgo(new Date("2023-01-10T00:00:00Z"));
    expect(result).toContain("Jan");
  });

  it("includes year for previous years", () => {
    const result = timeAgo(new Date("2022-06-15T00:00:00Z"));
    expect(result).toContain("2022");
  });
});

describe("getTimeZones", () => {
  it("returns sorted timezone objects", () => {
    const zones = getTimeZones();
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0]).toHaveProperty("label");
    expect(zones[0]).toHaveProperty("value");
    expect(zones[0].label).toContain("GMT");
  });
});
