import { describe, it, expect } from "vitest";
import { incompleteSections, type CompletionInput } from "./completion";

const base: CompletionInput = {
  venue_done: true,
  has_speaker: false,
  speaker_done: false,
  has_attendees: false,
  attendees_done: false,
  has_money: false,
  money_done: false,
  has_food: false,
  food_done: false,
  has_marketing: false,
  marketing_done: false,
  has_media: false,
  media_done: false,
  has_recurring: false,
  recurring_done: false,
};

describe("incompleteSections", () => {
  it("returns nothing when only the mandatory venue is done", () => {
    expect(incompleteSections(base)).toEqual([]);
  });

  it("flags venue when not done, even with no sections toggled on", () => {
    expect(incompleteSections({ ...base, venue_done: false })).toEqual(["Venue"]);
  });

  it("ignores sections that were never toggled on", () => {
    expect(incompleteSections({ ...base, has_speaker: false, speaker_done: false })).toEqual([]);
  });

  it("flags a toggled-on section until its done flag is set", () => {
    expect(incompleteSections({ ...base, has_speaker: true, speaker_done: false })).toEqual([
      "Speaker",
    ]);
    expect(incompleteSections({ ...base, has_speaker: true, speaker_done: true })).toEqual([]);
  });

  it("flags media via media_done on the event row, not a child table", () => {
    expect(incompleteSections({ ...base, has_media: true, media_done: false })).toEqual(["Media"]);
    expect(incompleteSections({ ...base, has_media: true, media_done: true })).toEqual([]);
  });

  it("lists every outstanding section together, in a stable order", () => {
    expect(
      incompleteSections({
        ...base,
        venue_done: false,
        has_food: true,
        food_done: false,
        has_recurring: true,
        recurring_done: false,
      }),
    ).toEqual(["Venue", "Food", "Recurring"]);
  });
});
