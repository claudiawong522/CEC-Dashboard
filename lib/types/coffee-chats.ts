import type { ChatStatus } from "@/lib/validation/coffee-chat-schemas";

export type ChatCategory = {
  id: string;
  name: string;
  description: string | null;
  semester: string;
  board_position: number;
};

export type ChatPerson = {
  id: string;
  full_name: string | null;
  email: string;
};

export type CoffeeChat = {
  id: string;
  submitter_id: string;
  partner_id: string | null;
  partner_guest_id: string | null;
  category_id: string | null;
  selfie_url: string;
  status: ChatStatus;
  review_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  semester: string;
  submitter: ChatPerson | null;
  partner: ChatPerson | null;
  // A prospective member from the request pool, who has no profiles row. The
  // table allows exactly one of partner / partner_guest to be set.
  partner_guest: ChatPerson | null;
};

// A board square, resolved for one viewer: the category plus whatever that
// person has (or hasn't) submitted against it. Computed once on the server so
// the client component renders a flat list instead of re-deriving the join.
export type BoardSquare = {
  category: ChatCategory;
  chat: CoffeeChat | null;
};

export function buildBoard(
  categories: ChatCategory[],
  chats: CoffeeChat[],
  viewerId: string,
): BoardSquare[] {
  const mine = new Map<string, CoffeeChat>();
  for (const chat of chats) {
    if (chat.submitter_id !== viewerId || !chat.category_id) continue;
    mine.set(chat.category_id, chat);
  }
  return categories
    .slice()
    .sort((a, b) => a.board_position - b.board_position)
    .map((category) => ({ category, chat: mine.get(category.id) ?? null }));
}

// A square only counts once an admin has approved it. Pending squares read as
// filled-in-progress on the board but never toward the total, so the count
// can't go down when a submission is rejected.
export function approvedCount(squares: BoardSquare[]): number {
  return squares.filter((square) => square.chat?.status === "approved").length;
}

/** The other person in a chat, whether they are a member or a prospect. */
export function partnerName(chat: {
  partner: ChatPerson | null;
  partner_guest: ChatPerson | null;
}): string {
  const person = chat.partner ?? chat.partner_guest;
  return person?.full_name ?? person?.email ?? "someone";
}
