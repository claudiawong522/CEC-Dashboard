"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateMoney } from "@/lib/actions/events";

export function MoneySection({
  eventId,
  budgetedAmount,
  actualAmount,
  notes,
  done,
  files,
}: {
  eventId: string;
  budgetedAmount: number | null;
  actualAmount: number | null;
  notes: string | null;
  done: boolean;
  files: UploadedFile[];
}) {
  const [budgeted, setBudgeted] = useState(budgetedAmount?.toString() ?? "");
  const [actual, setActual] = useState(actualAmount?.toString() ?? "");
  const [notesValue, setNotesValue] = useState(notes ?? "");
  const status = useAutoSave({ budgeted, actual, notesValue }, (next) =>
    updateMoney(eventId, {
      budgetedAmount: next.budgeted === "" ? null : Number(next.budgeted),
      actualAmount: next.actual === "" ? null : Number(next.actual),
      notes: next.notesValue,
    }),
  );

  return (
    <SectionCard title="Money" eventId={eventId} section="money" done={done}>
      <div className="grid grid-cols-2 gap-[12px]">
        <div className="flex flex-col gap-1.5">
          <Label>Budgeted</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={budgeted}
            onChange={(e) => setBudgeted(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Actual spent</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>Notes</Label>
          <SaveIndicator status={status} />
        </div>
        <Textarea
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          placeholder="What this covers, reimbursement status..."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Receipts</Label>
        <EvidenceUploader
          eventId={eventId}
          section="money"
          bucket="receipts"
        dropLabel="receipts"
        label="Drop receipts here"
          initialFiles={files}
          accept={{ "image/*": [] }}
        />
      </div>
    </SectionCard>
  );
}
