"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
        toast.error("Couldn't delete. Try again.");
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete this event?</DialogTitle>
          <DialogDescription>
            This removes it and everything attached to it (files, notes, prep) for good.
          </DialogDescription>
        </DialogHeader>

        {isRecurring && (
          <div role="radiogroup" aria-label="Which events" className="flex flex-col gap-1.5">
            {(
              [
                { value: "single", label: "Just this event" },
                { value: "following", label: "This and every event after it" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={scope === option.value}
                onClick={() => setScope(option.value)}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 border bg-background px-3 py-2 text-left font-sans text-[14px] transition-colors duration-150 ease-fluid md:min-h-0 md:text-[13px]",
                  scope === option.value
                    ? "border-foreground text-foreground"
                    : "border-line text-subtle hover:border-foreground",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-3 shrink-0 border-2 border-foreground transition-colors duration-150",
                    scope === option.value ? "bg-mint" : "bg-transparent",
                  )}
                />
                {option.label}
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" loading={isPending} onClick={confirmDelete}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
