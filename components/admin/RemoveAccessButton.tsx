"use client";

import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { removeAccess } from "@/lib/actions/admin";

export function RemoveAccessButton({ userId, email }: { userId: string; email: string }) {
  async function confirmRemove() {
    try {
      await removeAccess(userId);
      toast.success("Access removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove access — try again");
    }
  }

  return (
    <ConfirmButton
      trigger={<UserMinus className="size-3.5" />}
      triggerClassName="flex size-6 shrink-0 items-center justify-center rounded-btn text-faint transition-colors duration-200 hover:bg-coral/10 hover:text-destructive"
      triggerTitle={`Remove ${email}'s access`}
      askLabel="Remove access?"
      yesLabel="Remove"
      cancelLabel="Keep"
      onConfirm={confirmRemove}
    />
  );
}
