import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailsForm } from "@/components/events/DetailsForm";
import type {
  EventRow,
  SpeakerRow,
  AttendeesRow,
  MoneyRow,
  FoodRow,
  MarketingRow,
  RecurringRow,
  EventFileRow,
} from "@/lib/types/events";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const [
    { data: event },
    { data: speaker },
    { data: attendees },
    { data: money },
    { data: food },
    { data: marketing },
    { data: recurring },
    { data: files },
  ] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId).maybeSingle<EventRow>(),
    supabase.from("event_speaker").select("*").eq("event_id", eventId).maybeSingle<SpeakerRow>(),
    supabase
      .from("event_attendees")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle<AttendeesRow>(),
    supabase.from("event_money").select("*").eq("event_id", eventId).maybeSingle<MoneyRow>(),
    supabase.from("event_food").select("*").eq("event_id", eventId).maybeSingle<FoodRow>(),
    supabase
      .from("event_marketing")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle<MarketingRow>(),
    supabase
      .from("event_recurring")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle<RecurringRow>(),
    supabase.from("event_files").select("*").eq("event_id", eventId).returns<EventFileRow[]>(),
  ]);

  if (!event) notFound();

  return (
    <DetailsForm
      event={event}
      speaker={speaker}
      attendees={attendees}
      money={money}
      food={food}
      marketing={marketing}
      recurring={recurring}
      files={files ?? []}
    />
  );
}
