"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { updateVenue } from "@/lib/actions/events";

export function VenueSection({
  eventId,
  venue,
  done,
  files,
}: {
  eventId: string;
  venue: string;
  done: boolean;
  files: UploadedFile[];
}) {
  const [value, setValue] = useState(venue);
  const [isPending, startTransition] = useTransition();
  const dirty = value !== venue;

  function handleSave() {
    startTransition(async () => {
      try {
        await updateVenue(eventId, value);
        toast.success("Venue saved");
      } catch {
        toast.error("Couldn't save venue");
      }
    });
  }

  return (
    <SectionCard title="Venue" eventId={eventId} section="venue" done={done}>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Venue" />
        <Button size="sm" variant="outline" disabled={!dirty || isPending} onClick={handleSave}>
          Save
        </Button>
      </div>
      <EvidenceUploader
        eventId={eventId}
        section="venue"
        bucket="evidence"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
