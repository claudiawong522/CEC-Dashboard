"use client";

import { useRouter } from "next/navigation";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./CalendarView";

// design/CEC Pages.dc.html "02b · week view" — recreated directly (not via
// FullCalendar's timeGrid, whose default proportions don't match the kit's
// compact 44px gutter / 52px row grid).
const START_HOUR = 8;
const END_HOUR = 21; // exclusive of the trailing label row

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
}

function eventTimeLabel(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${mStr}${h < 12 ? "a" : "p"}`;
}

export function WeekView({
  events,
  currentDate,
}: {
  events: CalendarEvent[];
  currentDate: Date;
}) {
  const router = useRouter();
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  function eventsFor(day: Date, hour: number) {
    return events.filter((e) => {
      const [y, m, d] = e.event_date.split("-").map(Number);
      const eventDate = new Date(y, m - 1, d);
      const eventHour = Number(e.event_time.split(":")[0]);
      return isSameDay(eventDate, day) && eventHour === hour;
    });
  }

  return (
    <div className="overflow-hidden rounded-[8px] bg-[rgba(35,32,28,0.07)]">
      <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-px">
        <div className="h-8 bg-page" />
        {days.map((day) => {
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "h-8 bg-page px-2 py-2 font-mono text-[11px]",
                today ? "font-medium text-ink" : "font-normal text-body",
              )}
            >
              {format(day, "EEE d").toLowerCase()}
            </div>
          );
        })}

        {hours.map((hour, rowIndex) => (
          <div key={hour} className="contents">
            <div className="flex items-start bg-page px-2 py-2 font-mono text-[11px] text-body">
              {hourLabel(hour)}
            </div>
            {days.map((day) => {
              const today = isSameDay(day, new Date());
              const dayEvents = eventsFor(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative h-[60px] overflow-hidden",
                    today ? "bg-[rgba(255,253,249,0.55)]" : "bg-[rgba(255,253,249,0.8)]",
                    dayEvents.length > 0 && "p-1.5",
                  )}
                >
                  {today && rowIndex === 0 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -left-[30%] -top-[30px] h-20 w-[160%] opacity-50 blur-[15px]"
                      style={{
                        background:
                          "radial-gradient(50px 32px at 45% 75%, rgba(232,88,61,.7), transparent 72%), radial-gradient(50px 32px at 72% 85%, rgba(224,185,74,.6), transparent 72%)",
                      }}
                    />
                  )}
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => router.push(`/events/${event.id}`)}
                      className="relative h-full w-full rounded-[5px] border-l-2 border-teal px-2 py-1.5 text-left font-sans text-[11.5px] text-ink"
                      style={{
                        background:
                          "linear-gradient(160deg, rgba(63,167,137,.14), rgba(63,167,137,.08))",
                      }}
                    >
                      {eventTimeLabel(event.event_time)} {event.name}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
