import { describe, it, expect } from "vitest";
import { composition } from "@/lib/utils/signin-copy";

describe("composition", () => {
  it("never repeats the headcount rendered beside it", () => {
    // The regression: one person, all new, used to read "1" then "1 first-timer".
    expect(composition(1, 1)).toBe("first time here");
    expect(composition(4, 4)).toBe("all first time");
  });

  it("quantifies only a genuine mix", () => {
    expect(composition(5, 2)).toBe("2 first-timers");
    expect(composition(5, 1)).toBe("1 first-timer");
  });

  it("names the all-returning and empty rooms", () => {
    expect(composition(3, 0)).toBe("all returning");
    expect(composition(0, 0)).toBe("nobody yet");
  });
});
