"use client";

import { useRouter } from "next/navigation";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { formatEventTime } from "@/lib/utils/format-event-time";
import type { CalendarEvent } from "./CalendarView";

// Week view, recreated directly (not via FullCalendar's timeGrid, whose
// default proportions don't match the compact 44px gutter / 52px row grid).
const START_HOUR = 8;
const END_HOUR = 21; // exclusive of the trailing label row

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
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
    <div className="relative overflow-hidden border border-foreground bg-line">
      <div className="grid grid-cols-[44px_repeat(7,1fr)] gap-px">
        <div className="h-[26px] bg-muted" />
        {days.map((day) => {
          const today = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "t-eyebrow h-[26px] bg-muted px-1.5 py-1.5 text-[9px]",
                today ? "text-foreground" : "text-foreground/50",
              )}
            >
              {format(day, "EEE d")}
            </div>
          );
        })}

        {hours.map((hour) => (
          <div key={hour} className="contents">
            <div className="t-eyebrow flex items-start bg-background px-1.5 py-1.5 text-[9px] text-foreground/40">
              {hourLabel(hour)}
            </div>
            {days.map((day) => {
              const today = isSameDay(day, new Date());
              const dayEvents = eventsFor(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "relative h-[52px] overflow-hidden",
                    today ? "bg-muted/30" : "bg-background",
                    dayEvents.length > 0 && "p-1",
                  )}
                >
                  {dayEvents.length > 0 && (
                    <div className="relative flex h-full gap-0.5">
                      {dayEvents.map((event) => {
                        const sectionColor = SECTION_COLORS[firstPrepSection(event)];
                        return (
                          <button
                            key={event.id}
                            type="button"
                            title={event.name}
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="relative flex h-full min-w-0 flex-1 items-baseline gap-1 overflow-hidden border border-line border-l-[3px] bg-background px-1.5 py-1 text-left font-sans text-[9.5px] text-foreground transition-[border-color,box-shadow,transform] duration-200 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm"
                            style={{ borderLeftColor: sectionColor }}
                          >
                            <span className="t-eyebrow shrink-0 text-[9px] tracking-[0.06em] text-subtle">
                              {formatEventTime(event.event_time)}
                            </span>
                            <span className="min-w-0 truncate">{event.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
