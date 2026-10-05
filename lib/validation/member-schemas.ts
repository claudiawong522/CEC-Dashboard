import { z } from "zod";

export const TEAMS = ["events", "media", "generalist"] as const;
export type Team = (typeof TEAMS)[number];

export const TEAM_LABELS: Record<Team, string> = {
  events: "Events",
  media: "Media",
  generalist: "Generalist",
};

// Subteam colours reuse the fixed section palette rather than inventing new
// ones: Events is the club's calendar work (teal, same as Venue/Attendees),
// Media matches Marketing's coral. Generalist keeps the amber that Operations
// had, since it is the catch-all the way Operations was, and blue is freed up
// by Builders going away.
export const TEAM_COLORS: Record<Team, string> = {
  events: "var(--teal)",
  media: "var(--coral)",
  generalist: "var(--amber)",
};

// An optional free-text field arrives from a form as "" when the person
// cleared it, and "" is not null — storing it would leave the column
// technically populated with nothing, so every empty string becomes null on
// the way in and the directory can test one thing for "not filled in".
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (value) => value === null || /^https?:\/\/.+/.test(value),
    "Include the full address, starting with http:// or https://",
  );

export const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Required"),
  // Cornell netids are 2–3 letters then digits (as3548, cw2252). Validated
  // rather than free text because it is the join key for interview slots,
  // where a typo silently means "this applicant is not approved".
  netid: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .refine(
      (value) => value === null || /^[a-z]{2,3}\d{1,5}$/.test(value),
      "A netid looks like ab123",
    ),
  pronouns: optionalText,
  major: optionalText,
  minor: optionalText,
  college: optionalText,
  graduation_year: z
    .union([z.string(), z.number()])
    .transform((value) => (value === "" || value === null ? null : Number(value)))
    .nullable()
    .refine(
      (value) => value === null || (Number.isInteger(value) && value >= 2000 && value <= 2100),
      "Enter a four-digit year",
    ),
  team: z.enum(TEAMS).nullable(),
  position: z.string().trim().min(1, "Required"),
  hometown: optionalText,
  about: optionalText,
  linkedin_url: optionalUrl,
  portfolio_url: optionalUrl,
});
// Two types, not one. The form holds what an <input> gives back — every field
// a string, including the year — and the schema's transforms are what turn
// that into the row shape. A single z.infer would be the *output* type, so a
// server action typed with it would refuse the very values the form sends.
export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileValues = z.output<typeof profileSchema>;

// Matching preferences are edited on their own card and saved on their own,
// so they validate separately: someone toggling "open to chats" shouldn't be
// blocked by an unrelated half-typed URL elsewhere on the page.
export const matchingSchema = z.object({
  open_to_chats: z.boolean(),
  // Free-form tags a student can search against. Capped so one person can't
  // match every query by listing forty interests.
  interests: z
    .array(z.string().trim().min(1))
    .max(12, "Twelve interests is plenty")
    .transform((values) => Array.from(new Set(values.map((value) => value.toLowerCase())))),
  chat_blurb: z
    .string()
    .trim()
    .max(280, "Keep it under 280 characters")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});
export type MatchingInput = z.input<typeof matchingSchema>;
export type MatchingValues = z.output<typeof matchingSchema>;
