import { describe, it, expect } from "vitest";
import { sortIdeas, isClosedStage } from "./external-stage";
import { STAGE_VALUES, type StageValue } from "@/lib/validation/external-schemas";

const lead = (stage: StageValue, created_at: string) => ({ stage, created_at });

describe("isClosedStage", () => {
  it("treats converted and declined as closed", () => {
    expect(isClosedStage("converted")).toBe(true);
    expect(isClosedStage("declined")).toBe(true);
  });

  it("treats every live pipeline stage as open", () => {
    for (const stage of ["idea", "reached_out", "responded", "agreed", "date_set"] as const) {
      expect(isClosedStage(stage)).toBe(false);
    }
  });
});

describe("sortIdeas", () => {
  it("puts the furthest-along lead first and declined dead last", () => {
    const sorted = sortIdeas([
      lead("declined", "2026-08-04T00:00:00+00:00"),
      lead("idea", "2026-08-03T00:00:00+00:00"),
      lead("converted", "2026-08-02T00:00:00+00:00"),
      lead("date_set", "2026-08-01T00:00:00+00:00"),
      lead("responded", "2026-07-31T00:00:00+00:00"),
      lead("agreed", "2026-07-30T00:00:00+00:00"),
      lead("reached_out", "2026-07-29T00:00:00+00:00"),
    ]);

    expect(sorted.map((l) => l.stage)).toEqual([
      "date_set",
      "agreed",
      "responded",
      "reached_out",
      "idea",
      "converted",
      "declined",
    ]);
  });

  it("keeps a declined lead below live ones even when it is the newest", () => {
    const sorted = sortIdeas([
      lead("declined", "2026-08-04T12:00:00+00:00"),
      lead("idea", "2020-01-01T00:00:00+00:00"),
    ]);
    expect(sorted.map((l) => l.stage)).toEqual(["idea", "declined"]);
  });

  it("breaks ties inside a stage by newest first", () => {
    const sorted = sortIdeas([
      lead("idea", "2026-08-01T00:00:00+00:00"),
      lead("idea", "2026-08-03T00:00:00+00:00"),
      lead("idea", "2026-08-02T00:00:00+00:00"),
    ]);
    expect(sorted.map((l) => l.created_at)).toEqual([
      "2026-08-03T00:00:00+00:00",
      "2026-08-02T00:00:00+00:00",
      "2026-08-01T00:00:00+00:00",
    ]);
  });

  it("orders sub-second timestamps correctly despite Postgres trimming trailing zeros", () => {
    const sorted = sortIdeas([
      lead("idea", "2026-08-03T00:00:00.45+00:00"),
      lead("idea", "2026-08-03T00:00:00.5+00:00"),
    ]);
    expect(sorted[0].created_at).toBe("2026-08-03T00:00:00.5+00:00");
  });

  it("does not mutate the array it was given", () => {
    const input = [lead("idea", "2026-08-01T00:00:00+00:00"), lead("date_set", "2026-08-02T00:00:00+00:00")];
    const snapshot = [...input];
    sortIdeas(input);
    expect(input).toEqual(snapshot);
  });

  it("ranks every stage the schema knows about, so a new stage can't sort as undefined", () => {
    const ranked = sortIdeas(STAGE_VALUES.map((s, i) => lead(s, `2026-08-0${i + 1}T00:00:00+00:00`)));
    expect(ranked).toHaveLength(STAGE_VALUES.length);
    expect(new Set(ranked.map((l) => l.stage)).size).toBe(STAGE_VALUES.length);
    // Closed leads form one unbroken block at the bottom — that's what the
    // list's "Closed" divider assumes when it looks only at the row above.
    const firstClosed = ranked.findIndex((l) => isClosedStage(l.stage));
    expect(ranked.slice(firstClosed).every((l) => isClosedStage(l.stage))).toBe(true);
  });
});
