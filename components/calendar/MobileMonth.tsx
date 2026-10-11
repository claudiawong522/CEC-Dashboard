"use client";

import Link from "next/link";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { formatEventTime } from "@/lib/utils/format-event-time";
import type { CalendarEvent } from "./CalendarView";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MAX_SQUARES = 3;

function dayKey(day: Date) {
  return format(day, "yyyy-MM-dd");
}

// A multi-day event shows on every day it spans, the way the desktop grid
// draws it as a bar across them.
function eventsOn(events: CalendarEvent[], day: Date) {
  const key = dayKey(day);
  return events
    .filter((e) => e.event_date <= key && key <= e.event_end_date)
    .sort((a, b) => (a.all_day === b.all_day ? a.event_time.localeCompare(b.event_time) : a.all_day ? -1 : 1));
}

function timeRange(event: CalendarEvent) {
  if (event.all_day) return "All day";
  const start = formatEventTime(event.event_time);
  return event.event_end_time ? `${start} to ${formatEventTime(event.event_end_time)}` : start;
}

/**
 * The month on a phone. FullCalendar's grid needs about 120px a column to
 * show a chip title, a phone has 50, so the grid shrinks to day numbers with
 * a section-colour square per event and the selected day's events read as
 * an agenda underneath. Selection follows the date picker: mint fill inside
 * a 2px black inset. No motion on the cells.
 */
export function MobileMonth({
  events,
  month,
  selectedDay,
  onSelectDay,
}: {
  events: CalendarEvent[];
  month: Date;
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month));
  const gridEnd = endOfWeek(endOfMonth(month));
  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) days.push(d);

  const today = new Date();
  const agenda = eventsOn(events, selectedDay);

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-foreground bg-line">
        <div className="grid grid-cols-7 gap-px border-b border-foreground">
          {WEEKDAYS.map((label, i) => (
            <div key={i} className="t-eyebrow bg-muted py-2 text-center text-[10px] text-foreground">
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px" role="grid" aria-label={format(month, "MMMM yyyy")}>
          {days.map((day) => {
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const selected = isSameDay(day, selectedDay);
            const dayEvents = eventsOn(events, day);
            return (
              <button
                key={dayKey(day)}
                type="button"
                role="gridcell"
                aria-selected={selected}
                aria-label={`${format(day, "EEEE, MMMM d")}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                onClick={() => onSelectDay(day)}
                className={cn(
                  "flex h-14 flex-col items-center justify-between px-0.5 pt-2 pb-2 focus-visible:outline-offset-[-2px]",
                  selected ? "bg-mint" : inMonth ? "bg-background" : "bg-[#fafafa]",
                  (selected || isToday) && "shadow-[inset_0_0_0_2px_var(--black)]",
                )}
              >
                <span
                  className={cn(
                    "font-display text-[13px] leading-none tabular-nums",
                    isToday || selected ? "font-bold text-foreground" : inMonth ? "font-medium text-subtle" : "font-medium text-faded",
                    isToday && !selected && "shadow-[inset_0_-2px_0_var(--mint)]",
                  )}
                >
                  {format(day, "d")}
                </span>
                <span className="flex h-1.5 items-center gap-[3px]" aria-hidden="true">
                  {dayEvents.slice(0, MAX_SQUARES).map((event) => (
                    <span
                      key={event.id}
                      className="size-1.5 shrink-0"
                      style={{ background: SECTION_COLORS[firstPrepSection(event)] }}
                    />
                  ))}
                  {dayEvents.length > MAX_SQUARES && (
                    <span className="size-1.5 shrink-0 border border-foreground/60" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <section aria-live="polite" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="t-eyebrow text-foreground">{format(selectedDay, "EEEE, MMM d")}</h2>
          <span className="t-eyebrow text-foreground/50 tabular-nums">
            {agenda.length} {agenda.length === 1 ? "event" : "events"}
          </span>
        </div>

        {agenda.length === 0 ? (
          <div className="flex flex-col items-start gap-3 border-2 border-dashed border-line px-4 py-4">
            <span className="font-sans text-[14px] leading-[1.6] text-foreground/50">Nothing on this day.</span>
            <Link
              href={`/events/new?date=${dayKey(selectedDay)}`}
              className="link-underline inline-flex min-h-11 items-center font-sans text-[14px] font-medium text-foreground"
            >
              + New event on {format(selectedDay, "MMM d")}
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {agenda.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="flex min-h-11 flex-col gap-1 border border-line border-l-[3px] bg-background px-3.5 py-3 transition-[transform,border-color,box-shadow] duration-300 ease-fluid hover:-translate-y-1 hover:border-foreground hover:shadow-mint"
                  style={{ borderLeftColor: SECTION_COLORS[firstPrepSection(event)] }}
                >
                  <span className="t-eyebrow text-foreground/55 tabular-nums">{timeRange(event)}</span>
                  <span className="font-sans text-[15px] leading-[1.35] font-medium text-foreground">
                    {event.name}
                  </span>
                  {event.venue && (
                    <span className="font-sans text-[13px] text-subtle">{event.venue}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
