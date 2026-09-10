import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  pickTodaysEvent,
  wallClockNow,
  wallClockDate,
} from "@/lib/utils/signin-window";

const at = (date: string, time: string) => ({ id: `${date}-${time}`, event_date: date, event_time: time });

const DAY = Date.UTC(2026, 8, 10) / 86_400_000; // 2026-09-10
const clock = (h: number, m = 0) => DAY * 1440 + h * 60 + m;

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Cornell.EDU ")).toBe("ada@cornell.edu");
  });
});

describe("pickTodaysEvent", () => {
  it("finds the event before it has started", () => {
    // The regression this replaces: the old clock window returned nothing at
    // 7:29 for a 7:30 start, so the first people through the door saw
    // "nothing on" and assumed the QR code was broken.
    const event = at("2026-09-10", "19:30:00");
    expect(pickTodaysEvent([event], clock(19, 29))?.id).toBe(event.id);
  });

  it("finds the event long after it has ended", () => {
    // Equally deliberate: somebody signing in at 10pm for a 7:30 event is late,
    // not wrong, and the count matters more than the tidiness.
    const event = at("2026-09-10", "19:30:00");
    expect(pickTodaysEvent([event], clock(22, 30))?.id).toBe(event.id);
  });

  it("finds a one-off afternoon session with no evening event", () => {
    const event = at("2026-09-10", "14:00:00");
    expect(pickTodaysEvent([event], clock(14, 5))?.id).toBe(event.id);
  });

  it("returns null when nothing is on", () => {
    expect(pickTodaysEvent([], clock(19, 30))).toBeNull();
  });

  it("picks the one already started when two run the same day", () => {
    const afternoon = at("2026-09-10", "14:00:00");
    const evening = at("2026-09-10", "19:30:00");
    expect(pickTodaysEvent([afternoon, evening], clock(20, 0))?.id).toBe(evening.id);
    expect(pickTodaysEvent([afternoon, evening], clock(15, 0))?.id).toBe(afternoon.id);
  });

  it("picks the first of the day before either has started", () => {
    const afternoon = at("2026-09-10", "14:00:00");
    const evening = at("2026-09-10", "19:30:00");
    expect(pickTodaysEvent([evening, afternoon], clock(9, 0))?.id).toBe(afternoon.id);
  });
});

describe("wall clock", () => {
  it("reads Ithaca's date, not the server's", () => {
    // 1am UTC on the 11th is 9pm on the 10th in Ithaca, which is the middle of
    // Startup Hours. Getting this wrong files a night under the wrong day.
    const lateUtc = new Date("2026-09-11T01:00:00Z");
    expect(wallClockDate(lateUtc)).toBe("2026-09-10");
    expect(wallClockNow(lateUtc)).toBe(clock(21, 0));
  });

  it("handles midnight rendering as 24", () => {
    const midnight = new Date("2026-09-10T04:00:00Z");
    expect(wallClockNow(midnight)).toBe(clock(0, 0));
  });
});
