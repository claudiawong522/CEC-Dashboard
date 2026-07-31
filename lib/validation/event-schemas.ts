import { z } from "zod";

// Both event forms carry a start/end time pair — factored out so the
// "end after start" rule can't drift between them.
function requireEndAfterStart<T extends { eventStartTime: string; eventEndTime: string }>(
  values: T,
  ctx: z.RefinementCtx,
) {
  if (values.eventStartTime && values.eventEndTime && values.eventEndTime <= values.eventStartTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End must be after start",
      path: ["eventEndTime"],
    });
  }
}

export const toggleFormSchema = z
  .object({
    name: z.string().min(1, "Required"),
    eventDate: z.string().min(1, "Required"),
    eventStartTime: z.string().min(1, "Required"),
    eventEndTime: z.string().min(1, "Required"),
    venue: z.string().min(1, "Required"),
    hasSpeaker: z.boolean(),
    hasAttendees: z.boolean(),
    hasMoney: z.boolean(),
    hasFood: z.boolean(),
    hasMarketing: z.boolean(),
    hasMedia: z.boolean(),
    repeatsFrequency: z.enum(["weekly", "biweekly", "monthly"]).nullable(),
    repeatsEndsMode: z.enum(["date", "count"]).optional(),
    repeatsEndDate: z.string().optional(),
    // Plain z.number(), not z.coerce — react-hook-form's zodResolver infers
    // its field type from the schema's input type, and a coerced field's
    // input type is `unknown`, which the useForm<ToggleFormValues>() generic
    // (built from the *output* type) can't satisfy. The Select in ToggleForm
    // converts to a number before calling field.onChange, so input already
    // matches output here.
    repeatsOccurrenceCount: z.number().int().min(1).max(104).optional(),
  })
  .superRefine((values, ctx) => {
    requireEndAfterStart(values, ctx);
    if (!values.repeatsFrequency) return;
    if ((values.repeatsEndsMode ?? "date") === "date" && !values.repeatsEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick an end date",
        path: ["repeatsEndDate"],
      });
    }
    if (values.repeatsEndsMode === "count" && !values.repeatsOccurrenceCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a number of occurrences",
        path: ["repeatsOccurrenceCount"],
      });
    }
  });
export type ToggleFormValues = z.infer<typeof toggleFormSchema>;

// Plain ZodObject (not wrapped in superRefine) so callers can still .pick()
// individual fields off it — eventHeaderSchema below is the refined version
// used wherever the full start/end time pair is being validated together.
export const eventCoreSchema = z.object({
  name: z.string().min(1, "Required"),
  eventDate: z.string().min(1, "Required"),
  eventStartTime: z.string().min(1, "Required"),
  eventEndTime: z.string().min(1, "Required"),
  venue: z.string().min(1, "Required"),
  notes: z.string().optional(),
});
export type EventCoreValues = z.infer<typeof eventCoreSchema>;

export const eventHeaderSchema = eventCoreSchema
  .pick({ name: true, eventDate: true, eventStartTime: true, eventEndTime: true })
  .superRefine(requireEndAfterStart);

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

export const customMarketingItemSchema = z.object({
  label: z.string().min(1, "Required"),
});
export type CustomMarketingItemValues = z.infer<typeof customMarketingItemSchema>;

export const recurringSchema = z
  .object({
    frequency: z.enum(["weekly", "biweekly", "monthly"]),
    endsMode: z.enum(["date", "count"]),
    endDate: z.string().optional(),
    occurrenceCount: z.coerce.number().int().min(1).max(104).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.endsMode === "date" && !values.endDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["endDate"] });
    }
    if (values.endsMode === "count" && !values.occurrenceCount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["occurrenceCount"] });
    }
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
