"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateNotes } from "@/lib/actions/events";

export function NotesField({ eventId, notes }: { eventId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? "");
  const status = useAutoSave(value, (next) => updateNotes(eventId, next));

  return (
    <SectionCard title="Notes" eventId={eventId} section="notes" done={false} hideDone>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label className="font-sans text-[12px] font-normal text-body">Optional notes</Label>
          <SaveIndicator status={status} />
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Anything else worth noting about this event..."
          rows={4}
        />
      </div>
    </SectionCard>
  );
}
