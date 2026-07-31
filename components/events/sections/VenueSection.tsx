"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
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
  const status = useAutoSave(value, (next) => updateVenue(eventId, next));

  return (
    <SectionCard title="Venue" eventId={eventId} section="venue" done={done}>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Venue" />
        <SaveIndicator status={status} />
      </div>
      <EvidenceUploader
        eventId={eventId}
        section="venue"
        bucket="evidence"
        dropLabel="photo evidence"
        label="Drop a photo of the booking confirmation"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
