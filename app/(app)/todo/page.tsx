import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { incompleteSections } from "@/lib/utils/completion";
import { SECTION_COLORS, type SectionLabel } from "@/lib/utils/section-colors";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { Sticker } from "@/components/stickers/Sticker";
import { Sprig } from "@/components/stickers/shapes";
import { TodoDecor } from "@/components/todo/TodoDecor";

const STAGGER_CAP = 6;

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
    <div className="relative flex flex-col gap-[17px]">
      <TodoDecor />
      <h1 className="relative z-10 font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
        Todo
      </h1>

      {rows.length === 0 ? (
        <div className="relative z-10 flex items-center gap-[14px] rounded-[10px] border border-dashed border-[rgba(35,32,28,0.14)] px-4 py-3.5">
          <Sticker floatVariant="none" wrapperClassName="shrink-0">
            <Sprig size={46} />
          </Sticker>
          <span className="font-sans text-[12.5px] leading-[1.6] text-faint">
            Nothing outstanding, every event is fully prepped.
          </span>
        </div>
      ) : (
        <div className="relative z-10 overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          {rows.map(({ event, missing }, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              style={i < STAGGER_CAP ? { animationDelay: `${0.05 + i * 0.07}s` } : undefined}
              className={`flex flex-col gap-[9px] px-4 py-3.5 transition-colors duration-200 hover:bg-wash ${
                i < STAGGER_CAP ? "animate-riseIn" : ""
              } ${i < rows.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-[14px] font-medium text-ink">{event.name}</span>
                <span className="font-mono text-[10px] tracking-[0.11em] text-faint uppercase">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                  {event.event_end_time ? `–${formatEventTime(event.event_end_time)}` : ""}
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
