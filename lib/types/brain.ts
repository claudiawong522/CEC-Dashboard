import type { BrainKind } from "@/lib/validation/brain-schemas";
import type { Visibility } from "@/lib/validation/crm-schemas";

// The shared club doc, folded into brain_notes by 0017 with a fixed id so
// /notes stays a direct lookup rather than a search for "the doc one".
export const CLUB_NOTES_ID = "00000000-0000-0000-0000-000000000002";

export type BrainNote = {
  id: string;
  kind: BrainKind;
  title: string;
  body: string;
  semester: string | null;
  visibility: Visibility;
  source_url: string | null;
  event_id: string | null;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
  author: { id: string; full_name: string | null; email: string } | null;
};

export type BrainNoteWithContent = BrainNote & {
  content: unknown;
};

const BASE_COLUMNS =
  "id, kind, title, body, semester, visibility, source_url, event_id, contact_id, " +
  "created_at, updated_at, author:profiles!brain_notes_author_id_fkey(id, full_name, email)";

export const BRAIN_LIST_COLUMNS = BASE_COLUMNS;
export const BRAIN_NOTE_COLUMNS = `${BASE_COLUMNS}, content`;

// The one-line preview under a note's title in the list. `body` is flat text
// derived from the block document, so it can be long and unbroken; this
// trims on a word boundary rather than mid-word.
export function preview(body: string, max = 140): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : max)}…`;
}
