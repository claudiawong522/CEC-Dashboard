"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { formatEventTime } from "@/lib/utils/format-event-time";
import type { CalendarEvent } from "./CalendarView";

// Week view, recreated directly (not via FullCalendar's timeGrid, whose
// default proportions don't match the compact 44px gutter / 52px row grid).
// Rows run 7am to 11pm. An event that starts earlier or later is never
// dropped: it sits in the first or last row with a small chevron saying
// which way it spilled, and its real start time on the chip.
const START_HOUR = 7;
const END_HOUR = 23; // exclusive: the last row is 10p, covering 10 to 11pm

function hourLabel(hour: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
}

function rowFor(eventHour: number) {
  return Math.min(Math.max(eventHour, START_HOUR), END_HOUR - 1);
}

export function WeekView({
  events,
  currentDate,
}: {
  events: CalendarEvent[];
  currentDate: Date;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );
  const todayIndex = days.findIndex((d) => isSameDay(d, new Date()));
  const weekKey = weekStart.getTime();

  // On a phone the week is wider than the screen and scrolls sideways under
  // a sticky hour gutter; open it with today's column in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const col = (el.scrollWidth - 44) / 7;
    el.scrollLeft = todayIndex > 0 ? Math.max(0, col * (todayIndex - 0.5)) : 0;
  }, [todayIndex, weekKey]);

  function eventsFor(day: Date, hour: number) {
    return events
      .filter((e) => {
        const [y, m, d] = e.event_date.split("-").map(Number);
        const eventDate = new Date(y, m - 1, d);
        const eventHour = Number(e.event_time.split(":")[0]);
        return isSameDay(eventDate, day) && rowFor(eventHour) === hour;
      })
      .sort((a, b) => a.event_time.localeCompare(b.event_time));
  }

  return (
    <div
      ref={scrollRef}
      className="relative overflow-x-auto overscroll-x-contain border border-foreground bg-line"
    >
      <div className="grid min-w-[640px] grid-cols-[44px_repeat(7,1fr)] gap-px md:min-w-0">
        <div className="sticky left-0 z-20 h-[26px] bg-muted" />
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
            <div className="t-eyebrow sticky left-0 z-20 flex items-start bg-background px-1.5 py-1.5 text-[9px] text-foreground/40">
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
                    // Opaque muted/30: the grid draws its hairlines with a bg-line gap, so a
                    // translucent fill would let that grey through.
                    today ? "bg-[color-mix(in_srgb,var(--muted)_30%,var(--white))]" : "bg-background",
                    dayEvents.length > 0 && "p-1",
                  )}
                >
                  {dayEvents.length > 0 && (
                    <div className="relative flex h-full gap-0.5">
                      {dayEvents.map((event) => {
                        const sectionColor = SECTION_COLORS[firstPrepSection(event)];
                        const eventHour = Number(event.event_time.split(":")[0]);
                        const before = eventHour < START_HOUR;
                        const after = eventHour >= END_HOUR;
                        const Spill = before ? ChevronUp : ChevronDown;
                        return (
                          <button
                            key={event.id}
                            type="button"
                            title={
                              before
                                ? `${event.name} (starts before 7am)`
                                : after
                                  ? `${event.name} (starts at 11pm or later)`
                                  : event.name
                            }
                            onClick={() => router.push(`/events/${event.id}`)}
                            className="relative flex h-full min-w-0 flex-1 flex-col items-start gap-0.5 overflow-hidden md:flex-row md:items-baseline md:gap-1 border border-line border-l-[3px] bg-background px-1.5 py-1 text-left font-sans text-[9.5px] leading-[1.25] text-foreground transition-[border-color,box-shadow,transform] duration-200 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm focus-visible:outline-offset-[-2px]"
                            style={{ borderLeftColor: sectionColor }}
                          >
                            <span className="t-eyebrow flex shrink-0 items-center gap-0.5 text-[9px] tracking-[0.06em] text-subtle">
                              {(before || after) && (
                                <Spill aria-hidden="true" className="size-2.5 shrink-0 text-foreground" strokeWidth={3} />
                              )}
                              {formatEventTime(event.event_time)}
                            </span>
                            <span className="line-clamp-2 min-w-0 [overflow-wrap:anywhere] md:line-clamp-1">{event.name}</span>
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
