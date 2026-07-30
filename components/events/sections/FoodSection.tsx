"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
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
  const [isPending, startTransition] = useTransition();
  const dirty =
    usual !== (usualOptions ?? "") || halal !== (halalOptions ?? "") || halalOn !== halalEnabled;

  function handleSave() {
    startTransition(async () => {
      try {
        await updateFood(eventId, { usualOptions: usual, halalEnabled: halalOn, halalOptions: halal });
        toast.success("Food saved");
      } catch {
        toast.error("Couldn't save food");
      }
    });
  }

  return (
    <SectionCard title="Food" eventId={eventId} section="food" done={done}>
      <div className="flex flex-col gap-1.5">
        <Label>Usual</Label>
        <Textarea value={usual} onChange={(e) => setUsual(e.target.value)} placeholder="Catering plan..." />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="halal-toggle">Halal options</Label>
        <Switch id="halal-toggle" checked={halalOn} onCheckedChange={setHalalOn} />
      </div>
      {halalOn && (
        <Textarea value={halal} onChange={(e) => setHalal(e.target.value)} placeholder="Halal catering plan..." />
      )}

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
