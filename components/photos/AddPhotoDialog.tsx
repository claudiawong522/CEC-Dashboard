"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add a photo</DialogTitle>
          <DialogDescription>
            Photos live under an event&apos;s Media tab. Pick the event this belongs to, or start a
            new one.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search events…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex max-h-[240px] flex-col gap-0.5 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-2.5 py-3 font-sans text-[12px] text-foreground/50">
              No events match “{query}”.
            </p>
          ) : (
            filtered.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => goToEvent(e.id)}
                className="flex items-center justify-between gap-3 px-2.5 py-2 text-left max-md:min-h-11 transition-colors duration-150 ease-fluid hover:bg-muted/40"
              >
                <span className="truncate font-sans text-[13px] text-foreground">{e.name}</span>
                <span className="t-eyebrow shrink-0 text-foreground/50">
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
            "flex items-center justify-center gap-1.5 border-2 border-dashed border-line px-2.5 py-2.5 max-md:min-h-11 font-sans text-[13px] text-subtle transition-colors duration-150 ease-fluid",
            "hover:border-foreground hover:bg-mint/10 hover:text-foreground",
          )}
        >
          + Create a new event
        </button>
      </DialogContent>
    </Dialog>
  );
}
