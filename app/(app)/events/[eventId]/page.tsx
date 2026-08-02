import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DetailsForm } from "@/components/events/DetailsForm";
import type { Profile } from "@/lib/auth/getSession";
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
  TaggedMemberRow,
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
    { data: taggedMembers },
    { data: allMembers },
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
    supabase
      .from("event_tagged_members")
      .select(
        "profile_id, tagged_at, profiles!event_tagged_members_profile_id_fkey(id, full_name, avatar_url, email, role, status)",
      )
      .eq("event_id", eventId)
      .returns<TaggedMemberRow[]>(),
    // Removed members drop out of the picker, but any tag they already have
    // stays — the fetch above is unfiltered on purpose, since who was tagged
    // on a past event is a record of what happened, not a live permission.
    supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, status")
      .eq("status", "active")
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<Profile[]>(),
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
        taggedMembers={(taggedMembers ?? []).flatMap((row) => (row.profiles ? [row.profiles] : []))}
        allMembers={allMembers ?? []}
      />
    </Suspense>
  );
}
