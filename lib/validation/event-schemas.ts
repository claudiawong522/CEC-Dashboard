import { z } from "zod";

export const toggleFormSchema = z.object({
  name: z.string().min(1, "Required"),
  eventDate: z.string().min(1, "Required"),
  eventTime: z.string().min(1, "Required"),
  venue: z.string().min(1, "Required"),
  hasSpeaker: z.boolean(),
  hasAttendees: z.boolean(),
  hasMoney: z.boolean(),
  hasFood: z.boolean(),
  hasMarketing: z.boolean(),
  hasMedia: z.boolean(),
  hasRecurring: z.boolean(),
});
export type ToggleFormValues = z.infer<typeof toggleFormSchema>;

export const eventCoreSchema = z.object({
  name: z.string().min(1, "Required"),
  eventDate: z.string().min(1, "Required"),
  eventTime: z.string().min(1, "Required"),
  venue: z.string().min(1, "Required"),
  notes: z.string().optional(),
});
export type EventCoreValues = z.infer<typeof eventCoreSchema>;

export const speakerSchema = z.object({
  description: z.string().optional(),
});
export type SpeakerValues = z.infer<typeof speakerSchema>;

export const attendeesSchema = z.object({
  lumaUrl: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  headcountNotes: z.string().optional(),
});
export type AttendeesValues = z.infer<typeof attendeesSchema>;

export const moneySchema = z.object({
  budgetedAmount: z.coerce.number().nonnegative().optional().nullable(),
  actualAmount: z.coerce.number().nonnegative().optional().nullable(),
  notes: z.string().optional(),
});
export type MoneyValues = z.infer<typeof moneySchema>;

export const foodSchema = z.object({
  usualOptions: z.string().optional(),
  halalEnabled: z.boolean(),
  halalOptions: z.string().optional(),
});
export type FoodValues = z.infer<typeof foodSchema>;

export const marketingSchema = z.object({
  instagramPost: z.boolean(),
  eshipListserve: z.boolean(),
  storyShoutout1: z.boolean(),
  storyShoutout2: z.boolean(),
  storyShoutout3: z.boolean(),
  posters: z.boolean(),
  reel: z.boolean(),
});
export type MarketingValues = z.infer<typeof marketingSchema>;

export const recurringSchema = z.object({
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  endDate: z.string().min(1, "Required"),
});
export type RecurringValues = z.infer<typeof recurringSchema>;

export const SECTIONS = [
  "venue",
  "speaker",
  "speaker_portrait",
  "attendees",
  "money",
  "food",
  "marketing",
  "media",
  "recurring",
] as const;
export type Section = (typeof SECTIONS)[number];
