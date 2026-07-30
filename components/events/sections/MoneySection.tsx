"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/events/SectionCard";
import { EvidenceUploader, type UploadedFile } from "@/components/events/EvidenceUploader";
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
  const [isPending, startTransition] = useTransition();
  const dirty =
    budgeted !== (budgetedAmount?.toString() ?? "") ||
    actual !== (actualAmount?.toString() ?? "") ||
    notesValue !== (notes ?? "");

  function handleSave() {
    startTransition(async () => {
      try {
        await updateMoney(eventId, {
          budgetedAmount: budgeted === "" ? null : Number(budgeted),
          actualAmount: actual === "" ? null : Number(actual),
          notes: notesValue,
        });
        toast.success("Money saved");
      } catch {
        toast.error("Couldn't save money");
      }
    });
  }

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
        <Label>Notes</Label>
        <Textarea
          value={notesValue}
          onChange={(e) => setNotesValue(e.target.value)}
          placeholder="What this covers, reimbursement status..."
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
