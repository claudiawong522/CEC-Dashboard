"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addWeeks, addMonths, formatISO, isAfter, parseISO } from "date-fns";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import {
  toggleFormSchema,
  eventCoreSchema,
  speakerSchema,
  attendeesSchema,
  moneySchema,
  foodSchema,
  marketingSchema,
  recurringSchema,
  type ToggleFormValues,
  type EventCoreValues,
  type SpeakerValues,
  type AttendeesValues,
  type MoneyValues,
  type FoodValues,
  type MarketingValues,
  type RecurringValues,
} from "@/lib/validation/event-schemas";

type Toggles = {
  hasSpeaker: boolean;
  hasAttendees: boolean;
  hasMoney: boolean;
  hasFood: boolean;
  hasMarketing: boolean;
  hasMedia: boolean;
  hasRecurring: boolean;
};

async function insertChildRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  toggles: Toggles,
) {
  if (toggles.hasSpeaker) await supabase.from("event_speaker").insert({ event_id: eventId });
  if (toggles.hasAttendees) await supabase.from("event_attendees").insert({ event_id: eventId });
  if (toggles.hasMoney) await supabase.from("event_money").insert({ event_id: eventId });
  if (toggles.hasFood) await supabase.from("event_food").insert({ event_id: eventId });
  if (toggles.hasMarketing) await supabase.from("event_marketing").insert({ event_id: eventId });
  if (toggles.hasRecurring) await supabase.from("event_recurring").insert({ event_id: eventId });
}

export async function createEvent(values: ToggleFormValues) {
  const session = await requireRole("edit");
  const parsed = toggleFormSchema.parse(values);
  const supabase = await createClient();
  const repeats = !!parsed.repeatsFrequency;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      name: parsed.name,
      event_date: parsed.eventDate,
      event_time: parsed.eventStartTime,
      event_end_time: parsed.eventEndTime,
      venue: parsed.venue,
      has_speaker: parsed.hasSpeaker,
      has_attendees: parsed.hasAttendees,
      has_money: parsed.hasMoney,
      has_food: parsed.hasFood,
      has_marketing: parsed.hasMarketing,
      has_media: parsed.hasMedia,
      has_recurring: repeats,
      is_recurring_parent: repeats,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (error || !event) throw new Error(error?.message ?? "Failed to create event");

  await insertChildRows(supabase, event.id, { ...parsed, hasRecurring: repeats });

  if (repeats && parsed.repeatsFrequency && parsed.repeatsEndDate) {
    await generateRecurringOccurrences(event.id, {
      frequency: parsed.repeatsFrequency,
      endDate: parsed.repeatsEndDate,
    });
  }

  revalidatePath("/calendar");
  redirect(`/events/${event.id}`);
}

export async function updateEventHeader(
  eventId: string,
  values: Pick<EventCoreValues, "name" | "eventDate" | "eventStartTime" | "eventEndTime">,
) {
  await requireRole("edit");
  const parsed = eventCoreSchema
    .pick({ name: true, eventDate: true, eventStartTime: true, eventEndTime: true })
    .parse(values);
  const supabase = await createClient();

  const { error } = await supabase
    .from("events")
    .update({
      name: parsed.name,
      event_date: parsed.eventDate,
      event_time: parsed.eventStartTime,
      event_end_time: parsed.eventEndTime,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/calendar");
}

export async function updateVenue(eventId: string, venue: string) {
  await requireRole("edit");
  const parsed = eventCoreSchema.pick({ venue: true }).parse({ venue });
  const supabase = await createClient();

  const { error } = await supabase.from("events").update({ venue: parsed.venue }).eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/calendar");
}

export async function updateNotes(eventId: string, notes: string) {
  await requireRole("edit");
  const supabase = await createClient();
  const { error } = await supabase.from("events").update({ notes: notes || null }).eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateSpeaker(eventId: string, values: SpeakerValues) {
  await requireRole("edit");
  const parsed = speakerSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_speaker")
    .update({ description: parsed.description ?? null })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateAttendees(eventId: string, values: AttendeesValues) {
  await requireRole("edit");
  const parsed = attendeesSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_attendees")
    .update({
      luma_url: parsed.lumaUrl || null,
      headcount_notes: parsed.headcountNotes ?? null,
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateMoney(eventId: string, values: MoneyValues) {
  await requireRole("edit");
  const parsed = moneySchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_money")
    .update({
      budgeted_amount: parsed.budgetedAmount ?? null,
      actual_amount: parsed.actualAmount ?? null,
      notes: parsed.notes ?? null,
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateFood(eventId: string, values: FoodValues) {
  await requireRole("edit");
  const parsed = foodSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_food")
    .update({
      usual_options: parsed.usualOptions ?? null,
      halal_enabled: parsed.halalEnabled,
      halal_options: parsed.halalEnabled ? (parsed.halalOptions ?? null) : null,
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

export async function updateMarketing(eventId: string, values: MarketingValues) {
  await requireRole("edit");
  const parsed = marketingSchema.parse(values);
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_marketing")
    .update({
      instagram_post: parsed.instagramPost,
      eship_listserve: parsed.eshipListserve,
      story_shoutout_1: parsed.storyShoutout1,
      story_shoutout_2: parsed.storyShoutout2,
      story_shoutout_3: parsed.storyShoutout3,
      posters: parsed.posters,
      reel: parsed.reel,
    })
    .eq("event_id", eventId);
  if (error) throw new Error(error.message);
  revalidatePath(`/events/${eventId}`);
}

const DONE_ON_EVENTS: Record<string, "venue_done" | "media_done"> = {
  venue: "venue_done",
  media: "media_done",
};

const DONE_CHILD_TABLES: Record<string, string> = {
  speaker: "event_speaker",
  attendees: "event_attendees",
  money: "event_money",
  food: "event_food",
  marketing: "event_marketing",
  recurring: "event_recurring",
};

export async function setSectionDone(eventId: string, section: string, done: boolean) {
  await requireRole("edit");
  const supabase = await createClient();

  const eventColumn = DONE_ON_EVENTS[section];
  if (eventColumn) {
    const { error } = await supabase.from("events").update({ [eventColumn]: done }).eq("id", eventId);
    if (error) throw new Error(error.message);
  } else {
    const table = DONE_CHILD_TABLES[section];
    if (!table) throw new Error(`Unknown section "${section}"`);
    const { error } = await supabase.from(table).update({ done }).eq("event_id", eventId);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/todo");
  revalidatePath("/past-events");
}

function nextOccurrence(date: Date, frequency: RecurringValues["frequency"]) {
  if (frequency === "weekly") return addWeeks(date, 1);
  if (frequency === "biweekly") return addWeeks(date, 2);
  return addMonths(date, 1);
}

export async function generateRecurringOccurrences(
  eventId: string,
  values: RecurringValues,
) {
  const session = await requireRole("edit");
  const parsed = recurringSchema.parse(values);
  const supabase = await createClient();

  const { data: parent, error: parentError } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_time, event_end_time, venue, has_speaker, has_attendees, has_money, has_food, has_marketing, has_media",
    )
    .eq("id", eventId)
    .single();

  if (parentError || !parent) throw new Error(parentError?.message ?? "Event not found");

  const { data: series, error: seriesError } = await supabase
    .from("recurring_series")
    .insert({ frequency: parsed.frequency, end_date: parsed.endDate, created_by: session.user.id })
    .select("id")
    .single();

  if (seriesError || !series) throw new Error(seriesError?.message ?? "Failed to create series");

  await supabase.from("events").update({ recurring_series_id: series.id }).eq("id", eventId);

  const endDate = parseISO(parsed.endDate);
  let cursor = nextOccurrence(parseISO(parent.event_date), parsed.frequency);
  const toggles: Toggles = {
    hasSpeaker: parent.has_speaker,
    hasAttendees: parent.has_attendees,
    hasMoney: parent.has_money,
    hasFood: parent.has_food,
    hasMarketing: parent.has_marketing,
    hasMedia: parent.has_media,
    hasRecurring: false,
  };

  let guard = 0;
  while (!isAfter(cursor, endDate) && guard < 104) {
    guard += 1;
    const { data: child, error: childError } = await supabase
      .from("events")
      .insert({
        name: parent.name,
        event_date: formatISO(cursor, { representation: "date" }),
        event_time: parent.event_time,
        event_end_time: parent.event_end_time,
        venue: parent.venue,
        has_speaker: parent.has_speaker,
        has_attendees: parent.has_attendees,
        has_money: parent.has_money,
        has_food: parent.has_food,
        has_marketing: parent.has_marketing,
        has_media: parent.has_media,
        has_recurring: false,
        recurring_series_id: series.id,
        is_recurring_parent: false,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (!childError && child) {
      await insertChildRows(supabase, child.id, toggles);
    }

    cursor = nextOccurrence(cursor, parsed.frequency);
  }

  revalidatePath("/calendar");
  revalidatePath(`/events/${eventId}`);
}
