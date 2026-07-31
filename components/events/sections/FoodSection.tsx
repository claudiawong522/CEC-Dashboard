"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateFood } from "@/lib/actions/events";

export function FoodSection({
  eventId,
  usualOptions,
  halalEnabled,
  halalOptions,
  done,
  files,
}: {
  eventId: string;
  usualOptions: string | null;
  halalEnabled: boolean;
  halalOptions: string | null;
  done: boolean;
  files: UploadedFile[];
}) {
  const [usual, setUsual] = useState(usualOptions ?? "");
  const [halal, setHalal] = useState(halalOptions ?? "");
  const [halalOn, setHalalOn] = useState(halalEnabled);
  const status = useAutoSave({ usual, halal, halalOn }, (next) =>
    updateFood(eventId, { usualOptions: next.usual, halalEnabled: next.halalOn, halalOptions: next.halal }),
  );

  return (
    <SectionCard title="Food" eventId={eventId} section="food" done={done}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Usual</Label>
          <SaveIndicator status={status} />
        </div>
        <Textarea value={usual} onChange={(e) => setUsual(e.target.value)} placeholder="Catering plan..." />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="halal-toggle">Halal options</Label>
        <Switch id="halal-toggle" checked={halalOn} onCheckedChange={setHalalOn} />
      </div>
      {halalOn && (
        <Textarea value={halal} onChange={(e) => setHalal(e.target.value)} placeholder="Halal catering plan..." />
      )}

      <EvidenceUploader
        eventId={eventId}
        section="food"
        bucket="evidence"
        dropLabel="photo evidence"
        label="Drop a photo of the food table"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
