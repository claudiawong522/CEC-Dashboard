"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { setSectionDone } from "@/lib/actions/events";

export function DoneCheckbox({
  eventId,
  section,
  initialDone,
}: {
  eventId: string;
  section: string;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [isPending, startTransition] = useTransition();

  function handleChange(checked: boolean) {
    setDone(checked);
    startTransition(async () => {
      try {
        await setSectionDone(eventId, section, checked);
      } catch {
        setDone(!checked);
        toast.error("Couldn't update — try again");
      }
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
      <Checkbox checked={done} disabled={isPending} onCheckedChange={handleChange} />
      Mark as done
    </label>
  );
}
