import { describe, it, expect } from "vitest";
import { seriesEditUpdates, shiftWallClock, type SeriesOccurrence } from "./series-edit";
import { CLUB_TIME_ZONE } from "./dates";

// A weekly Thursday 6 to 7pm series straddling the end of daylight saving
// time (Sunday 2026-11-01 in America/New_York).
function occ(id: string, date: string, overrides: Partial<SeriesOccurrence> = {}): SeriesOccurrence {
  return {
    id,
    name: "Founder Night",
    event_date: date,
    event_end_date: date,
    all_day: false,
    event_time: "18:00:00",
    event_end_time: "19:00:00",
    ...overrides,
  };
}

const series = [
  occ("w1", "2026-10-15"),
  occ("w2", "2026-10-22"),
  occ("w3", "2026-10-29"),
  occ("w4", "2026-11-05"),
  occ("w5", "2026-11-12"),
];

const edit = (overrides: Partial<SeriesOccurrence>) => {
  const next: Partial<SeriesOccurrence> = { ...occ("w3", "2026-10-29"), ...overrides };
  delete next.id;
  return next as Omit<SeriesOccurrence, "id">;
};

// What instant a stored wall-clock time is in the club's zone, as UTC.
function utcHourOf(date: string, time: string) {
  const naive = Date.parse(`${date}T${time.slice(0, 5)}:00Z`);
  for (const offset of [4, 5]) {
    const candidate = new Date(naive + offset * 3_600_000);
    const local = candidate.toLocaleString("en-US", {
      timeZone: CLUB_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    if (local === time.slice(0, 5)) return candidate.getUTCHours();
  }
  throw new Error("no match");
}

describe("shiftWallClock", () => {
  it("moves a date and time by minutes, rolling over midnight", () => {
    expect(shiftWallClock("2026-10-29", "23:00:00", 120)).toEqual({ date: "2026-10-30", time: "01:00" });
    expect(shiftWallClock("2026-11-01", "00:30", -60)).toEqual({ date: "2026-10-31", time: "23:30" });
  });
});

describe("seriesEditUpdates", () => {
  it("renames the edited occurrence's later siblings, never earlier ones", () => {
    const updates = seriesEditUpdates(series[2], edit({ name: "Founder Night II" }), series, "2026-10-20");
    expect(updates.map((u) => u.id)).toEqual(["w4", "w5"]);
    expect(updates[0].patch).toEqual({ name: "Founder Night II" });
  });

  it("leaves past occurrences alone even when they come after the edited one", () => {
    const updates = seriesEditUpdates(series[0], edit({ ...series[0], name: "Renamed" }), series, "2026-10-29");
    expect(updates.map((u) => u.id)).toEqual(["w4", "w5"]);
  });

  it("shifts later occurrences by the same wall-clock change across the DST boundary", () => {
    const updates = seriesEditUpdates(
      series[2],
      edit({ event_time: "19:30", event_end_time: "21:00" }),
      series,
      "2026-10-20",
    );
    expect(updates).toEqual([
      { id: "w4", patch: { event_time: "19:30", event_end_time: "21:00" } },
      { id: "w5", patch: { event_time: "19:30", event_end_time: "21:00" } },
    ]);
    // Same 7:30pm on the clock in Ithaca, so the UTC instant moves an hour
    // between the EDT week and the EST week. A fixed UTC shift would not.
    expect(utcHourOf("2026-10-29", "19:30")).toBe(23);
    expect(utcHourOf("2026-11-05", "19:30")).toBe(0);
  });

  it("keeps each later occurrence's own time and only applies the change", () => {
    const tweaked = [...series.slice(0, 4), occ("w5", "2026-11-12", { event_time: "17:00:00", event_end_time: "18:30:00" })];
    const updates = seriesEditUpdates(tweaked[2], edit({ event_time: "19:00", event_end_time: "20:00" }), tweaked, "2026-10-20");
    expect(updates.find((u) => u.id === "w5")?.patch).toEqual({ event_time: "18:00", event_end_time: "19:30" });
  });

  it("moves the date along when the time change crosses midnight", () => {
    const updates = seriesEditUpdates(
      series[2],
      edit({ event_time: "23:00", event_end_time: "23:59", event_date: "2026-10-29", event_end_date: "2026-10-29" }),
      series,
      "2026-10-20",
    );
    expect(updates[0].patch).toEqual({ event_time: "23:00", event_end_time: "23:59" });

    const late = seriesEditUpdates(
      series[2],
      edit({ event_time: "23:30", event_end_date: "2026-10-30", event_end_time: "00:30" }),
      series,
      "2026-10-20",
    );
    expect(late[0].patch).toEqual({ event_time: "23:30", event_end_date: "2026-11-06", event_end_time: "00:30" });
  });

  it("carries a date move to this and later occurrences only", () => {
    const updates = seriesEditUpdates(
      series[2],
      edit({ event_date: "2026-10-30", event_end_date: "2026-10-30" }),
      series,
      "2026-10-20",
    );
    expect(updates).toEqual([
      { id: "w4", patch: { event_date: "2026-11-06", event_end_date: "2026-11-06" } },
      { id: "w5", patch: { event_date: "2026-11-13", event_end_date: "2026-11-13" } },
    ]);
  });

  it("switches later occurrences to all day and back", () => {
    const toAllDay = seriesEditUpdates(
      series[2],
      edit({ all_day: true, event_time: "00:00", event_end_time: "23:45" }),
      series,
      "2026-10-20",
    );
    expect(toAllDay[0].patch).toEqual({ all_day: true, event_time: "00:00", event_end_time: "23:45" });

    const allDaySeries = series.map((o) => ({ ...o, all_day: true, event_time: "00:00:00", event_end_time: "23:45:00" }));
    const toTimed = seriesEditUpdates(
      allDaySeries[2],
      edit({ all_day: false, event_time: "18:00", event_end_time: "19:00" }),
      allDaySeries,
      "2026-10-20",
    );
    expect(toTimed[0].patch).toEqual({ all_day: false, event_time: "18:00", event_end_time: "19:00" });
  });

  it("returns nothing when nothing changed", () => {
    expect(seriesEditUpdates(series[2], edit({}), series, "2026-10-20")).toEqual([]);
  });
});
