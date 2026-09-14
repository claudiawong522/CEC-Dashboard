import { describe, it, expect } from "vitest";
import { composition, thingsLeft } from "@/lib/utils/signin-copy";

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

describe("thingsLeft", () => {
  it("counts in words, because the number is a promise about the form", () => {
    expect(thingsLeft(1)).toBe("One thing and you're done.");
    expect(thingsLeft(3)).toBe("Three quick things and you're done.");
  });

  it("never promises fewer than one", () => {
    // A form with nothing on it never reaches this copy: the sign in goes
    // straight through. Guarding anyway, since the old copy said "one
    // question" above an empty form for months.
    expect(thingsLeft(0)).toBe("One thing and you're done.");
  });
});
