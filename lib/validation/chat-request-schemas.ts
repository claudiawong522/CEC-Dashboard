import { z } from "zod";
import { INTEREST_TAGS } from "@/lib/utils/interests";

// A Cornell netid: letters then digits, as issued (ab123, abc1234). Validated
// rather than accepting any string because the form only ever appends
// @cornell.edu, so a netid with an @ in it would produce a nonsense address.
export const netidSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Enter your netid")
  .max(12, "That doesn't look like a netid")
  .regex(/^[a-z]{2,4}[0-9]{1,6}$/, "A netid looks like abc123");

export const chatRequestSchema = z.object({
  netid: netidSchema,
  fullName: z.string().trim().min(1, "Name is required").max(120, "That name is too long"),
  gradYear: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, "Use a four-digit year")
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  major: z.string().trim().max(80, "Keep it short").optional().transform((v) => v || null),
  interests: z
    .array(z.enum(INTEREST_TAGS))
    .min(1, "Pick at least one interest")
    .max(6, "Pick up to six"),
  prompt: z
    .string()
    .trim()
    .min(1, "Say what you'd like to talk about")
    .max(400, "Keep it under 400 characters"),
});

export type ChatRequestInput = z.input<typeof chatRequestSchema>;
