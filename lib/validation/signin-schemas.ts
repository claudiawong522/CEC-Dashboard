import { z } from "zod";
import { normalizeLinkedIn } from "@/lib/utils/linkedin";

// The public sign in is the one form in this app whose sender has no account
// and no session, so every field is validated here and again by the database
// constraints behind it.
//
// LinkedIn, affiliation and background are required of a person, but not by
// this schema. Whether they are owed depends on what is already on their
// guests row, which only the server knows, so the shape here stays permissive
// and lib/actions/signin.ts refuses the submission that leaves a field blank
// with nothing behind it. Validating it here instead would mean a returning
// guest, whose form correctly never showed them the field, being rejected for
// not filling it in.
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("That doesn't look like an email")
    .max(254, "That email is too long"),
  fullName: z.string().trim().min(1, "Name is required").max(120, "That name is too long"),
  // An empty string is what an untouched input actually sends, and it means
  // "not answered here", not "invalid".
  linkedinUrl: z
    .string()
    .trim()
    .max(300, "That link is too long")
    .optional()
    .superRefine((value, ctx) => {
      if (value && !normalizeLinkedIn(value)) {
        ctx.addIssue({
          code: "custom",
          message: "That doesn't look like a LinkedIn profile",
        });
      }
    })
    // Stored normalised, so the same person pasting from the app, from the
    // web, or typing their handle lands on one string.
    .transform((value) => (value ? normalizeLinkedIn(value) : null)),
  affiliation: z
    .string()
    .trim()
    .max(120, "Keep it under 120 characters")
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
