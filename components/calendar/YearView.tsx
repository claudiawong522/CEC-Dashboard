"use client";

import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { Sticker } from "@/components/stickers/Sticker";
import { Sparkle } from "@/components/stickers/shapes";
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
    <div className="relative mx-auto w-full max-w-[1040px]">
      <Sticker
        floatVariant="float1"
        floatDuration="17s"
        wrapperClassName="pointer-events-none absolute -top-10 -right-8 z-0"
        className="pointer-events-auto opacity-[0.55]"
      >
        <Sparkle size={72} />
      </Sticker>

      <div className="relative grid grid-cols-4 gap-4">
      {MONTH_LABELS.map((label, i) => {
        const isCurrentMonth = today.getFullYear() === year && today.getMonth() === i;
        const monthEvents = eventsByMonth[i];

        return (
          <div
            key={label}
            className={cn(
              "relative overflow-hidden rounded-[10px] border bg-paper p-5 transition-[transform,border-color] duration-200 ease-brand hover:-translate-y-0.5",
              isCurrentMonth
                ? "border-[rgba(35,32,28,0.18)]"
                : "border-[rgba(35,32,28,0.07)] hover:border-[rgba(35,32,28,0.18)]",
            )}
          >
            {isCurrentMonth && (
              <Sticker
                floatVariant="none"
                wrapperClassName="absolute -right-2 -top-2 z-10"
                className="block size-14 rounded-full opacity-80 blur-[8px]"
              >
                <div
                  aria-hidden="true"
                  className="size-full rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(224,185,74,.8), transparent 72%)",
                  }}
                />
              </Sticker>
            )}
            <div
              className={cn(
                "relative font-mono text-[14px] tracking-[0.1em] uppercase",
                isCurrentMonth ? "font-medium text-ink" : "text-body",
              )}
            >
              {label}
            </div>
            <div className="relative mt-3 flex h-[9px] flex-wrap gap-1.5">
              {monthEvents.map((event) => (
                <span
                  key={event.id}
                  className="size-[9px] shrink-0 rounded-full"
                  style={{ background: SECTION_COLORS[firstPrepSection(event)] }}
                />
              ))}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
