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
import { cn } from "@/lib/utils";
import { deleteIdea, deleteIdeaAndReturnToList } from "@/lib/actions/external";

// Shared by the list rows and the detail page. From a row the deleted lead
// just vanishes on revalidate; from the detail page there's nothing left to
// stay on, so it walks back to /external.
export function DeleteIdeaDialog({
  ideaId,
  pitch,
  isConverted,
  returnToList = false,
  className,
}: {
  ideaId: string;
  pitch: string;
  isConverted?: boolean;
  returnToList?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      try {
        if (returnToList) await deleteIdeaAndReturnToList(ideaId);
        else await deleteIdea(ideaId);
        setOpen(false);
      } catch (err) {
        // The redirect the detail-page variant ends on surfaces here as a
        // thrown NEXT_REDIRECT — let it through or the navigation is
        // swallowed and the user gets a false "couldn't delete".
        if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
        toast.error("Couldn't delete — try again");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        title="Delete lead"
        aria-label={`Delete ${pitch || "untitled lead"}`}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-btn text-faint transition-colors duration-200 ease-brand hover:bg-coral/10 hover:text-destructive",
          className,
        )}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent className="rounded-card border border-line bg-paper p-4 ring-0 sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[15px] font-medium text-ink">
            Delete this lead?
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-faint">
          {pitch ? <span className="text-body">“{pitch}”</span> : "This lead"} goes for good —
          contacts, owners and notes with it.
          {isConverted && " The event it became stays on the calendar."}
        </p>

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
