import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { incompleteSections } from "@/lib/utils/completion";
import { Badge } from "@/components/ui/badge";

type DoneRow = { event_id: string; done: boolean };

export default async function TodoPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_time, event_end_time, venue, venue_done, has_speaker, has_attendees, has_money, has_food, has_marketing, has_media, media_done, has_recurring",
    )
    .eq("is_complete", false)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  if (error) console.error("[todo] failed to load events:", error.message);

  const eventIds = (events ?? []).map((e) => e.id);

  const [speaker, attendees, money, food, marketing, recurring] =
    eventIds.length === 0
      ? [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }]
      : await Promise.all([
          supabase.from("event_speaker").select("event_id, done").in("event_id", eventIds),
          supabase.from("event_attendees").select("event_id, done").in("event_id", eventIds),
          supabase.from("event_money").select("event_id, done").in("event_id", eventIds),
          supabase.from("event_food").select("event_id, done").in("event_id", eventIds),
          supabase.from("event_marketing").select("event_id, done").in("event_id", eventIds),
          supabase.from("event_recurring").select("event_id, done").in("event_id", eventIds),
        ]);

  const doneMap = (rows: DoneRow[] | null) =>
    new Map((rows ?? []).map((r) => [r.event_id, r.done]));

  const speakerDone = doneMap(speaker.data);
  const attendeesDone = doneMap(attendees.data);
  const moneyDone = doneMap(money.data);
  const foodDone = doneMap(food.data);
  const marketingDone = doneMap(marketing.data);
  const recurringDone = doneMap(recurring.data);

  const rows = (events ?? []).map((event) => ({
    event,
    missing: incompleteSections({
      venue_done: event.venue_done,
      has_speaker: event.has_speaker,
      speaker_done: speakerDone.get(event.id) ?? false,
      has_attendees: event.has_attendees,
      attendees_done: attendeesDone.get(event.id) ?? false,
      has_money: event.has_money,
      money_done: moneyDone.get(event.id) ?? false,
      has_food: event.has_food,
      food_done: foodDone.get(event.id) ?? false,
      has_marketing: event.has_marketing,
      marketing_done: marketingDone.get(event.id) ?? false,
      has_media: event.has_media,
      media_done: event.media_done,
      has_recurring: event.has_recurring,
      recurring_done: recurringDone.get(event.id) ?? false,
    }),
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium tracking-tight">Todo</h1>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing outstanding — every event is fully prepped.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200">
          {rows.map(({ event, missing }) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex flex-col gap-1.5 px-4 py-3 hover:bg-stone-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{event.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.event_date} · {event.event_time.slice(0, 5)}
                    {event.event_end_time ? `–${event.event_end_time.slice(0, 5)}` : ""}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map((label) => (
                    <Badge key={label} variant="outline" className="text-[0.7rem]">
                      {label}
                    </Badge>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
