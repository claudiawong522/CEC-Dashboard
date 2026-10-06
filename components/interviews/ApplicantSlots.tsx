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
      <p className="border border-line bg-background px-4 shadow-soft py-8 text-center font-sans text-[13px] text-foreground/50">
        No interview times are open yet. You&rsquo;ll get an email when they are.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {mine && (
        <div className="flex flex-col gap-1.5 border-2 border-foreground bg-mint p-4 shadow-mint">
          <span className="t-eyebrow text-foreground">
            your interview
          </span>
          <span className="font-display text-[18px] font-bold text-foreground">
            {formatSlot(mine.start_time, mine.end_time)}
          </span>
          {mine.location && (
            <span className="font-sans text-[12.5px] text-subtle">{mine.location}</span>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => releaseOwnSlot(mine.id))}
            className="link-underline mt-1 w-fit font-sans text-[12px] text-subtle transition-colors duration-200 hover:text-foreground disabled:pointer-events-none"
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
                  "flex flex-col items-start gap-1 border border-line bg-background p-4 text-left shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid",
                  "hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <span className="font-display text-[14px] font-bold text-foreground">
                  {formatSlot(slot.start_time, slot.end_time)}
                </span>
                {slot.location && (
                  <span className="font-sans text-[12px] text-foreground/50">{slot.location}</span>
                )}
              </button>
            ))}
        </div>
      )}

      <span className="font-sans text-[11.5px] text-foreground/50">
        One slot each. Taking one releases nothing else, so pick the time you can actually make.
      </span>
    </div>
  );
}
