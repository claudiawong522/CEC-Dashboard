"use client";

import { useState, useTransition } from "react";
import { Trash2Icon, UndoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addSlots, closeCycle, createCycle, deleteSlot, releaseSlot } from "@/lib/actions/interviews";
import { formatSlot } from "@/lib/validation/interview-schemas";

export type Cycle = { id: string; name: string; approved_netids: string[]; is_active: boolean };
export type Slot = {
  id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  applicant_netid: string | null;
  is_claimed: boolean;
  interviewer: { full_name: string | null; email: string } | null;
};

export function InterviewAdmin({ cycle, slots }: { cycle: Cycle | null; slots: Slot[] }) {
  const [name, setName] = useState("");
  const [netids, setNetids] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [count, setCount] = useState("6");
  const [location, setLocation] = useState("");
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; message?: string }>, onOk?: () => void) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done");
      onOk?.();
    });
  }

  if (!cycle) {
    return (
      <div className="flex flex-col gap-4 border border-line bg-background p-4 shadow-soft">
        <span className="t-eyebrow text-foreground/50">
          open a cycle
        </span>
        <div className="flex flex-col gap-1.5">
          <Label>Name</Label>
          <Input
            value={name}
            placeholder="Fall 2026 recruitment"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Who got through</Label>
          <Textarea
            value={netids}
            placeholder="Paste netids or Cornell emails straight from the spreadsheet — commas, spaces or newlines all work."
            onChange={(event) => setNetids(event.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() => createCycle({ name, approvedNetids: netids }), () => {
              setName("");
              setNetids("");
            })
          }
          className="w-fit"
        >
          {isPending ? "Opening" : "Open cycle"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border border-line bg-background p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <span className="t-eyebrow text-foreground/50">
            {cycle.name} · {cycle.approved_netids.length} approved
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => closeCycle(cycle.id))}
            className="link-underline font-sans text-[12px] text-foreground/50 transition-colors duration-200 hover:text-red disabled:pointer-events-none"
          >
            Close cycle
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>First slot</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Minutes</Label>
            <Input
              value={duration}
              inputMode="numeric"
              onChange={(event) => setDuration(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>How many</Label>
            <Input
              value={count}
              inputMode="numeric"
              onChange={(event) => setCount(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Where</Label>
            <Input
              value={location}
              placeholder="Uris G01"
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
        </div>

        <Button
          type="button"
          disabled={isPending || !date || !startTime}
          onClick={() =>
            run(() =>
              addSlots({
                cycleId: cycle.id,
                date,
                startTime,
                durationMinutes: duration,
                count,
                location,
                interviewerId: null,
              }),
            )
          }
          className="w-fit"
        >
          {isPending ? "Adding" : "Add back-to-back slots"}
        </Button>
        <span className="font-sans text-[11.5px] text-foreground/50">
          Interviews run in blocks: one person sits down and takes several in a row. You&rsquo;re
          the interviewer unless someone else is assigned later.
        </span>
      </div>

      {slots.length > 0 && (
        <div className="overflow-hidden border border-line bg-background shadow-soft">
          <div className="t-eyebrow grid grid-cols-[1.6fr_1fr_1fr_auto] gap-3 border-b border-line bg-muted/40 px-4 py-2.5 text-foreground/50">
            <span>when</span>
            <span>where</span>
            <span>who</span>
            <span />
          </div>
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              className={`grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-3 px-4 py-3 transition-colors duration-200 hover:bg-muted/40 ${
                index < slots.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <span className="truncate font-sans text-[12.5px] text-foreground">
                {formatSlot(slot.start_time, slot.end_time)}
              </span>
              <span className="truncate font-sans text-[12px] text-subtle">
                {slot.location ?? "—"}
              </span>
              <span className="t-eyebrow truncate text-foreground">
                {slot.applicant_netid ?? (
                  <span className="font-sans text-[12px] text-foreground/50">open</span>
                )}
              </span>
              <span className="flex justify-end gap-1">
                {slot.is_claimed ? (
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label="Release this slot"
                    title="Release this slot"
                    onClick={() => run(() => releaseSlot(slot.id))}
                    className="p-1 text-foreground/50 transition-colors duration-200 hover:text-foreground disabled:pointer-events-none"
                  >
                    <UndoIcon className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label="Delete this slot"
                    onClick={() => run(() => deleteSlot(slot.id))}
                    className="p-1 text-foreground/50 transition-colors duration-200 hover:text-red disabled:pointer-events-none"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
