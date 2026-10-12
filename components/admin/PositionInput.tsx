"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { updateMemberPosition } from "@/lib/actions/admin";

// Saves on blur or Enter, only when the value actually changed. The
// suggestions come from one <datalist> rendered by UserTable, so any title
// can still be typed.
export function PositionInput({
  userId,
  position,
  listId,
  label,
}: {
  userId: string;
  position: string;
  listId: string;
  label: string;
}) {
  const [value, setValue] = useState(position);
  const [saved, setSaved] = useState(position);
  const [isPending, startTransition] = useTransition();
  // Escape blurs too, and blur saves; this tells that blur to skip it.
  const cancelled = useRef(false);

  function save() {
    if (cancelled.current) {
      cancelled.current = false;
      setValue(saved);
      return;
    }
    const next = value.trim();
    if (next === saved) {
      setValue(saved);
      return;
    }
    if (!next) {
      setValue(saved);
      toast.error("A position can't be empty");
      return;
    }
    startTransition(async () => {
      try {
        const result = await updateMemberPosition(userId, next);
        if (!result.ok) {
          setValue(saved);
          toast.error(result.message);
          return;
        }
        setSaved(next);
        setValue(next);
        toast.success("Position updated");
      } catch {
        setValue(saved);
        toast.error("Couldn't update position");
      }
    });
  }

  return (
    <Input
      value={value}
      list={listId}
      aria-label={label}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          cancelled.current = true;
          e.currentTarget.blur();
        }
      }}
      className="py-1.5 text-[13px] md:max-w-[220px]"
    />
  );
}
