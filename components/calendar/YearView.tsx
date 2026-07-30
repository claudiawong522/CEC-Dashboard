"use client";

import { cn } from "@/lib/utils";
import type { CalendarEvent } from "./CalendarView";

// design/CEC Pages.dc.html "02c · year view" — recreated directly (not via
// FullCalendar's multiMonth plugin, which renders full per-month day-grids
// rather than the kit's compact bead-tile layout).
const MONTH_LABELS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function YearView({
  events,
  year,
}: {
  events: CalendarEvent[];
  year: number;
}) {
  const today = new Date();

  const eventsByMonth = MONTH_LABELS.map((_, monthIndex) =>
    events.filter((e) => {
      const [y, m] = e.event_date.split("-").map(Number);
      return y === year && m - 1 === monthIndex;
    }),
  );

  return (
    <div className="grid max-w-[900px] grid-cols-4 gap-3">
      {MONTH_LABELS.map((label, i) => {
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === i;
        const monthEvents = eventsByMonth[i];

        return (
          <div
            key={label}
            className={cn(
              "relative overflow-hidden rounded-[7px] border bg-paper p-3 transition-[transform,border-color] duration-200 ease-brand hover:-translate-y-0.5",
              isCurrentMonth
                ? "border-[rgba(35,32,28,0.18)]"
                : "border-[rgba(35,32,28,0.07)] hover:border-[rgba(35,32,28,0.18)]",
            )}
          >
            {isCurrentMonth && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-2 -top-2 size-11 rounded-full opacity-80 blur-[7px]"
                style={{
                  background: "radial-gradient(circle, rgba(224,185,74,.8), transparent 72%)",
                }}
              />
            )}
            <div
              className={cn(
                "relative font-mono text-[12px] tracking-[0.1em] uppercase",
                isCurrentMonth ? "font-medium text-ink" : "text-body",
              )}
            >
              {label}
            </div>
            <div className="relative mt-2 flex h-[7px] gap-1">
              {monthEvents.map((event) => (
                <span key={event.id} className="size-[7px] shrink-0 rounded-full bg-teal" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
