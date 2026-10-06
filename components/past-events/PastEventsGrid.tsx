"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getEventTerm } from "@/lib/utils/terms";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { Sticker } from "@/components/decor/Sticker";
import { Seal, TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";

export type PastEvent = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  venue: string;
  iconUrl: string | null;
};

export function PastEventsGrid({ events }: { events: PastEvent[] }) {
  const [activeTerm, setActiveTerm] = useState<string | null>(null);

  const terms = Array.from(
    new Map(events.map((e) => [getEventTerm(e.event_date).key, getEventTerm(e.event_date)])).values(),
  ).sort((a, b) => b.key.localeCompare(a.key));

  const visible = activeTerm
    ? events.filter((e) => getEventTerm(e.event_date).key === activeTerm)
    : events;

  return (
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={4} seed={41} opacity={0.2} className="z-0 h-40" />

      <PageHeader
        title="Past Events"
        className="relative z-10"
        actions={
          terms.length > 0 && (
            <div className="flex gap-2">
              {terms.map((term) => (
                <Sticker
                  key={term.key}
                  floatVariant="none"
                  onClick={() => setActiveTerm((prev) => (prev === term.key ? null : term.key))}
                >
                  <Seal
                    label={term.key}
                    size={36}
                    color={term.season === "Fall" ? "var(--coral)" : "var(--teal)"}
                    active={activeTerm === term.key}
                  />
                </Sticker>
              ))}
            </div>
          )
        }
      />

      {visible.length === 0 ? (
        <p className="relative z-10 font-sans text-[14px] text-foreground/50">No completed past events yet.</p>
      ) : (
        <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
              className="group flex flex-col overflow-hidden border border-line bg-background shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid animate-riseIn hover:-translate-y-1 hover:border-foreground hover:shadow-mint"
            >
              <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden border-b border-line bg-muted/40">
                {event.iconUrl && (
                  <Image
                    src={event.iconUrl}
                    alt={event.name}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[380ms] ease-fluid group-hover:scale-[1.04]"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5 p-4">
                <span className="truncate font-display text-[15px] font-bold text-foreground">
                  {event.name}
                </span>
                <span className="truncate font-sans text-[12.5px] text-subtle">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                  {event.event_end_time ? `–${formatEventTime(event.event_end_time)}` : ""}
                </span>
                <span className="truncate font-sans text-[11.5px] text-foreground/50">{event.venue}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
