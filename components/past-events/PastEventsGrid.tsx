"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getEventTerm } from "@/lib/utils/terms";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { Sticker } from "@/components/stickers/Sticker";
import { Seal, Flower } from "@/components/stickers/shapes";

export type PastEvent = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
  venue: string;
  portraitUrl: string | null;
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
    <div className="relative flex flex-col gap-[17px]">
      <Sticker
        floatVariant="float1"
        floatDuration="16s"
        wrapperClassName="pointer-events-none absolute -top-8 left-[36%] z-0"
        className="pointer-events-auto opacity-[0.4]"
      >
        <Flower size={110} />
      </Sticker>

      <div className="relative z-10 flex items-baseline justify-between">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Past Events
        </h1>
        {terms.length > 0 && (
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
        )}
      </div>

      {visible.length === 0 ? (
        <p className="font-sans text-[14px] text-faint">No completed past events yet.</p>
      ) : (
        <div className="relative z-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
              className="flex items-center gap-[13px] rounded-[10px] border border-[rgba(35,32,28,0.09)] bg-paper p-3.5 transition-[transform,border-color] duration-200 ease-brand animate-riseIn hover:-translate-y-0.5 hover:border-[rgba(35,32,28,0.2)]"
            >
              {event.portraitUrl ? (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={event.portraitUrl}
                    alt={event.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="size-12 shrink-0 rounded-full bg-portrait-placeholder" />
              )}
              <div className="flex flex-col gap-[3px] overflow-hidden">
                <span className="truncate font-sans text-[13.5px] font-medium text-ink">
                  {event.name}
                </span>
                <span className="truncate font-sans text-[11.5px] text-body">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                  {event.event_end_time ? `–${formatEventTime(event.event_end_time)}` : ""}
                </span>
                <span className="truncate font-sans text-[11px] text-faint">{event.venue}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
