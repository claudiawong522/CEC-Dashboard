"use client";

import { useState, useTransition } from "react";
import { Trash2Icon, UndoIcon } from "lucide-react";
import { toast } from "sonner";
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
      <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper p-[15px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          open a cycle
        </span>
        <div className="flex flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Name</Label>
          <Input
            value={name}
            placeholder="Fall 2026 recruitment"
            onChange={(event) => setName(event.target.value)}
            className="bg-page"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Who got through</Label>
          <Textarea
            value={netids}
            placeholder="Paste netids or Cornell emails straight from the spreadsheet — commas, spaces or newlines all work."
            onChange={(event) => setNetids(event.target.value)}
            className="bg-page"
          />
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(() => createCycle({ name, approvedNetids: netids }), () => {
              setName("");
              setNetids("");
            })
          }
          className="w-fit rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Opening" : "Open cycle"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper p-[15px]">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            {cycle.name} · {cycle.approved_netids.length} approved
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => closeCycle(cycle.id))}
            className="font-sans text-[12px] text-faint transition-colors duration-200 hover:text-destructive disabled:pointer-events-none"
          >
            Close cycle
          </button>
        </div>

        <div className="grid gap-[15px] sm:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">First slot</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Minutes</Label>
            <Input
              value={duration}
              inputMode="numeric"
              onChange={(event) => setDuration(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">How many</Label>
            <Input
              value={count}
              inputMode="numeric"
              onChange={(event) => setCount(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Where</Label>
            <Input
              value={location}
              placeholder="Uris G01"
              onChange={(event) => setLocation(event.target.value)}
              className="bg-page"
            />
          </div>
        </div>

        <button
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
          className="w-fit rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Adding" : "Add back-to-back slots"}
        </button>
        <span className="font-sans text-[11.5px] text-faint">
          Interviews run in blocks: one person sits down and takes several in a row. You&rsquo;re
          the interviewer unless someone else is assigned later.
        </span>
      </div>

      {slots.length > 0 && (
        <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-3 border-b border-[rgba(0,0,0,0.08)] px-[15px] py-2.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            <span>when</span>
            <span>where</span>
            <span>who</span>
            <span />
          </div>
          {slots.map((slot, index) => (
            <div
              key={slot.id}
              className={`grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-3 px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
                index < slots.length - 1 ? "border-b border-[rgba(0,0,0,0.07)]" : ""
              }`}
            >
              <span className="truncate font-sans text-[12.5px] text-ink">
                {formatSlot(slot.start_time, slot.end_time)}
              </span>
              <span className="truncate font-sans text-[12px] text-body">
                {slot.location ?? "—"}
              </span>
              <span className="truncate font-mono text-[11px] text-strong">
                {slot.applicant_netid ?? (
                  <span className="font-sans text-[12px] text-faint">open</span>
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
                    className="rounded-chip p-1 text-faint transition-colors duration-200 hover:text-ink disabled:pointer-events-none"
                  >
                    <UndoIcon className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isPending}
                    aria-label="Delete this slot"
                    onClick={() => run(() => deleteSlot(slot.id))}
                    className="rounded-chip p-1 text-faint transition-colors duration-200 hover:text-destructive disabled:pointer-events-none"
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
