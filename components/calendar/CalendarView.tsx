"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg } from "@fullcalendar/core";

// FullCalendar renders directly to the DOM and its date formatting can
// differ slightly between the server render and the client's timezone —
// loading it client-only avoids hydration mismatches.
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
});

export type CalendarEvent = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  venue: string;
  is_complete: boolean;
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();

  const fcEvents = events.map((event) => ({
    id: event.id,
    title: event.name,
    start: `${event.event_date}T${event.event_time}`,
    extendedProps: { venue: event.venue, isComplete: event.is_complete },
  }));

  function handleEventClick(info: EventClickArg) {
    router.push(`/events/${info.event.id}`);
  }

  return (
    <div className="fc-cec">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,multiMonthYear",
        }}
        buttonText={{
          today: "Today",
          month: "Month",
          week: "Week",
          year: "Year",
        }}
        height="auto"
        events={fcEvents}
        eventClick={handleEventClick}
        eventDisplay="block"
        dayMaxEventRows={3}
      />
    </div>
  );
}
