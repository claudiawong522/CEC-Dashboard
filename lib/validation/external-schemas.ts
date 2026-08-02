import { z } from "zod";

// The 5 forward stages of the pipeline; "declined" is a sixth value a lead
// can drop into from any of these, tracked separately so the stepper UI
// only ever has to render the happy path.
export const STAGES = ["idea", "reached_out", "responded", "agreed", "date_set"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_VALUES = [...STAGES, "declined", "converted"] as const;
export type StageValue = (typeof STAGE_VALUES)[number];

export const STAGE_LABELS: Record<StageValue, string> = {
  idea: "Idea",
  reached_out: "Reached Out",
  responded: "Responded",
  agreed: "Agreed",
  date_set: "Date Set",
  declined: "Declined",
  converted: "Converted",
};

export const quickAddSchema = z.object({
  name: z.string().min(1, "Required"),
});
export type QuickAddValues = z.infer<typeof quickAddSchema>;

export const pitchSchema = z.object({
  pitch: z.string().min(1, "Required"),
});
export type PitchValues = z.infer<typeof pitchSchema>;

export const personSchema = z.object({
  name: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email").or(z.literal("")).optional(),
});
export type PersonValues = z.infer<typeof personSchema>;

export const dateTimeSchema = z.object({
  targetDate: z.string().optional(),
  targetTime: z.string().optional(),
});
export type DateTimeValues = z.infer<typeof dateTimeSchema>;

export const notesSchema = z.object({
  notes: z.string().optional(),
});
export type NotesValues = z.infer<typeof notesSchema>;
