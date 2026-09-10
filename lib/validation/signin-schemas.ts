import { z } from "zod";

// The public sign in is the one form in this app whose sender has no account
// and no session, so every field is validated here and again by the database
// constraints behind it.
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("That doesn't look like an email")
    .max(254, "That email is too long"),
  fullName: z.string().trim().min(1, "Name is required").max(120, "That name is too long"),
  // An empty string is what an untouched optional input actually sends, and it
  // means "no answer", not "invalid URL".
  linkedinUrl: z
    .union([z.literal(""), z.string().trim().url("Paste the full LinkedIn URL")])
    .optional()
    .transform((v) => v || null),
  background: z
    .string()
    .trim()
    .max(500, "Keep it under 500 characters")
    .optional()
    .transform((v) => v || null),
  // Answers to tonight's drawn questions, keyed by question id. The keys are
  // checked against the bank server side; anything not in it is dropped rather
  // than stored, so this cannot be used to write arbitrary JSON.
  answers: z
    .record(z.string().uuid(), z.string().trim().max(500, "Keep answers under 500 characters"))
    .default({}),
  source: z.enum(["qr", "kiosk"]).default("qr"),
});

export type SignInInput = z.input<typeof signInSchema>;
