"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventDropArg, DatesSetArg, EventMountArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import type FullCalendarType from "@fullcalendar/react";
import { addDays, addYears, format, isSameMonth, startOfWeek, subYears } from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { rescheduleEvent } from "@/lib/actions/events";
import { TriangleScatter } from "@/components/decor/shapes";
import { WeekView } from "./WeekView";
import { YearView } from "./YearView";

// FullCalendar renders directly to the DOM and its date formatting can
// differ slightly between the server render and the client's timezone,
// so loading it client-only avoids hydration mismatches. next/dynamic's
// inferred type drops ref support for class components, so it's cast back
// to the real component type to keep the calendarRef (used to drive our
// custom toolbar) type-checked.
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="h-[732px] w-full animate-pulse border border-line bg-muted/40" />
  ),
}) as unknown as typeof FullCalendarType;

export type CalendarEvent = {
  id: string;
  name: string;
  event_date: string;
  event_end_date: string;
  all_day: boolean;
  event_time: string;
  event_end_time: string | null;
  venue: string;
  is_complete: boolean;
  has_speaker: boolean;
  has_attendees: boolean;
  has_money: boolean;
  has_food: boolean;
  has_marketing: boolean;
  has_media: boolean;
  has_recurring: boolean;
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
  // FullCalendar only exists in the DOM while viewType === "month": it
  // unmounts (and its ref goes stale) the moment you leave month view, so
  // jumping to a specific month from elsewhere (e.g. Year view) can't use
  // calendarRef.current.gotoDate(). Instead it remounts fresh from this
  // date every time you re-enter month view.
  const [monthViewDate, setMonthViewDate] = useState(() => new Date());

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.name,
    allDay: event.all_day,
    start: event.all_day ? event.event_date : `${event.event_date}T${event.event_time}`,
    // FullCalendar's `end` is exclusive for all-day events (needs the day
    // *after* the last day) but inclusive of the actual moment for timed
    // ones: same event_end_date column, two different offsets.
    end: event.all_day
      ? format(addDays(new Date(`${event.event_end_date}T00:00`), 1), "yyyy-MM-dd")
      : `${event.event_end_date}T${event.event_end_time ?? event.event_time}`,
    extendedProps: {
      venue: event.venue,
      isComplete: event.is_complete,
      sectionColor: SECTION_COLORS[firstPrepSection(event)],
    },
  }));

  function handleEventClick(info: EventClickArg) {
    router.push(`/events/${info.event.id}`);
  }

  function handleDateClick(info: DateClickArg) {
    router.push(`/events/new?date=${info.dateStr}`);
  }

  function handleEventDrop(info: EventDropArg) {
    const newDate = info.event.startStr.slice(0, 10);
    rescheduleEvent(info.event.id, newDate).catch(() => {
      toast.error("Couldn't move that event — try again");
      info.revert();
    });
  }

  function handleEventDidMount(info: EventMountArg) {
    const sectionColor = info.event.extendedProps.sectionColor as string | undefined;
    if (sectionColor) info.el.style.setProperty("--event-dot-color", sectionColor);
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
    <div className="flex flex-col gap-6">
      <div className={cn("flex items-center justify-between", viewType === "year" && "mx-auto max-w-[1040px] w-full")}>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" aria-label="Previous" onClick={goPrev}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next" onClick={goNext}>
            <ChevronRight />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        <div
          className={cn(
            "t-display text-foreground",
            viewType === "year" ? "text-[24px]" : "text-[20px]",
          )}
        >
          {title}
        </div>

        {/* Segmented control: a 2px black group, the active segment inverted. */}
        <div className="flex border-2 border-foreground">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setViewType(v.key)}
              className={cn(
                "t-eyebrow px-3 py-2 transition-colors duration-200 ease-fluid",
                viewType === v.key
                  ? "bg-foreground text-background"
                  : "text-foreground/50 hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {viewType === "month" && (
        <div className="relative overflow-hidden bg-background">
          {/* Logo tiles behind the day grid: a day cell's own link always
              wins the click, and each triangle still pops where it peeks
              through. */}
          <TriangleScatter count={5} seed={11} opacity={0.2} className="z-0" />

          <div className="fc-cec relative z-10">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              initialDate={monthViewDate}
              headerToolbar={false}
              datesSet={handleDatesSet}
              height="auto"
              events={fcEvents}
              editable
              eventStartEditable
              eventDurationEditable={false}
              dateClick={handleDateClick}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              eventDidMount={handleEventDidMount}
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short", hour12: true }}
              dayMaxEventRows={3}
            />
          </div>
        </div>
      )}

      {viewType === "week" && <WeekView events={events} currentDate={currentDate} />}
      {viewType === "year" && (
        <YearView
          events={events}
          year={currentDate.getFullYear()}
          onSelectMonth={(monthIndex) => {
            const target = new Date(currentDate.getFullYear(), monthIndex, 1);
            setCurrentDate(target);
            setMonthViewDate(target);
            setViewType("month");
          }}
        />
      )}
    </div>
  );
}
