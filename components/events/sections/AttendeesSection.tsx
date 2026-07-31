"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateAttendees } from "@/lib/actions/events";

export function AttendeesSection({
  eventId,
  lumaUrl,
  headcountNotes,
  done,
  files,
}: {
  eventId: string;
  lumaUrl: string | null;
  headcountNotes: string | null;
  done: boolean;
  files: UploadedFile[];
}) {
  const [url, setUrl] = useState(lumaUrl ?? "");
  const [notes, setNotes] = useState(headcountNotes ?? "");
  const status = useAutoSave({ url, notes }, (next) =>
    updateAttendees(eventId, { lumaUrl: next.url, headcountNotes: next.notes }),
  );

  return (
    <SectionCard title="Attendees" eventId={eventId} section="attendees" done={done}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Luma link</Label>
          <SaveIndicator status={status} />
        </div>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://luma.com/..." />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Expected / actual headcount..."
        />
      </div>
      <EvidenceUploader
        eventId={eventId}
        section="attendees"
        bucket="evidence"
        dropLabel="photo evidence"
        label="Drop a screenshot of the RSVP list"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
