"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateSpeaker } from "@/lib/actions/events";

export function SpeakerSection({
  eventId,
  description,
  done,
  portraitFiles,
}: {
  eventId: string;
  description: string | null;
  done: boolean;
  portraitFiles: UploadedFile[];
}) {
  const [value, setValue] = useState(description ?? "");
  const status = useAutoSave(value, (next) => updateSpeaker(eventId, { description: next }));

  return (
    <SectionCard title="Speaker" eventId={eventId} section="speaker" done={done}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Details</Label>
          <SaveIndicator status={status} />
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Who's speaking, what about..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Speaker portrait</Label>
        <EvidenceUploader
          eventId={eventId}
          section="speaker_portrait"
          bucket="portraits"
          dropLabel="portrait"
          label="Drop the speaker portrait (one image)"
          initialFiles={portraitFiles}
          multiple={false}
          accept={{ "image/*": [] }}
        />
      </div>
    </SectionCard>
  );
}
