import { z } from "zod";

export const BRAIN_KINDS = ["retro", "note", "doc", "derived"] as const;
export type BrainKind = (typeof BRAIN_KINDS)[number];

export const BRAIN_KIND_LABELS: Record<BrainKind, string> = {
  retro: "Retro",
  note: "Note",
  doc: "Doc",
  derived: "Derived",
};

// Section colours are fixed by the kit. A retro is about an event that has
// happened (Media/Attendees teal), a doc is shared writing (Food/Notes
// amber), a derived note was written by the agent rather than a person
// (neutral, so it never competes with things people wrote).
export const BRAIN_KIND_COLORS: Record<BrainKind, string> = {
  retro: "var(--teal)",
  note: "var(--blue)",
  doc: "var(--amber)",
  derived: "var(--line-strong)",
};

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const noteSchema = z.object({
  title: z.string().trim().min(1, "Give it a title"),
  kind: z.enum(BRAIN_KINDS),
  semester: optionalText,
  visibility: z.enum(["exec", "club"]),
  sourceUrl: optionalText,
  eventId: z.string().uuid().nullable(),
  contactId: z.string().uuid().nullable(),
});
export type NoteInput = z.input<typeof noteSchema>;

// Capture without opening the editor: paste text, or a link plus a note about
// it. `body` is what search reads, so a captured note is answerable the
// moment it lands rather than after someone tidies it up.
export const captureSchema = z.object({
  title: z.string().trim().min(1, "Give it a title"),
  body: z.string().trim().min(1, "Paste something"),
  kind: z.enum(BRAIN_KINDS),
  sourceUrl: optionalText,
});
export type CaptureInput = z.input<typeof captureSchema>;
