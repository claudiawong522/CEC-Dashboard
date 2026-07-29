"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { updateSpeaker } from "@/lib/actions/events";

export function SpeakerSection({
  eventId,
  description,
  done,
  evidenceFiles,
  portraitFiles,
}: {
  eventId: string;
  description: string | null;
  done: boolean;
  evidenceFiles: UploadedFile[];
  portraitFiles: UploadedFile[];
}) {
  const [value, setValue] = useState(description ?? "");
  const [isPending, startTransition] = useTransition();
  const dirty = value !== (description ?? "");

  function handleSave() {
    startTransition(async () => {
      try {
        await updateSpeaker(eventId, { description: value });
        toast.success("Speaker saved");
      } catch {
        toast.error("Couldn't save speaker");
      }
    });
  }

  return (
    <SectionCard title="Speaker" eventId={eventId} section="speaker" done={done}>
      <div className="flex flex-col gap-1.5">
        <Label>Details</Label>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Who's speaking, what about..."
        />
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          disabled={!dirty || isPending}
          onClick={handleSave}
        >
          Save
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Evidence</Label>
        <EvidenceUploader
          eventId={eventId}
          section="speaker"
          bucket="evidence"
          initialFiles={evidenceFiles}
          accept={{ "image/*": [] }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Speaker portrait</Label>
        <EvidenceUploader
          eventId={eventId}
          section="speaker_portrait"
          bucket="portraits"
          initialFiles={portraitFiles}
          multiple={false}
          accept={{ "image/*": [] }}
          label="Drop the speaker's portrait photo here"
        />
      </div>
    </SectionCard>
  );
}
