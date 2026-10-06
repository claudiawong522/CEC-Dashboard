"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { DeleteIdeaDialog } from "@/components/external/DeleteIdeaDialog";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { STAGES, STAGE_LABELS, type StageValue } from "@/lib/validation/external-schemas";
import {
  updatePitch,
  updateTargetDateTime,
  updateIdeaNotes,
  setIdeaStage,
  addPerson,
  updatePerson,
  removePerson,
  toggleOwner,
} from "@/lib/actions/external";
import type { IdeaRow, IdeaPersonRow, AdminInfo } from "@/lib/types/external";

function FieldLabel({ children, indicator }: { children: React.ReactNode; indicator?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-mono text-[9.5px] tracking-[0.13em] text-faint uppercase">{children}</span>
      {indicator}
    </div>
  );
}

function PersonRow({
  ideaId,
  person,
  onRemove,
}: {
  ideaId: string;
  person: IdeaPersonRow;
  onRemove: () => void;
}) {
  const [name, setName] = useState(person.name);
  const [email, setEmail] = useState(person.email ?? "");
  const status = useAutoSave({ name, email }, (v) => updatePerson(ideaId, person.id, v));

  return (
    <div className="flex items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="flex-[1.1]" />
      <div className="relative flex flex-[1.4] items-center">
        <Mail className="pointer-events-none absolute left-3 size-3.5 text-faint" />
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          type="email"
          className="pl-9"
        />
      </div>
      <SaveIndicator status={status} className="w-14 shrink-0" />
      <button
        type="button"
        onClick={onRemove}
        title="Remove"
        className="shrink-0 text-faint transition-colors duration-200 ease-brand hover:text-destructive"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function StageStepper({ idea, onStageChange }: { idea: IdeaRow; onStageChange: (stage: StageValue) => void }) {
  const isDeclined = idea.stage === "declined";
  const refKey = isDeclined ? (idea.prev_stage ?? "idea") : idea.stage;
  const curIdx = STAGES.indexOf(refKey as (typeof STAGES)[number]);

  if (idea.stage === "converted") return null;

  return (
    <div className="flex flex-col gap-2">
      <div className={"flex pt-1 transition-opacity duration-200 ease-brand" + (isDeclined ? " pointer-events-none opacity-40" : "")}>
        {STAGES.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => onStageChange(s)}
            className={
              "relative flex flex-1 flex-col items-center gap-2 pt-1.5 before:absolute before:top-[13px] before:left-[-50%] before:h-0.5 before:w-full before:content-[''] " +
              (i === 0
                ? "before:content-none"
                : i <= curIdx
                  ? "before:bg-cent-pastel"
                  : "before:bg-line-input")
            }
          >
            <span
              className={
                "z-10 box-border size-[17px] rounded-full border-2 " +
                (i === curIdx
                  ? "border-ink bg-ink shadow-[0_0_0_4px_rgba(0,0,0,0.09)]"
                  : i < curIdx
                    ? "border-mint bg-mint"
                    : "border-line-input bg-paper")
              }
            />
            <span
              className={
                "text-center font-mono text-[9px] tracking-[0.06em] uppercase " +
                (i === curIdx ? "font-medium text-ink" : i < curIdx ? "text-body" : "text-faint")
              }
            >
              {STAGE_LABELS[s]}
            </span>
          </button>
        ))}
      </div>
      {isDeclined && (
        <p className="font-mono text-[9.5px] text-destructive">
          Declined — pipeline paused here. Reactivate below to pick it back up.
        </p>
      )}
    </div>
  );
}

export function ExternalDetail({
  idea,
  people,
  ownerIds,
  admins,
}: {
  idea: IdeaRow;
  people: IdeaPersonRow[];
  ownerIds: string[];
  admins: (AdminInfo & { id: string })[];
}) {
  const [isPending, startTransition] = useTransition();
  const [localPeople, setLocalPeople] = useState(people);
  const [stage, setStage] = useState(idea.stage);
  const [prevStage, setPrevStage] = useState(idea.prev_stage);

  const [pitch, setPitch] = useState(idea.pitch);
  const pitchStatus = useAutoSave(pitch, (v) => updatePitch(idea.id, v));

  const [dateTime, setDateTime] = useState({
    targetDate: idea.target_date ?? "",
    targetTime: idea.target_time ?? "",
  });
  const dateTimeStatus = useAutoSave(dateTime, (v) => updateTargetDateTime(idea.id, v));

  const [notes, setNotes] = useState(idea.notes ?? "");
  const notesStatus = useAutoSave(notes, (v) => updateIdeaNotes(idea.id, v));

  function changeStage(next: StageValue, silent = false) {
    const from = stage;
    const isBackward =
      !silent &&
      STAGES.includes(from as (typeof STAGES)[number]) &&
      STAGES.includes(next as (typeof STAGES)[number]) &&
      STAGES.indexOf(next as (typeof STAGES)[number]) < STAGES.indexOf(from as (typeof STAGES)[number]);

    if (next === "declined" && stage !== "declined") setPrevStage(stage);
    setStage(next);
    startTransition(async () => {
      try {
        await setIdeaStage(idea.id, next);
        if (isBackward) {
          toast(`Moved back to ${STAGE_LABELS[from]}`, {
            action: { label: "Undo", onClick: () => changeStage(from, true) },
          });
        }
      } catch {
        toast.error("Couldn't update stage — try again");
      }
    });
  }

  function handleDeclineToggle() {
    changeStage(stage === "declined" ? (prevStage ?? "idea") : "declined");
  }

  function handleAddPerson() {
    startTransition(async () => {
      try {
        const { id, contactId } = await addPerson(idea.id);
        setLocalPeople((prev) => [...prev, { id, idea_id: idea.id, contact_id: contactId, name: "", email: null }]);
      } catch {
        toast.error("Couldn't add person — try again");
      }
    });
  }

  function handleRemovePerson(personId: string) {
    setLocalPeople((prev) => prev.filter((p) => p.id !== personId));
    startTransition(async () => {
      try {
        await removePerson(idea.id, personId);
      } catch {
        toast.error("Couldn't remove person — try again");
      }
    });
  }

  function handleToggleOwner(profileId: string) {
    startTransition(async () => {
      try {
        await toggleOwner(idea.id, profileId);
      } catch {
        toast.error("Couldn't update owners — try again");
      }
    });
  }

  const [owners, setOwners] = useState(ownerIds);
  function toggleOwnerLocal(profileId: string) {
    setOwners((prev) => (prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId]));
    handleToggleOwner(profileId);
  }

  const isConverted = stage === "converted";

  return (
    <div className="relative z-10 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/external" className="w-fit font-mono text-[10.5px] tracking-[0.08em] text-faint uppercase transition-colors duration-200 ease-brand hover:text-ink">
          ← All leads
        </Link>
        <DeleteIdeaDialog ideaId={idea.id} pitch={pitch} isConverted={isConverted} returnToList />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel indicator={<SaveIndicator status={pitchStatus} />}>Idea</FieldLabel>
        <Input
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="What's the idea?"
          className="text-[15px] font-medium text-ink"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9.5px] tracking-[0.13em] text-faint uppercase">People</span>
        <div className="flex gap-2 px-0.5">
          <span className="flex-[1.1] font-mono text-[9px] tracking-[0.1em] text-faint uppercase">Name</span>
          <span className="flex-[1.4] font-mono text-[9px] tracking-[0.1em] text-faint uppercase">Email</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {localPeople.map((p) => (
            <PersonRow key={p.id} ideaId={idea.id} person={p} onRemove={() => handleRemovePerson(p.id)} />
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="w-fit bg-paper" onClick={handleAddPerson}>
          + Add person
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[9.5px] tracking-[0.13em] text-faint uppercase">Follow-up owners</span>
        <div className="flex flex-wrap gap-1.5">
          {admins.map((a) => {
            const on = owners.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => toggleOwnerLocal(a.id)}
                className={
                  "flex items-center gap-1.5 rounded-pill border px-[11px] py-1.5 font-mono text-[9.5px] tracking-[0.08em] uppercase transition-colors duration-200 ease-brand " +
                  (on ? "border-[rgba(0,0,0,0.24)] bg-wash text-ink" : "border-line-input text-faint hover:bg-wash hover:text-ink")
                }
              >
                <span className={"size-1.5 rounded-full " + (on ? "bg-coral" : "bg-faint")} />
                {a.full_name ?? a.email}
              </button>
            );
          })}
        </div>
      </div>

      {!isConverted && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[9.5px] tracking-[0.13em] text-faint uppercase">Stage</span>
          <StageStepper idea={{ ...idea, stage, prev_stage: prevStage }} onStageChange={changeStage} />
        </div>
      )}

      {isConverted && idea.converted_event_id && (
        <div className="flex items-center gap-2 rounded-card bg-cent-tint px-4 py-3">
          <span className="font-mono text-[9.5px] tracking-[0.1em] text-ink uppercase">Converted</span>
          <Link
            href={`/events/${idea.converted_event_id}`}
            className="font-sans text-[12.5px] text-ink underline decoration-1 underline-offset-2 transition-opacity duration-200 hover:opacity-70"
          >
            View event →
          </Link>
        </div>
      )}

      {!isConverted && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel indicator={<SaveIndicator status={dateTimeStatus} />}>Target date &amp; time</FieldLabel>
          <div className="flex gap-2">
            <DatePicker
              value={dateTime.targetDate}
              onChange={(v) => setDateTime((prev) => ({ ...prev, targetDate: v }))}
              className="w-[176px]"
            />
            <TimePicker
              value={dateTime.targetTime}
              onChange={(v) => setDateTime((prev) => ({ ...prev, targetTime: v }))}
              className="w-[132px]"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <FieldLabel indicator={<SaveIndicator status={notesStatus} />}>Notes</FieldLabel>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Log calls, replies, anything worth remembering — just start typing…"
          rows={5}
        />
      </div>

      {!isConverted && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <Button type="button" variant={stage === "declined" ? "outline" : "destructive"} onClick={handleDeclineToggle} disabled={isPending}>
            {stage === "declined" ? "Reactivate" : "Decline"}
          </Button>
          <Link
            href={
              stage === "date_set"
                ? `/events/new?ideaId=${idea.id}${dateTime.targetDate ? `&date=${dateTime.targetDate}` : ""}`
                : "#"
            }
            aria-disabled={stage !== "date_set"}
            className={
              buttonVariants({ variant: "default" }) +
              (stage !== "date_set" ? " pointer-events-none opacity-50" : "")
            }
          >
            Convert to event →
          </Link>
        </div>
      )}
    </div>
  );
}
