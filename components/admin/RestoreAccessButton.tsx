"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { restoreAccess } from "@/lib/actions/admin";

export function RestoreAccessButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  function onRestore() {
    startTransition(async () => {
      try {
        await restoreAccess(userId);
        toast.success("Access restored");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't restore access — try again");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onRestore}
      disabled={isPending}
      className="rounded-btn px-1.5 py-1 font-mono text-[9.5px] tracking-[0.1em] text-faint uppercase transition-colors duration-200 ease-brand hover:text-ink disabled:opacity-50"
    >
      {isPending ? "Restoring…" : "Restore"}
    </button>
  );
}
