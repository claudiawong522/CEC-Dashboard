import { Suspense } from "react";
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
  MarketingCustomItemRow,
  RecurringSeriesRow,
  EventFileRow,
} from "@/lib/types/events";

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .maybeSingle<EventRow>();

  if (!event) notFound();

  const [
    { data: speaker },
    { data: attendees },
    { data: money },
    { data: food },
    { data: marketing },
    { data: recurringSeries },
    { data: files },
    { data: marketingCustomItems },
  ] = await Promise.all([
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
    event.recurring_series_id
      ? supabase
          .from("recurring_series")
          .select("id, frequency, ends_mode, end_date, occurrence_count")
          .eq("id", event.recurring_series_id)
          .maybeSingle<RecurringSeriesRow>()
      : Promise.resolve({ data: null }),
    supabase.from("event_files").select("*").eq("event_id", eventId).returns<EventFileRow[]>(),
    supabase
      .from("event_marketing_custom_items")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true })
      .returns<MarketingCustomItemRow[]>(),
  ]);

  return (
    <Suspense fallback={null}>
      <DetailsForm
        event={event}
        speaker={speaker}
        attendees={attendees}
        money={money}
        food={food}
        marketing={marketing}
        recurringSeries={recurringSeries}
        files={files ?? []}
        marketingCustomItems={marketingCustomItems ?? []}
      />
    </Suspense>
  );
}
