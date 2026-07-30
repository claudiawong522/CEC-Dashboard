import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { incompleteSections } from "@/lib/utils/completion";
import { SECTION_COLORS, type SectionLabel } from "@/lib/utils/section-colors";

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
    }) as SectionLabel[],
  }));

  return (
    <div className="flex flex-col gap-[17px]">
      <h1 className="font-sans text-2xl leading-[1.2] font-medium tracking-[-0.022em] text-ink">
        Todo
      </h1>

      {rows.length === 0 ? (
        <div className="flex items-center gap-[14px] rounded-[10px] border border-dashed border-[rgba(35,32,28,0.14)] px-4 py-3.5">
          <div className="relative size-[46px] shrink-0">
            <div
              className="absolute top-[11px] left-[22px] h-[30px] w-[1.5px]"
              style={{
                background: "linear-gradient(180deg, rgba(63,167,137,.7), rgba(63,167,137,.1))",
              }}
            />
            <div
              className="absolute top-[14px] left-[7px] h-[11px] w-5 rounded-full blur-[4px]"
              style={{
                background: "radial-gradient(circle at 70% 50%, #3FA789, transparent 74%)",
                transform: "rotate(-16deg)",
              }}
            />
            <div
              className="absolute top-[24px] left-[21px] h-[11px] w-5 rounded-full blur-[4px]"
              style={{
                background: "radial-gradient(circle at 30% 50%, #3FA789, transparent 74%)",
                transform: "rotate(16deg)",
              }}
            />
            <div
              className="absolute top-[2px] left-[18px] h-[15px] w-3 blur-[3px]"
              style={{
                background: "radial-gradient(circle at 50% 70%, #E8583D, transparent 76%)",
                borderRadius: "50% 50% 45% 45%",
              }}
            />
          </div>
          <span className="font-sans text-[12.5px] leading-[1.6] text-faint">
            Nothing outstanding, every event is fully prepped.
          </span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          {rows.map(({ event, missing }, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
              className={`flex flex-col gap-[9px] px-4 py-3.5 transition-colors duration-200 hover:bg-wash animate-riseIn ${
                i < rows.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-sm font-medium text-ink">{event.name}</span>
                <span className="font-mono text-[10px] tracking-[0.11em] text-faint uppercase">
                  {event.event_date} · {event.event_time.slice(0, 5)}
                  {event.event_end_time ? `–${event.event_end_time.slice(0, 5)}` : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((label) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[9px] py-1 font-mono text-[9.5px] tracking-[0.1em] text-body uppercase"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: SECTION_COLORS[label] }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
