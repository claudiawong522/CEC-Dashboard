import { describe, it, expect } from "vitest";
import { shiftDate, rescheduledRange, clubDateToInstant, formatClubDate } from "@/lib/utils/dates";

describe("shiftDate", () => {
  it("moves a date-only string by whole days", () => {
    expect(shiftDate("2026-10-22", 1)).toBe("2026-10-23");
    expect(shiftDate("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDate("2026-03-07", 2)).toBe("2026-03-09");
  });
});

describe("rescheduledRange", () => {
  it("moves a single-day event to a later day without breaking end >= start", () => {
    expect(rescheduledRange("2026-10-22", "2026-10-22", "2026-10-23")).toEqual({
      event_date: "2026-10-23",
      event_end_date: "2026-10-23",
    });
  });

  it("moves to an earlier day without stretching the event", () => {
    expect(rescheduledRange("2026-10-22", "2026-10-22", "2026-10-20")).toEqual({
      event_date: "2026-10-20",
      event_end_date: "2026-10-20",
    });
  });

  it("keeps a multi-day span intact", () => {
    expect(rescheduledRange("2026-10-22", "2026-10-24", "2026-10-30")).toEqual({
      event_date: "2026-10-30",
      event_end_date: "2026-11-01",
    });
  });
});

describe("clubDateToInstant", () => {
  it("lands on the same calendar day in Ithaca", () => {
    for (const d of ["2026-10-11", "2026-01-15", "2026-03-08", "2026-11-01"]) {
      const iso = clubDateToInstant(d);
      expect(formatClubDate(iso, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA")).toBe(d);
    }
  });

  it("is noon in Ithaca, so a viewer anywhere from UTC-11 to UTC+11 sees the same day", () => {
    expect(clubDateToInstant("2026-10-11")).toBe("2026-10-11T16:00:00.000Z");
    expect(clubDateToInstant("2026-01-15")).toBe("2026-01-15T17:00:00.000Z");
  });
});

describe("formatClubDate", () => {
  it("reads a UTC instant on the Ithaca calendar", () => {
    // 02:00 UTC on the 12th is still the evening of the 11th in Ithaca.
    expect(
      formatClubDate("2026-10-12T02:00:00Z", { month: "short", day: "numeric", year: "numeric" }, "en-US"),
    ).toBe("Oct 11, 2026");
  });
});
