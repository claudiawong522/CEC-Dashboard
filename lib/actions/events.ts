"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addWeeks, addMonths, formatISO, isAfter, parseISO } from "date-fns";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import {
  toggleFormSchema,
  eventCoreSchema,
  eventHeaderSchema,
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
  // event_recurring has no user-facing "done" checkbox anymore (recurrence
  // isn't a prep task) — insert it pre-satisfied so it never blocks
  // events.is_complete.
  if (toggles.hasRecurring) await supabase.from("event_recurring").insert({ event_id: eventId, done: true });
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

  if (repeats && parsed.repeatsFrequency) {
    await generateRecurringOccurrences(event.id, {
      frequency: parsed.repeatsFrequency,
      endsMode: parsed.repeatsEndsMode ?? "date",
      endDate: parsed.repeatsEndDate,
      occurrenceCount: parsed.repeatsOccurrenceCount,
    });
  }

  revalidatePath("/calendar");
  redirect(parsed.hasMedia ? `/events/${event.id}?tab=media` : `/events/${event.id}`);
}

export async function updateEventHeader(
  eventId: string,
  values: Pick<EventCoreValues, "name" | "eventDate" | "eventStartTime" | "eventEndTime">,
) {
  await requireRole("edit");
  const parsed = eventHeaderSchema.parse(values);
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

  // Marking a section done/not-done applies to every occurrence of a
  // recurring series at once — they were cloned from the same prep and
  // should stay in sync, rather than re-doing the same checkbox each week.
  const { data: event } = await supabase
    .from("events")
    .select("recurring_series_id")
    .eq("id", eventId)
    .single();

  let eventIds = [eventId];
  if (event?.recurring_series_id) {
    const { data: seriesEvents } = await supabase
      .from("events")
      .select("id")
      .eq("recurring_series_id", event.recurring_series_id);
    if (seriesEvents?.length) eventIds = seriesEvents.map((e) => e.id);
  }

  const eventColumn = DONE_ON_EVENTS[section];
  if (eventColumn) {
    const { error } = await supabase.from("events").update({ [eventColumn]: done }).in("id", eventIds);
    if (error) throw new Error(error.message);
  } else {
    const table = DONE_CHILD_TABLES[section];
    if (!table) throw new Error(`Unknown section "${section}"`);
    const { error } = await supabase.from(table).update({ done }).in("event_id", eventIds);
    if (error) throw new Error(error.message);
  }

  for (const id of eventIds) revalidatePath(`/events/${id}`);
  revalidatePath("/todo");
  revalidatePath("/past-events");
}

// The nth occurrence (n = 1, 2, ...) after `anchor`, computed directly from
// the anchor every time rather than by repeatedly stepping off the last
// generated date — stepping off itself compounds date-fns' end-of-month
// clamping (Jan 31 -> Feb 28 -> Mar 28 -> ...) into permanent drift away
// from the original day-of-month.
function occurrenceDate(anchor: Date, frequency: RecurringValues["frequency"], n: number) {
  if (frequency === "weekly") return addWeeks(anchor, n);
  if (frequency === "biweekly") return addWeeks(anchor, n * 2);
  return addMonths(anchor, n);
}

// Ends-by-date: every occurrence up to and including endDate.
// Ends-by-count: `count` occurrences total, counting the anchor itself as
// the first — so `count` child events are (count - 1) more after it.
function occurrenceDatesAfter(anchor: Date, values: RecurringValues) {
  const dates: Date[] = [];
  if (values.endsMode === "count") {
    const remaining = (values.occurrenceCount ?? 1) - 1;
    for (let n = 1; n <= remaining && n <= 104; n++) dates.push(occurrenceDate(anchor, values.frequency, n));
    return dates;
  }
  const endDate = parseISO(values.endDate!);
  for (let n = 1; n <= 104; n++) {
    const date = occurrenceDate(anchor, values.frequency, n);
    if (isAfter(date, endDate)) break;
    dates.push(date);
  }
  return dates;
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
    .insert({
      frequency: parsed.frequency,
      ends_mode: parsed.endsMode,
      end_date: parsed.endsMode === "date" ? parsed.endDate : null,
      occurrence_count: parsed.endsMode === "count" ? parsed.occurrenceCount : null,
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (seriesError || !series) throw new Error(seriesError?.message ?? "Failed to create series");

  await supabase.from("events").update({ recurring_series_id: series.id }).eq("id", eventId);

  const toggles: Toggles = {
    hasSpeaker: parent.has_speaker,
    hasAttendees: parent.has_attendees,
    hasMoney: parent.has_money,
    hasFood: parent.has_food,
    hasMarketing: parent.has_marketing,
    hasMedia: parent.has_media,
    hasRecurring: false,
  };

  const dates = occurrenceDatesAfter(parseISO(parent.event_date), parsed);
  for (const date of dates) {
    const { data: child, error: childError } = await supabase
      .from("events")
      .insert({
        name: parent.name,
        event_date: formatISO(date, { representation: "date" }),
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
  }

  revalidatePath("/calendar");
  revalidatePath(`/events/${eventId}`);
}

// Changing an already-generated series' frequency or end date only affects
// occurrences that haven't happened yet: everything up to today (and the
// parent, regardless of its date) is left untouched, everything after is
// dropped and regenerated at the new cadence/end date.
export async function updateRecurringSeries(eventId: string, values: RecurringValues) {
  const session = await requireRole("edit");
  const parsed = recurringSchema.parse(values);
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("recurring_series_id")
    .eq("id", eventId)
    .single();
  if (eventError || !event?.recurring_series_id) {
    throw new Error(eventError?.message ?? "Event is not part of a recurring series");
  }
  const seriesId = event.recurring_series_id;

  const { data: seriesEvents, error: seriesEventsError } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_time, event_end_time, venue, has_speaker, has_attendees, has_money, has_food, has_marketing, has_media, is_recurring_parent",
    )
    .eq("recurring_series_id", seriesId);
  if (seriesEventsError || !seriesEvents?.length) {
    throw new Error(seriesEventsError?.message ?? "Series has no events");
  }

  // The event the caller is currently viewing is always protected too, even
  // if it's a future occurrence — otherwise editing the series from a
  // not-yet-happened occurrence could delete the very page you're on.
  const today = formatISO(new Date(), { representation: "date" });
  const protectedEvents = seriesEvents.filter(
    (e) => e.is_recurring_parent || e.event_date <= today || e.id === eventId,
  );
  const anchor = protectedEvents.reduce((latest, e) => (e.event_date > latest.event_date ? e : latest));

  const toDelete = seriesEvents
    .filter((e) => !e.is_recurring_parent && e.event_date > anchor.event_date)
    .map((e) => e.id);
  if (toDelete.length) {
    const { error: deleteError } = await supabase.from("events").delete().in("id", toDelete);
    if (deleteError) throw new Error(deleteError.message);
  }

  const { error: seriesUpdateError } = await supabase
    .from("recurring_series")
    .update({
      frequency: parsed.frequency,
      ends_mode: parsed.endsMode,
      end_date: parsed.endsMode === "date" ? parsed.endDate : null,
      occurrence_count: parsed.endsMode === "count" ? parsed.occurrenceCount : null,
    })
    .eq("id", seriesId);
  if (seriesUpdateError) throw new Error(seriesUpdateError.message);

  const toggles: Toggles = {
    hasSpeaker: anchor.has_speaker,
    hasAttendees: anchor.has_attendees,
    hasMoney: anchor.has_money,
    hasFood: anchor.has_food,
    hasMarketing: anchor.has_marketing,
    hasMedia: anchor.has_media,
    hasRecurring: false,
  };

  const createdIds: string[] = [];
  const dates = occurrenceDatesAfter(parseISO(anchor.event_date), parsed);
  for (const date of dates) {
    const { data: child, error: childError } = await supabase
      .from("events")
      .insert({
        name: anchor.name,
        event_date: formatISO(date, { representation: "date" }),
        event_time: anchor.event_time,
        event_end_time: anchor.event_end_time,
        venue: anchor.venue,
        has_speaker: anchor.has_speaker,
        has_attendees: anchor.has_attendees,
        has_money: anchor.has_money,
        has_food: anchor.has_food,
        has_marketing: anchor.has_marketing,
        has_media: anchor.has_media,
        has_recurring: false,
        recurring_series_id: seriesId,
        is_recurring_parent: false,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (!childError && child) {
      await insertChildRows(supabase, child.id, toggles);
      createdIds.push(child.id);
    }
  }

  revalidatePath("/calendar");
  revalidatePath("/todo");
  revalidatePath("/past-events");
  for (const id of [...toDelete, ...createdIds, anchor.id]) revalidatePath(`/events/${id}`);
}
