import { z } from "zod";

export const REQUEST_STATUSES = ["pending", "accepted", "completed", "declined"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "Waiting",
  accepted: "Accepted",
  completed: "Chatted",
  declined: "Declined",
};

// One student cannot paper the whole club; one member cannot be buried.
// Mirrored by helper functions in 0018 so the numbers live in both layers
// rather than only in whichever one you happen to be reading.
export const MAX_OPEN_PER_STUDENT = 3;
export const MAX_OPEN_PER_MEMBER = 5;

export const chatRequestSchema = z.object({
  profileId: z.string().uuid("Pick someone to ask"),
  studentName: z.string().trim().max(80, "Keep the name short"),
  prompt: z
    .string()
    .trim()
    .min(20, "Say a bit more about what you'd like to talk about")
    .max(600, "Keep it under 600 characters"),
  tags: z
    .array(z.string().trim().min(1))
    .max(5, "Five topics is plenty")
    .transform((values) => Array.from(new Set(values.map((value) => value.toLowerCase())))),
});
export type ChatRequestInput = z.input<typeof chatRequestSchema>;
