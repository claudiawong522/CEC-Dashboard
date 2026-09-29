import { describe, it, expect } from "vitest";
import { getEventTerm, currentTermKey, termFromKey } from "@/lib/utils/terms";

describe("getEventTerm", () => {
  it("buckets August through December as Fall", () => {
    expect(getEventTerm("2026-08-01").key).toBe("F26");
    expect(getEventTerm("2026-12-31").key).toBe("F26");
  });

  it("buckets January through July as Spring", () => {
    expect(getEventTerm("2026-01-01").key).toBe("S26");
    expect(getEventTerm("2026-07-31").key).toBe("S26");
  });
});

describe("currentTermKey", () => {
  // The bug: getMonth()/getFullYear() read the server's own zone, which is UTC
  // on Vercel. Between 19:00 and midnight in Ithaca on 31 December the server
  // had already rolled into January, so shoutouts, coffee chats and attendance
  // were filed under the next Spring. Those rows store only the key, so the
  // misfile could never be re-derived.
  it("stays in Fall late on New Year's Eve in Ithaca", () => {
    expect(currentTermKey(new Date("2026-12-31T19:30:00-05:00"))).toBe("F26");
    expect(currentTermKey(new Date("2026-12-31T23:59:00-05:00"))).toBe("F26");
  });

  it("turns over only when Ithaca does", () => {
    expect(currentTermKey(new Date("2027-01-01T00:01:00-05:00"))).toBe("S27");
  });

  it("mirrors the same edge at the end of July", () => {
    expect(currentTermKey(new Date("2026-07-31T20:00:00-04:00"))).toBe("S26");
    expect(currentTermKey(new Date("2026-08-01T00:01:00-04:00"))).toBe("F26");
  });
});

describe("termFromKey", () => {
  it("round-trips a key back to its season", () => {
    expect(termFromKey("F26").season).toBe("Fall");
    expect(termFromKey("S27").season).toBe("Spring");
  });
});
