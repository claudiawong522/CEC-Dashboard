import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  signInWindow,
  pickCurrentEvent,
  wallClockNow,
  wallClockDate,
  foodOpensMinutes,
  foodState,
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

describe("foodOpensMinutes", () => {
  const evening = {
    id: "sh",
    event_date: "2026-09-03",
    event_time: "19:30:00",
    event_end_time: "21:00:00",
  };

  it("defaults to 45 minutes after the doors, which is 8:15 for Startup Hours", () => {
    const opens = foodOpensMinutes({ ...evening, food_opens_at: null });
    const doors = signInWindow(evening).opensAt;
    expect(opens - doors).toBe(45);
  });

  it("uses an explicit time when the event sets one", () => {
    const opens = foodOpensMinutes({ ...evening, food_opens_at: "20:00:00" });
    expect(opens - signInWindow(evening).opensAt).toBe(30);
  });
});

describe("foodState", () => {
  const evening = {
    id: "sh",
    event_date: "2026-09-03",
    event_time: "19:30:00",
    event_end_time: "21:00:00",
    food_opens_at: null,
  };
  const opensAt = foodOpensMinutes(evening);
  const doors = signInWindow(evening).opensAt;

  it("is not open before the food time", () => {
    expect(foodState(evening, doors, opensAt - 1).status).toBe("not_yet");
  });

  it("opens exactly on the minute", () => {
    expect(foodState(evening, doors, opensAt).status).toBe("open");
  });

  it("feeds someone who signed in a minute before food opened", () => {
    expect(foodState(evening, opensAt - 1, opensAt + 5).status).toBe("open");
  });

  it("refuses someone who signed in a minute after food opened", () => {
    // The whole point: turning up at 8:16 for an 8:15 release gets nothing.
    expect(foodState(evening, opensAt + 1, opensAt + 5).status).toBe("too_late");
  });

  it("refuses someone who never signed in at all", () => {
    expect(foodState(evening, null, opensAt + 5).status).toBe("too_late");
  });
});
