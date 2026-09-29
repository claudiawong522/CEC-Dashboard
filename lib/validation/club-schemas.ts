import { z } from "zod";

export const EVENT_TYPES = [
  "startup_hours",
  "team_meeting",
  "build_night",
  "social",
  "other",
] as const;
export type AttendanceEventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<AttendanceEventType, string> = {
  startup_hours: "Startup Hours",
  team_meeting: "Team meeting",
  build_night: "Build night",
  social: "Social",
  other: "Other",
};

// A shoutout names either a member or a plain name, never both and never
// neither. The database enforces it with num_nonnulls; this mirrors it so the
// person writing one gets a sentence instead of a constraint violation.
export const shoutoutSchema = z
  .object({
    receiverId: z.string().uuid().nullable(),
    receiverName: z
      .string()
      .trim()
      .max(80, "Keep the name short")
      .transform((value) => (value === "" ? null : value))
      .nullable(),
    message: z.string().trim().min(1, "Say something").max(500, "Keep it under 500 characters"),
    isAnonymous: z.boolean(),
  })
  .refine((value) => (value.receiverId === null) !== (value.receiverName === null), {
    message: "Pick a member, or type a name for someone who isn't one",
    path: ["receiverId"],
  });
export type ShoutoutInput = z.input<typeof shoutoutSchema>;

export const attendanceSchema = z.object({
  // Null when the thing being recorded isn't in the events table at all: an
  // ad-hoc work session, a team meeting nobody made an event for.
  eventId: z.string().uuid().nullable(),
  eventName: z.string().trim().min(1, "Name what they attended"),
  eventType: z.enum(EVENT_TYPES),
  profileIds: z.array(z.string().uuid()).min(1, "Pick at least one person"),
});
export type AttendanceInput = z.input<typeof attendanceSchema>;
