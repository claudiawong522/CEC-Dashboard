import { z } from "zod";

// Cornell netids: two or three letters then digits. Validated because this is
// the join key an applicant is approved by — a typo silently means "this
// person is not on the list" on the morning of interviews.
const NETID = /^[a-z]{2,3}\d{1,5}$/;

export const cycleSchema = z.object({
  name: z.string().trim().min(1, "Give the cycle a name"),
  // Pasted wholesale from the application spreadsheet, in whatever shape it
  // comes out: commas, newlines, spaces, full email addresses, stray casing.
  // Normalising here rather than asking someone to clean it up first is the
  // difference between this being used and not.
  approvedNetids: z
    .string()
    .transform((raw) =>
      Array.from(
        new Set(
          raw
            .split(/[\s,;]+/)
            .map((entry) => entry.trim().toLowerCase().replace(/@cornell\.edu$/, ""))
            .filter(Boolean),
        ),
      ),
    )
    .refine((list) => list.length > 0, "Paste at least one netid")
    .refine(
      (list) => list.every((netid) => NETID.test(netid)),
      "Some of those don't look like netids — a netid looks like ab123",
    ),
});
export type CycleInput = z.input<typeof cycleSchema>;

export const slotSchema = z.object({
  cycleId: z.string().uuid(),
  date: z.string().min(1, "Pick a date"),
  startTime: z.string().min(1, "Pick a start time"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(10, "Ten minutes is the shortest useful slot")
    .max(120, "Two hours is the longest"),
  count: z.coerce.number().int().min(1, "At least one").max(24, "Twenty-four at a time"),
  location: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .nullable(),
  interviewerId: z.string().uuid().nullable(),
});
export type SlotInput = z.input<typeof slotSchema>;

export function formatSlot(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const day = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = (date: Date) =>
    date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time(start)}–${time(end)}`;
}
