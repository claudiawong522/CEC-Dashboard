"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { claimSlot, releaseOwnSlot } from "@/lib/actions/interviews";
import { formatSlot } from "@/lib/validation/interview-schemas";
import { cn } from "@/lib/utils";

export type ApplicantSlot = {
  id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_claimed: boolean;
  applicant_netid: string | null;
};

export function ApplicantSlots({ slots, netid }: { slots: ApplicantSlot[]; netid: string }) {
  const [isPending, startTransition] = useTransition();
  const mine = slots.find((slot) => slot.applicant_netid === netid) ?? null;

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done");
    });
  }

  if (slots.length === 0) {
    return (
      <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
        No interview times are open yet. You&rsquo;ll get an email when they are.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {mine && (
        <div
          className="flex flex-col gap-1.5 rounded-card border border-transparent p-[15px]"
          style={{
            background:
              "linear-gradient(95deg, rgba(232,88,61,.2), rgba(224,185,74,.2), rgba(63,167,137,.2), rgba(59,111,194,.2))",
          }}
        >
          <span className="font-mono text-[9px] tracking-[0.13em] text-strong uppercase">
            your interview
          </span>
          <span className="font-sans text-[15px] font-medium text-ink">
            {formatSlot(mine.start_time, mine.end_time)}
          </span>
          {mine.location && (
            <span className="font-sans text-[12.5px] text-body">{mine.location}</span>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => releaseOwnSlot(mine.id))}
            className="mt-1 w-fit font-sans text-[12px] text-body underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline disabled:pointer-events-none"
          >
            Give it up and pick another
          </button>
        </div>
      )}

      {!mine && (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {slots
            .filter((slot) => !slot.is_claimed)
            .map((slot) => (
              <button
                key={slot.id}
                type="button"
                disabled={isPending}
                onClick={() => run(() => claimSlot(slot.id))}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px] text-left transition-[background-color,border-color] duration-200 ease-brand",
                  "hover:border-[rgba(35,32,28,0.14)] hover:bg-wash disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <span className="font-sans text-[13.5px] font-medium text-ink">
                  {formatSlot(slot.start_time, slot.end_time)}
                </span>
                {slot.location && (
                  <span className="font-sans text-[12px] text-faint">{slot.location}</span>
                )}
              </button>
            ))}
        </div>
      )}

      <span className="font-sans text-[11.5px] text-faint">
        One slot each. Taking one releases nothing else, so pick the time you can actually make.
      </span>
    </div>
  );
}
