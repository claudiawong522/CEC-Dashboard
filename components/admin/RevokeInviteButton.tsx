"use client";

import { toast } from "sonner";
import { X } from "lucide-react";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { revokeInvite } from "@/lib/actions/admin";

export function RevokeInviteButton({ userId, email }: { userId: string; email: string }) {
  async function confirmRevoke() {
    try {
      const result = await revokeInvite(userId);
      if (!result.ok) toast.error(result.message);
    } catch {
      toast.error("Couldn't cancel invite — try again");
    }
  }

  return (
    <ConfirmButton
      trigger={<X className="size-3.5" />}
      triggerClassName="flex size-6 shrink-0 items-center justify-center rounded-btn text-faint transition-colors duration-200 hover:bg-coral/10 hover:text-destructive"
      triggerTitle={`Cancel invite to ${email}`}
      askLabel="Cancel invite?"
      yesLabel="Yes"
      cancelLabel="Keep"
      onConfirm={confirmRevoke}
    />
  );
}
