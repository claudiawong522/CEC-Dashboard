import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutoSaveStatus } from "@/lib/hooks/use-autosave";

export function SaveIndicator({ status, className }: { status: AutoSaveStatus; className?: string }) {
  if (status === "idle") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.08em] uppercase transition-opacity duration-300",
        status === "error" ? "text-destructive" : "text-faint",
        className,
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" />
          Saving
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="size-3" />
          Saved
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="size-3" />
          Couldn&apos;t save
        </>
      )}
    </span>
  );
}
