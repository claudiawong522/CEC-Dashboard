"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { revokeInvite } from "@/lib/actions/admin";

export function RevokeInviteButton({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmRevoke() {
    startTransition(async () => {
      try {
        await revokeInvite(userId);
        setOpen(false);
      } catch {
        toast.error("Couldn't cancel invite — try again");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="flex size-6 shrink-0 items-center justify-center rounded-btn text-faint transition-colors duration-200 hover:bg-coral/10 hover:text-destructive"
        title="Cancel invite"
      >
        <X className="size-3.5" />
      </DialogTrigger>
      <DialogContent className="rounded-card border border-line bg-paper p-4 ring-0 sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[15px] font-medium text-ink">
            Cancel this invite?
          </DialogTitle>
        </DialogHeader>
        <p className="font-sans text-[12px] leading-[1.5] text-faint">
          {email} won&apos;t be able to accept it anymore. You can always invite them again later.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Keep invite
          </Button>
          <Button type="button" variant="destructive" disabled={isPending} onClick={confirmRevoke}>
            {isPending ? "Cancelling…" : "Cancel invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
