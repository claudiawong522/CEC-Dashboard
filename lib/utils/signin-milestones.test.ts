import { describe, it, expect } from "vitest";
import {
  milestoneFor,
  pickQuestions,
  visitLine,
  type SignInQuestion,
} from "@/lib/utils/signin-milestones";

const q = (id: string, audience: SignInQuestion["audience"]): SignInQuestion => ({
  id,
  prompt: `prompt ${id}`,
  placeholder: null,
  audience,
});

describe("milestoneFor", () => {
  it("marks the first visit", () => {
    expect(milestoneFor(1)?.headline).toBe("First one down");
  });

  it("marks only exact milestones", () => {
    expect(milestoneFor(5)).not.toBeNull();
    // Saying "your 5th" on a sixth visit is worse than saying nothing.
    expect(milestoneFor(6)).toBeNull();
    expect(milestoneFor(4)).toBeNull();
  });

  it("has a note for every milestone it claims", () => {
    for (const n of [3, 5, 10, 15, 20, 25, 30]) {
      expect(milestoneFor(n)?.note.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe("visitLine", () => {
  it("never says visit number 1", () => {
    expect(visitLine(1)).toBe("First time here.");
    expect(visitLine(2)).toContain("Second");
    expect(visitLine(7)).toContain("7");
  });
});

describe("pickQuestions", () => {
  const bank = [q("a", "new"), q("b", "returning"), q("c", "both"), q("d", "new")];

  it("only asks questions meant for that audience", () => {
    const asked = pickQuestions(bank, "returning", "2026-09-10", 4).map((x) => x.id);
    expect(asked).not.toContain("a");
    expect(asked).not.toContain("d");
    expect(asked.sort()).toEqual(["b", "c"]);
  });

  it("gives everyone on the same night the same questions", () => {
    // The reason this is seeded rather than random: the host's board should
    // read as one conversation, not a pile of unrelated answers.
    const first = pickQuestions(bank, "new", "2026-09-10", 2).map((x) => x.id);
    const second = pickQuestions(bank, "new", "2026-09-10", 2).map((x) => x.id);
    expect(first).toEqual(second);
  });

  it("moves on to a different night", () => {
    const nights = new Set(
      ["2026-09-10", "2026-09-17", "2026-09-24", "2026-10-01"].map((d) =>
        pickQuestions(bank, "new", d, 1)[0]?.id,
      ),
    );
    expect(nights.size).toBeGreaterThan(1);
  });

  it("asks nothing when the bank is empty rather than throwing", () => {
    expect(pickQuestions([], "new", "2026-09-10", 2)).toEqual([]);
  });

  it("never asks for more than the bank holds", () => {
    expect(pickQuestions(bank, "returning", "2026-09-10", 9)).toHaveLength(2);
  });

  it("never asks the same person the same question twice", () => {
    const answered = new Set(["b"]);
    const asked = pickQuestions(bank, "returning", "2026-09-10", 4, answered).map((x) => x.id);
    expect(asked).toEqual(["c"]);
  });

  it("runs out for someone who has worked through the bank", () => {
    // The end state the form is built around: a regular with nothing left to
    // answer goes straight to the tick.
    const answered = new Set(["b", "c"]);
    expect(pickQuestions(bank, "returning", "2026-09-10", 4, answered)).toEqual([]);
  });

  it("still fills the ask from what is left", () => {
    const answered = new Set(["a"]);
    const asked = pickQuestions(bank, "new", "2026-09-10", 2, answered).map((x) => x.id);
    expect(asked).toHaveLength(2);
    expect(asked).not.toContain("a");
  });
});
