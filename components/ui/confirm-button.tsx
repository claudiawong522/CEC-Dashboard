"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

// Inline destructive-confirm: no modal, no navigation away. A floating tag
// anchored to the trigger (not an inline swap) so it works inside tight
// containers like a table's last column — see design/BRAND_KIT.md's unified
// confirm pattern (replaces one-off Dialog-based confirms for lightweight
// actions).
export function ConfirmButton({
  trigger,
  triggerClassName,
  triggerTitle,
  askLabel = "Sure?",
  yesLabel = "Yes",
  cancelLabel = "Cancel",
  onConfirm,
  align = "right",
  className,
}: {
  trigger: React.ReactNode;
  triggerClassName?: string;
  triggerTitle?: string;
  askLabel?: string;
  yesLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  align?: "left" | "right";
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!asking) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setAsking(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [asking]);

  return (
    <span ref={rootRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        title={triggerTitle}
        onClick={() => setAsking(true)}
        className={cn(triggerClassName, asking && "invisible")}
      >
        {trigger}
      </button>
      {asking && (
        <span
          className={cn(
            "absolute top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 border border-foreground bg-background px-2.5 py-1.5 font-display text-[10px] font-medium tracking-[0.12em] whitespace-nowrap text-foreground/60 uppercase shadow-soft",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {askLabel}
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await onConfirm();
                setAsking(false);
              })
            }
            className="font-bold text-red transition-colors duration-150 hover:text-foreground disabled:opacity-50"
          >
            {isPending ? "…" : yesLabel}
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            disabled={isPending}
            className="text-foreground/60 transition-colors duration-150 hover:text-foreground disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </span>
      )}
    </span>
  );
}
