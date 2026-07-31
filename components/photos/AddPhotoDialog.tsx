"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatEventDate } from "@/lib/utils/format-event-time";
import { cn } from "@/lib/utils";

type EventOption = { id: string; name: string; event_date: string };

export function AddPhotoDialog({
  events,
  className,
  children,
}: {
  events: EventOption[];
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter((e) => e.name.toLowerCase().includes(q));
  }, [events, query]);

  function goToEvent(eventId: string) {
    setOpen(false);
    router.push(`/events/${eventId}?tab=media`);
  }

  function goToNewEvent() {
    setOpen(false);
    router.push("/events/new?media=1");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <DialogTrigger className={className}>{children}</DialogTrigger>
      <DialogContent className="rounded-card border border-line bg-paper p-4 ring-0 sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[15px] font-medium text-ink">
            Add a photo
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-faint">
          Photos live under an event&apos;s Media tab — pick the event this belongs to, or start a
          new one.
        </p>
        <Input
          autoFocus
          placeholder="Search events…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 font-sans text-[12px] text-faint">
              No events match “{query}”.
            </p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => goToEvent(e.id)}
                className="flex items-center justify-between gap-3 rounded-btn px-2.5 py-2 text-left transition-colors duration-150 hover:bg-wash"
              >
                <span className="truncate font-sans text-[13px] text-ink">{e.name}</span>
                <span className="shrink-0 font-mono text-[10px] text-faint">
                  {formatEventDate(e.event_date)}
                </span>
              </button>
            ))
          )}
        </div>
        <button
          type="button"
          onClick={goToNewEvent}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-btn border border-dashed border-[rgba(35,32,28,0.16)] px-2.5 py-2.5 font-sans text-[13px] text-body transition-colors duration-150",
            "hover:bg-wash hover:text-ink",
          )}
        >
          + Create a new event
        </button>
      </DialogContent>
    </Dialog>
  );
}
