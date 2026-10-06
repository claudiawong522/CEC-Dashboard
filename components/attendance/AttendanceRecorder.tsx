"use client";

import { useMemo, useState, useTransition } from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recordAttendance } from "@/lib/actions/attendance";
import {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  type AttendanceEventType,
} from "@/lib/validation/club-schemas";
import type { ChatPerson } from "@/lib/types/coffee-chats";
import { cn } from "@/lib/utils";

const NO_EVENT = "__none__";

export type EventOption = { id: string; name: string; event_date: string };

export function AttendanceRecorder({
  events,
  members,
  alreadyRecorded,
}: {
  events: EventOption[];
  members: ChatPerson[];
  // profile ids already recorded against the currently selected event, so a
  // second pass for latecomers shows who is already in rather than relying on
  // whoever is holding the laptop to remember.
  alreadyRecorded: Record<string, string[]>;
}) {
  const [eventId, setEventId] = useState(NO_EVENT);
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<AttendanceEventType>("startup_hours");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const recorded = useMemo(
    () => new Set(eventId === NO_EVENT ? [] : (alreadyRecorded[eventId] ?? [])),
    [eventId, alreadyRecorded],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      (member.full_name ?? member.email).toLowerCase().includes(term),
    );
  }, [members, query]);

  const resolvedName =
    eventId === NO_EVENT ? eventName : (events.find((e) => e.id === eventId)?.name ?? "");

  function toggle(profileId: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  }

  function submit() {
    startTransition(async () => {
      const result = await recordAttendance({
        eventId: eventId === NO_EVENT ? null : eventId,
        eventName: resolvedName,
        eventType,
        profileIds: Array.from(selected),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSelected(new Set());
      toast.success(result.message ?? "Recorded");
    });
  }

  const eventItems = {
    [NO_EVENT]: "Not on the calendar",
    ...Object.fromEntries(events.map((event) => [event.id, event.name])),
  };

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-4 shadow-soft">
      <span className="t-eyebrow text-foreground/50">
        take attendance
      </span>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Event</Label>
          {/* `items` is what makes <SelectValue /> show the label rather than
              the raw value. Without it the trigger reads "__none__" and
              "startup_hours" at people. */}
          <Select
            items={eventItems}
            value={eventId}
            onValueChange={(value) => setEventId(value ?? NO_EVENT)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[260px]">
              <SelectItem value={NO_EVENT}>
                Not on the calendar
              </SelectItem>
              {events.map((event) => (
                <SelectItem
                  key={event.id}
                  value={event.id}
                 
                >
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {eventId === NO_EVENT && (
          <div className="flex flex-col gap-1.5">
            <Label>What was it?</Label>
            <Input
              value={eventName}
              placeholder="Thursday work session"
              onChange={(event) => setEventName(event.target.value)}
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label>Kind</Label>
          <Select
            items={EVENT_TYPE_LABELS}
            value={eventType}
            onValueChange={(value) => setEventType((value ?? "other") as AttendanceEventType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                 
                >
                  {EVENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/50" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find someone"
          className="w-full border border-line bg-background py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visible.map((member) => {
          const already = recorded.has(member.id);
          const active = selected.has(member.id);
          return (
            <button
              key={member.id}
              type="button"
              disabled={already}
              onClick={() => toggle(member.id)}
              className={cn(
                "t-eyebrow border px-2 py-1 transition-[background-color,border-color,color] duration-200 ease-fluid",
                already
                  ? "cursor-default border-line bg-mint/20 text-foreground/50"
                  : active
                    ? "border-foreground bg-mint text-foreground"
                    : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground",
              )}
            >
              {member.full_name ?? member.email}
              {already && " ·  in"}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="font-sans text-[11.5px] text-foreground/50">
          {selected.size} selected
          {recorded.size > 0 && ` · ${recorded.size} already recorded`}
        </span>
        <Button
          type="button"
          disabled={isPending || selected.size === 0 || !resolvedName}
          onClick={submit}
        >
          {isPending ? "Recording" : "Record"}
        </Button>
      </div>
    </div>
  );
}
