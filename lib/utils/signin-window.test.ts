import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  signInWindow,
  pickCurrentEvent,
  wallClockNow,
  wallClockDate,
} from "@/lib/utils/signin-window";

const base = { id: "a", event_date: "2026-09-03", event_time: "18:30:00", event_end_time: null };

describe("normalizeEmail", () => {
  it("trims and lowercases", () => {
    expect(normalizeEmail("  Ada@Cornell.EDU ")).toBe("ada@cornell.edu");
  });
});

describe("signInWindow", () => {
  it("closes three hours after the start when there is no end time", () => {
    const { opensAt, closesAt } = signInWindow(base);
    expect(closesAt - opensAt).toBe(180);
  });

  it("closes at the event end time when one is set", () => {
    const { opensAt, closesAt } = signInWindow({ ...base, event_end_time: "20:00:00" });
    expect(closesAt - opensAt).toBe(90);
  });

  it("carries an end time past midnight into the next day", () => {
    const { opensAt, closesAt } = signInWindow({
      ...base,
      event_time: "22:00:00",
      event_end_time: "01:00:00",
    });
    expect(closesAt - opensAt).toBe(180);
  });
});

describe("wallClockNow", () => {
  it("reads the clock in Ithaca, not the server zone", () => {
    // 2026-09-03T22:30:00Z is 6:30pm EDT the same day.
    const minutes = wallClockNow(new Date("2026-09-03T22:30:00Z"), "America/New_York");
    expect(minutes).toBe(signInWindow(base).opensAt);
  });

  it("is still the previous day in Ithaca just after midnight UTC", () => {
    expect(wallClockDate(new Date("2026-09-04T02:00:00Z"), "America/New_York")).toBe("2026-09-03");
  });
});

describe("pickCurrentEvent", () => {
  const at = (iso: string) => wallClockNow(new Date(iso), "America/New_York");

  it("returns null before the window opens", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T22:29:00Z"))).toBeNull();
  });

  it("returns the event once it has started", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T22:30:00Z"))?.id).toBe("a");
  });

  it("stays open past 7pm, which is the whole point", () => {
    expect(pickCurrentEvent([base], at("2026-09-03T23:45:00Z"))?.id).toBe("a");
  });

  it("returns null after the window closes", () => {
    expect(pickCurrentEvent([base], at("2026-09-04T01:31:00Z"))).toBeNull();
  });

  it("prefers the event that started most recently when two overlap", () => {
    const later = { ...base, id: "b", event_time: "19:00:00" };
    expect(pickCurrentEvent([base, later], at("2026-09-03T23:15:00Z"))?.id).toBe("b");
  });

  it("ignores an event on a different night", () => {
    const tomorrow = { ...base, id: "c", event_date: "2026-09-04" };
    expect(pickCurrentEvent([tomorrow], at("2026-09-03T23:00:00Z"))).toBeNull();
  });
});
