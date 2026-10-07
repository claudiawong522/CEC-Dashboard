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
      <DialogTrigger
        render={<Button variant="outline" size="icon-sm" aria-label="Delete event" className="hover:border-red hover:bg-red" />}
        nativeButton
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent className="border border-line bg-background p-4 shadow-soft ring-0 sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold text-foreground">
            Delete this event?
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-foreground/50">
          This removes it and everything attached to it (files, notes, prep) for good.
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
                  "flex items-center gap-2.5 border px-2.5 py-2 text-left font-sans text-[13px] transition-colors duration-150 ease-fluid",
                  scope === option.value
                    ? "border-foreground bg-red/10 text-foreground"
                    : "border-line text-subtle hover:border-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-3 shrink-0 border-2 border-foreground",
                    scope === option.value ? "bg-red" : "bg-transparent",
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
          <Button type="button" variant="destructive" loading={isPending} onClick={confirmDelete}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
