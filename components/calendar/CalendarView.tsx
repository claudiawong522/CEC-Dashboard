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
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
import { rescheduleEvent } from "@/lib/actions/events";
import { Sticker } from "@/components/stickers/Sticker";
import { Heart, Cherries, Flower, StarPolygon, TwinkleDiamondPair } from "@/components/stickers/shapes";
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
  loading: () => (
    <div className="h-[732px] w-full animate-pulse rounded-[10px] bg-stone-100" />
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
  // FullCalendar only exists in the DOM while viewType === "month" — it
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
    // ones — same event_end_date column, two different offsets.
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
    <div className="flex flex-col gap-[18px]">
      <div className={cn("flex items-center justify-between", viewType === "year" && "mx-auto max-w-[1040px] w-full")}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={goPrev}
            className={cn(
              "flex items-center justify-center rounded-input border border-line-input bg-paper font-sans text-body transition-colors duration-200 hover:bg-wash hover:text-ink",
              viewType === "year" ? "size-[38px] text-[16px]" : "size-[31px] text-[13px]",
            )}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={goNext}
            className={cn(
              "flex items-center justify-center rounded-input border border-line-input bg-paper font-sans text-body transition-colors duration-200 hover:bg-wash hover:text-ink",
              viewType === "year" ? "size-[38px] text-[16px]" : "size-[31px] text-[13px]",
            )}
          >
            ›
          </button>
          <button
            type="button"
            onClick={goToday}
            className={cn(
              "rounded-input border border-line-input bg-paper font-sans text-body transition-colors duration-200 hover:bg-wash hover:text-ink",
              viewType === "year" ? "px-[16px] py-[9px] text-[14px]" : "px-[13px] py-[7px] text-[12.5px]",
            )}
          >
            Today
          </button>
        </div>

        <div
          className={cn(
            "font-sans tracking-[-0.012em] text-ink",
            viewType === "year" ? "text-[22px]" : "text-[18px]",
          )}
        >
          {title}
        </div>

        <div className="flex overflow-hidden rounded-input border border-line-input bg-paper">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setViewType(v.key)}
              className={cn(
                "font-mono tracking-[0.12em] uppercase transition-colors duration-200",
                viewType === "year" ? "px-[16px] py-[10px] text-[11px]" : "px-[13px] py-2 text-[10px]",
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
          {/* S8-S10 + Heart/Cherries — ambient stickers, behind the day grid (per
              BRAND_KIT.md's decorative-stickers-behind-opaque-content rule) so a
              day cell's own link always wins the click over a sticker sitting on
              top of it; each still pops on its own click where it peeks through. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
            <Sticker
              floatVariant="float1"
              floatDuration="15s"
              wrapperClassName="absolute left-[1%] bottom-[10%]"
              className="pointer-events-auto opacity-[0.75]"
            >
              <Flower size={92} petal="var(--teal)" center="var(--amber)" />
            </Sticker>

            <Sticker
              floatVariant="float2"
              floatDuration="18s"
              wrapperClassName="absolute right-[1%] top-[20%]"
              className="pointer-events-auto opacity-[0.7]"
            >
              <StarPolygon size={54} />
            </Sticker>

            <Sticker
              floatVariant="float3"
              floatDuration="16s"
              floatDelay="1.2s"
              wrapperClassName="absolute left-[30%] bottom-[-2%]"
              className="pointer-events-auto opacity-[0.7]"
            >
              <TwinkleDiamondPair size={62} />
            </Sticker>

            <Sticker
              floatVariant="float1"
              floatDuration="14s"
              floatDelay="2.4s"
              wrapperClassName="absolute left-[13%] top-[4%]"
              className="pointer-events-auto opacity-[0.65]"
            >
              <Heart size={48} />
            </Sticker>

            <Sticker
              floatVariant="float3"
              floatDuration="19s"
              floatDelay="0.6s"
              wrapperClassName="absolute right-[18%] bottom-[2%]"
              className="pointer-events-auto opacity-[0.65]"
            >
              <Cherries size={46} />
            </Sticker>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 opacity-45">
            <div
              className="absolute top-[22%] left-[5%] size-[150px] rounded-full blur-[32px]"
              style={{
                background: "radial-gradient(circle, rgba(232,88,61,.5), transparent 72%)",
              }}
            />
            <div
              className="absolute top-[56%] left-[46%] size-[190px] rounded-full blur-[38px]"
              style={{
                background: "radial-gradient(circle, rgba(63,167,137,.45), transparent 72%)",
              }}
            />
            <div
              className="absolute top-[6%] right-[6%] size-[170px] rounded-full blur-[34px]"
              style={{
                background: "radial-gradient(circle, rgba(59,111,194,.4), transparent 72%)",
              }}
            />
            <div
              className="absolute right-[28%] bottom-[-8%] size-[160px] rounded-full blur-[32px]"
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
