"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, DatesSetArg, EventMountArg } from "@fullcalendar/core";
import type FullCalendarType from "@fullcalendar/react";
import { addDays, addYears, format, isSameMonth, startOfWeek, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { firstPrepSection, SECTION_COLORS } from "@/lib/utils/section-colors";
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

type StickerKey = "s8" | "s9" | "s10";

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendarType>(null);
  const [monthTitle, setMonthTitle] = useState("");
  const [viewType, setViewType] = useState<ViewKey>("month");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [pops, setPops] = useState<Record<StickerKey, number>>({ s8: 0, s9: 0, s10: 0 });
  function pop(key: StickerKey) {
    setPops((prev) => ({ ...prev, [key]: prev[key] + 1 }));
  }

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.name,
    start: `${event.event_date}T${event.event_time}`,
    end: event.event_end_time ? `${event.event_date}T${event.event_end_time}` : undefined,
    extendedProps: {
      venue: event.venue,
      isComplete: event.is_complete,
      sectionColor: SECTION_COLORS[firstPrepSection(event)],
    },
  }));

  function handleEventClick(info: EventClickArg) {
    router.push(`/events/${info.event.id}`);
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
          {/* S8-S10 — ambient stickers, above the grid; each pops on its own click */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
            <div
              className="absolute left-[2.5%] bottom-[14%]"
              style={{ animation: "float1 15s ease-in-out infinite" }}
            >
              <div
                key={pops.s8}
                onClick={() => pop("s8")}
                className={cn(
                  "relative size-[52px] cursor-pointer pointer-events-auto opacity-50",
                  pops.s8 > 0 && "animate-pop"
                )}
              >
                {[0, 90, 180, 270].map((deg) => (
                  <div
                    key={deg}
                    className="absolute top-[1px] left-[16px] h-[29px] w-[20px] rounded-full blur-[6px]"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 64%, var(--teal), rgba(63,167,137,.25) 60%, transparent 76%)",
                      transformOrigin: "50% 96%",
                      transform: `rotate(${deg}deg)`,
                    }}
                  />
                ))}
                <div
                  className="absolute top-[22px] left-[22px] size-2 rounded-full blur-[2px]"
                  style={{ background: "var(--amber)" }}
                />
              </div>
            </div>

            <div
              className="absolute right-[3%] top-[26%]"
              style={{ animation: "float2 18s ease-in-out infinite" }}
            >
              <div
                key={pops.s9}
                onClick={() => pop("s9")}
                className={cn(
                  "size-[26px] cursor-pointer pointer-events-auto opacity-[.42]",
                  pops.s9 > 0 && "animate-pop"
                )}
                style={{
                  background: "linear-gradient(140deg, var(--amber), var(--coral))",
                  clipPath:
                    "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 92%,50% 70%,21% 92%,32% 57%,2% 35%,39% 35%)",
                }}
              />
            </div>

            <div
              className="absolute left-[34%] bottom-[3%]"
              style={{ animation: "float3 16s ease-in-out infinite", animationDelay: "1.2s" }}
            >
              <div
                key={pops.s10}
                onClick={() => pop("s10")}
                className={cn(
                  "relative size-[30px] cursor-pointer pointer-events-auto opacity-45",
                  pops.s10 > 0 && "animate-pop"
                )}
              >
                <div
                  className="absolute top-[1px] left-[5px] h-[27px] w-[19px]"
                  style={{
                    background: "var(--blue)",
                    clipPath: "polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)",
                    animation: "twinkle 3s ease-in-out infinite",
                  }}
                />
              </div>
            </div>
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
              headerToolbar={false}
              datesSet={handleDatesSet}
              height="auto"
              events={fcEvents}
              eventClick={handleEventClick}
              eventDidMount={handleEventDidMount}
              eventDisplay="list-item"
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
