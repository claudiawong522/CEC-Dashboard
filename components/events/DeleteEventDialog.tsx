"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteEvent } from "@/lib/actions/events";
import { cn } from "@/lib/utils";

type Scope = "single" | "following";

export function DeleteEventDialog({
  eventId,
  isRecurring,
}: {
  eventId: string;
  isRecurring: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("single");
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      try {
        await deleteEvent(eventId, scope);
      } catch (err) {
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Couldn't delete — try again");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex size-8 items-center justify-center rounded-btn text-faint transition-colors duration-200 hover:bg-coral/10 hover:text-destructive">
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent className="rounded-card border border-line bg-paper p-4 ring-0 sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[15px] font-medium text-ink">
            Delete this event?
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-faint">
          This removes it and everything attached to it — files, notes, prep — for good.
        </p>

        {isRecurring && (
          <div className="flex flex-col gap-1.5">
            {(
              [
                { value: "single", label: "Just this event" },
                { value: "following", label: "This and every event after it" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={cn(
                  "flex items-center gap-2.5 rounded-btn border px-2.5 py-2 text-left font-sans text-[13px] transition-colors duration-150",
                  scope === option.value
                    ? "border-coral/40 bg-coral/10 text-ink"
                    : "border-[rgba(35,32,28,0.1)] text-body hover:bg-wash",
                )}
              >
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-full border-2",
                    scope === option.value ? "border-coral bg-coral" : "border-[rgba(35,32,28,0.24)]",
                  )}
                />
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={confirmDelete}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
