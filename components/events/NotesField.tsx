"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { updateNotes } from "@/lib/actions/events";

export function NotesField({ eventId, notes }: { eventId: string; notes: string | null }) {
  const [value, setValue] = useState(notes ?? "");
  const [isPending, startTransition] = useTransition();
  const dirty = value !== (notes ?? "");

  function handleSave() {
    startTransition(async () => {
      try {
        await updateNotes(eventId, value);
        toast.success("Notes saved");
      } catch {
        toast.error("Couldn't save notes");
      }
    });
  }

  return (
    <SectionCard title="Notes" eventId={eventId} section="notes" done={false} hideDone>
      <div className="flex flex-col gap-1.5">
        <Label className="font-sans text-xs font-normal text-body">Optional notes</Label>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Anything else worth noting about this event..."
          rows={4}
        />
      </div>
      <Button
        variant="outline"
        className="self-start px-[17px] py-2 text-[12.5px]"
        disabled={!dirty || isPending}
        onClick={handleSave}
      >
        Save
      </Button>
    </SectionCard>
  );
}
