"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import type { CalendarEvent } from "./CalendarView";

// Year view, recreated directly (not via FullCalendar's multiMonth plugin,
// which renders full per-month day-grids rather than the compact bead-tile
// layout).
const MONTH_LABELS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

export function YearView({
  events,
  year,
  onSelectMonth,
}: {
  events: CalendarEvent[];
  year: number;
  onSelectMonth: (monthIndex: number) => void;
}) {
  const router = useRouter();
  const today = new Date();

  const eventsByMonth = MONTH_LABELS.map((_, monthIndex) =>
    events.filter((e) => {
      const [y, m] = e.event_date.split("-").map(Number);
      return y === year && m - 1 === monthIndex;
    }),
  );

  return (
    <div className="relative mx-auto w-full max-w-[1040px]">
      <div className="relative grid grid-cols-4 gap-4">
      {MONTH_LABELS.map((label, i) => {
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === i;
        const monthEvents = eventsByMonth[i];

        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelectMonth(i)}
            className={cn(
              "relative overflow-hidden bg-background p-5 text-left transition-[transform,border-color,box-shadow] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm",
              isCurrentMonth ? "border-2 border-foreground" : "border border-line",
            )}
          >
            <div
              className={cn(
                "t-eyebrow relative text-[14px]",
                isCurrentMonth ? "font-bold text-foreground" : "text-subtle",
              )}
            >
              {label}
            </div>
            <div className="relative mt-3 flex h-[9px] flex-wrap gap-1.5">
              {monthEvents.map((event) => (
                <span
                  key={event.id}
                  role="button"
                  title={event.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/events/${event.id}`);
                  }}
                  className="size-1.5 shrink-0 transition-transform duration-150 hover:scale-125"
                  style={{ background: SECTION_COLORS[firstPrepSection(event)] }}
                />
              ))}
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
}
