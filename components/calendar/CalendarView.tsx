"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg } from "@fullcalendar/core";
import type FullCalendarType from "@fullcalendar/react";
import { addDays, addYears, format, isSameMonth, startOfWeek, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { WeekView } from "./WeekView";
import { YearView } from "./YearView";

// FullCalendar renders directly to the DOM and its date formatting can
// differ slightly between the server render and the client's timezone —
// loading it client-only avoids hydration mismatches. next/dynamic's
// inferred type drops ref support for class components, so it's cast back
// to the real component type to keep the calendarRef (used to drive our
// custom toolbar) type-checked.
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
}) as unknown as typeof FullCalendarType;

export type CalendarEvent = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  venue: string;
  is_complete: boolean;
};

type ViewKey = "month" | "week" | "year";
const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "month", label: "month" },
  { key: "week", label: "week" },
  { key: "year", label: "year" },
];

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendarType>(null);
  const [monthTitle, setMonthTitle] = useState("");
  const [viewType, setViewType] = useState<ViewKey>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.name,
    start: `${event.event_date}T${event.event_time}`,
    end: event.event_end_time ? `${event.event_date}T${event.event_end_time}` : undefined,
    extendedProps: { venue: event.venue, isComplete: event.is_complete },
  }));

  function handleEventClick(info: EventClickArg) {
    router.push(`/events/${info.event.id}`);
  }

  function handleDatesSet(arg: DatesSetArg) {
    setMonthTitle(arg.view.title);
  }

  function goPrev() {
    if (viewType === "month") calendarRef.current?.getApi().prev();
    else if (viewType === "week") setCurrentDate((d) => addDays(d, -7));
    else setCurrentDate((d) => subYears(d, 1));
  }

  function goNext() {
    if (viewType === "month") calendarRef.current?.getApi().next();
    else if (viewType === "week") setCurrentDate((d) => addDays(d, 7));
    else setCurrentDate((d) => addYears(d, 1));
  }

  function goToday() {
    if (viewType === "month") calendarRef.current?.getApi().today();
    setCurrentDate(new Date());
  }

  const weekStart = startOfWeek(currentDate);
  const weekEnd = addDays(weekStart, 6);
  const weekTitle = isSameMonth(weekStart, weekEnd)
    ? `${format(weekStart, "MMM d")} — ${format(weekEnd, "d")}`
    : `${format(weekStart, "MMM d")} — ${format(weekEnd, "MMM d")}`;

  const title =
    viewType === "month" ? monthTitle : viewType === "week" ? weekTitle : format(currentDate, "yyyy");

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className="flex size-[31px] items-center justify-center rounded-input border border-line-input bg-paper font-sans text-[13px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className="flex size-[31px] items-center justify-center rounded-input border border-line-input bg-paper font-sans text-[13px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink"
          >
            ›
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-input border border-line-input bg-paper px-[13px] py-[7px] font-sans text-[12.5px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink"
          >
            Today
          </button>
        </div>

        <div className="font-sans text-[17px] tracking-[-0.012em] text-ink">
          {title}
        </div>

        <div className="flex overflow-hidden rounded-input border border-line-input bg-paper">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setViewType(v.key)}
              className={cn(
                "px-[13px] py-2 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors duration-200",
                viewType === v.key
                  ? "bg-ink text-page"
                  : "text-faint hover:bg-wash hover:text-ink",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {viewType === "month" && (
        <div className="relative overflow-hidden rounded-[10px] border border-line bg-page">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-45"
          >
            <div
              className="absolute top-[8%] left-[3%] size-[150px] rounded-full blur-[32px]"
              style={{
                background: "radial-gradient(circle, rgba(232,88,61,.5), transparent 72%)",
              }}
            />
            <div
              className="absolute top-[40%] left-[42%] size-[190px] rounded-full blur-[38px]"
              style={{
                background: "radial-gradient(circle, rgba(63,167,137,.45), transparent 72%)",
              }}
            />
            <div
              className="absolute top-[3%] right-[4%] size-[170px] rounded-full blur-[34px]"
              style={{
                background: "radial-gradient(circle, rgba(59,111,194,.4), transparent 72%)",
              }}
            />
            <div
              className="absolute right-[16%] bottom-[-6%] size-[160px] rounded-full blur-[32px]"
              style={{
                background: "radial-gradient(circle, rgba(224,185,74,.5), transparent 72%)",
              }}
            />
          </div>

          <div className="fc-cec relative z-10">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              datesSet={handleDatesSet}
              height="auto"
              events={fcEvents}
              eventClick={handleEventClick}
              eventDisplay="block"
              dayMaxEventRows={3}
            />
          </div>
        </div>
      )}

      {viewType === "week" && <WeekView events={events} currentDate={currentDate} />}
      {viewType === "year" && <YearView events={events} year={currentDate.getFullYear()} />}
    </div>
  );
}
