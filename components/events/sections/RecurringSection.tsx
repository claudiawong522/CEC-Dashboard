"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { generateRecurringOccurrences } from "@/lib/actions/events";
import type { RecurringValues } from "@/lib/validation/event-schemas";

export function RecurringSection({
  eventId,
  done,
  alreadyLinked,
  files,
}: {
  eventId: string;
  done: boolean;
  alreadyLinked: boolean;
  files: UploadedFile[];
}) {
  const [frequency, setFrequency] = useState<RecurringValues["frequency"]>("weekly");
  const [endDate, setEndDate] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    if (!endDate) {
      toast.error("Pick an end date first");
      return;
    }
    startTransition(async () => {
      try {
        await generateRecurringOccurrences(eventId, { frequency, endDate });
        toast.success("Recurring events created");
      } catch {
        toast.error("Couldn't create recurring events");
      }
    });
  }

  return (
    <SectionCard title="Recurring" eventId={eventId} section="recurring" done={done}>
      {alreadyLinked ? (
        <p className="font-sans text-[12.5px] text-faint">
          This series has already been generated.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-[12px]">
            <div className="flex flex-col gap-1.5">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringValues["frequency"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Ends on</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <Button size="sm" variant="outline" className="self-start" disabled={isPending} onClick={handleGenerate}>
            {isPending ? "Generating..." : "Generate series"}
          </Button>
        </>
      )}
      <EvidenceUploader
        eventId={eventId}
        section="recurring"
        bucket="evidence"
        dropLabel="photo evidence"
        label="Drop a photo of the series confirmation"
        initialFiles={files}
        accept={{ "image/*": [] }}
      />
    </SectionCard>
  );
}
