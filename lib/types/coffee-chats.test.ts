import { describe, it, expect } from "vitest";
import {
  buildBoard,
  approvedCount,
  partnerName,
  type ChatCategory,
  type CoffeeChat,
} from "@/lib/types/coffee-chats";
import type { ChatStatus } from "@/lib/validation/coffee-chat-schemas";

const VIEWER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const category = (id: string, position: number): ChatCategory => ({
  id,
  name: `Tile ${position}`,
  description: null,
  semester: "F26",
  board_position: position,
});

const chat = (
  overrides: Partial<CoffeeChat> & { category_id: string | null; submitter_id: string },
): CoffeeChat => ({
  id: `chat-${overrides.category_id ?? "none"}-${overrides.submitter_id}`,
  partner_id: OTHER,
  partner_guest_id: null,
  selfie_url: "seed/selfie.jpg",
  status: "approved" as ChatStatus,
  review_note: null,
  submitted_at: "2026-09-01T00:00:00Z",
  reviewed_at: null,
  semester: "F26",
  submitter: null,
  partner: null,
  partner_guest: null,
  ...overrides,
});

describe("buildBoard", () => {
  it("orders squares by board_position, not by the order they arrive", () => {
    const board = buildBoard([category("c", 2), category("a", 0), category("b", 1)], [], VIEWER);
    expect(board.map((square) => square.category.id)).toEqual(["a", "b", "c"]);
  });

  it("leaves a square empty when nobody has filled it", () => {
    const board = buildBoard([category("a", 0)], [], VIEWER);
    expect(board[0].chat).toBeNull();
  });

  it("attaches the viewer's own chat to its square", () => {
    const mine = chat({ category_id: "a", submitter_id: VIEWER });
    const board = buildBoard([category("a", 0)], [mine], VIEWER);
    expect(board[0].chat).toBe(mine);
  });

  // The page fetches every chat RLS will show, which includes other people's
  // approved ones, because the board is a shared wall. Only the viewer's fill
  // in their squares.
  it("ignores somebody else's chat in the same category", () => {
    const theirs = chat({ category_id: "a", submitter_id: OTHER });
    const board = buildBoard([category("a", 0)], [theirs], VIEWER);
    expect(board[0].chat).toBeNull();
  });

  it("ignores an uncategorised chat, which has no square to fill", () => {
    const loose = chat({ category_id: null, submitter_id: VIEWER });
    const board = buildBoard([category("a", 0)], [loose], VIEWER);
    expect(board[0].chat).toBeNull();
  });

  it("returns no squares when the semester has no board", () => {
    expect(buildBoard([], [chat({ category_id: "a", submitter_id: VIEWER })], VIEWER)).toEqual([]);
  });
});

describe("approvedCount", () => {
  const board = (...statuses: ChatStatus[]) =>
    buildBoard(
      statuses.map((_, index) => category(String(index), index)),
      statuses.map((status, index) =>
        chat({ category_id: String(index), submitter_id: VIEWER, status }),
      ),
      VIEWER,
    );

  it("counts only approved squares", () => {
    expect(approvedCount(board("approved", "approved", "pending"))).toBe(2);
  });

  // The progress bar must never go backwards. A pending square reads as
  // in-progress on the board but cannot be undone by a rejection.
  it("does not count a square that is still awaiting review", () => {
    expect(approvedCount(board("pending"))).toBe(0);
  });

  it("does not count a rejected square", () => {
    expect(approvedCount(board("rejected"))).toBe(0);
  });

  it("is zero for an untouched board", () => {
    expect(approvedCount(buildBoard([category("a", 0)], [], VIEWER))).toBe(0);
  });
});

describe("partnerName", () => {
  const person = (full_name: string | null, email: string) => ({
    id: "p",
    full_name,
    email,
  });

  it("names a member partner", () => {
    expect(partnerName({ partner: person("Leo Mehr", "lm@cornell.edu"), partner_guest: null })).toBe(
      "Leo Mehr",
    );
  });

  it("names a prospect from the request pool", () => {
    expect(
      partnerName({ partner: null, partner_guest: person("Ada Chen", "ac@cornell.edu") }),
    ).toBe("Ada Chen");
  });

  it("falls back to the email when nobody has filled in a name", () => {
    expect(partnerName({ partner: person(null, "lm@cornell.edu"), partner_guest: null })).toBe(
      "lm@cornell.edu",
    );
  });

  // The table allows exactly one of partner / partner_guest, so this is the
  // shape of a row mid-write or one the select could not resolve. The tile
  // still has to render something.
  it("says someone rather than nothing when both sides are missing", () => {
    expect(partnerName({ partner: null, partner_guest: null })).toBe("someone");
  });
});
