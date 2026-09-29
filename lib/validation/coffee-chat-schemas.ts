import { z } from "zod";

export const CHAT_STATUSES = ["pending", "approved", "rejected"] as const;
export type ChatStatus = (typeof CHAT_STATUSES)[number];

export const CHAT_STATUS_LABELS: Record<ChatStatus, string> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Needs another go",
};

export const submitChatSchema = z
  .object({
    // A partner is a member, or a prospective member from the chat request
    // pool who has no profiles row. Exactly one, mirroring the num_nonnulls
    // check on the table.
    partnerId: z.string().uuid().nullable().default(null),
    partnerGuestId: z.string().uuid().nullable().default(null),
    // Null means an uncategorised chat: someone logging a coffee chat that
    // doesn't fill a square. The board still shows it under past chats, so the
    // record is kept even when there's no tile to colour in.
    categoryId: z.string().uuid().nullable(),
    storagePath: z.string().min(1, "Add a selfie"),
  })
  .refine((value) => (value.partnerId === null) !== (value.partnerGuestId === null), {
    message: "Pick who you chatted with",
    path: ["partnerId"],
  });
export type SubmitChatInput = z.input<typeof submitChatSchema>;

export const reviewChatSchema = z.object({
  chatId: z.string().uuid(),
  approve: z.boolean(),
  note: z
    .string()
    .trim()
    .max(200, "Keep the note short")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});
export type ReviewChatInput = z.input<typeof reviewChatSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Required").max(60, "Keep the tile label short"),
  description: z
    .string()
    .trim()
    .max(160, "Keep the description short")
    .transform((value) => (value === "" ? null : value))
    .nullable(),
});
export type CategoryInput = z.input<typeof categorySchema>;

// Lives here rather than beside the actions: a "use server" module may only
// export async functions, so a plain const in there invalidates the entire
// module and every action in it stops being importable.
export const SELFIE_BUCKET = "coffee-chats";

// Selfies only, and small enough that a phone photo goes through without a
// resize step. Checked in the browser before the upload starts, so someone
// picking a 40MB video finds out immediately rather than after the wait.
export const MAX_SELFIE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_SELFIE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function selfieRejectionReason(file: File): string | null {
  if (!ACCEPTED_SELFIE_TYPES.includes(file.type)) return "That needs to be a photo";
  if (file.size > MAX_SELFIE_BYTES) return "That photo is over 8MB";
  return null;
}
