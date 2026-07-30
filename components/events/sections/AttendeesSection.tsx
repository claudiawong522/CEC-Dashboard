"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
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
  const [isPending, startTransition] = useTransition();
  const dirty = url !== (lumaUrl ?? "") || notes !== (headcountNotes ?? "");

  function handleSave() {
    startTransition(async () => {
      try {
        await updateAttendees(eventId, { lumaUrl: url, headcountNotes: notes });
        toast.success("Attendees saved");
      } catch {
        toast.error("Couldn't save attendees");
      }
    });
  }

  return (
    <SectionCard title="Attendees" eventId={eventId} section="attendees" done={done}>
      <div className="flex flex-col gap-1.5">
        <Label>Luma link</Label>
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
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={!dirty || isPending}
        onClick={handleSave}
      >
        Save
      </Button>
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
