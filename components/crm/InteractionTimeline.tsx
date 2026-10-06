"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteInteraction, logInteraction } from "@/lib/actions/crm";
import {
  INTERACTION_KINDS,
  INTERACTION_KIND_LABELS,
  type InteractionKind,
} from "@/lib/validation/crm-schemas";
import type { Interaction } from "@/lib/types/crm";

// Section colours are fixed by the kit. An interaction is correspondence, so
// it borrows Speaker/Marketing's coral for email and meetings and stays
// neutral for a plain note.
const KIND_COLORS: Record<InteractionKind, string> = {
  email: "var(--coral)",
  meeting: "var(--teal)",
  call: "var(--blue)",
  event: "var(--amber)",
  note: "var(--line-strong)",
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function InteractionTimeline({
  contactId,
  interactions,
}: {
  contactId: string;
  interactions: Interaction[];
}) {
  const [kind, setKind] = useState<InteractionKind>("email");
  const [occurredAt, setOccurredAt] = useState(today);
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function log() {
    startTransition(async () => {
      const result = await logInteraction({ contactId, kind, occurredAt, summary, body });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSummary("");
      setBody("");
      setOccurredAt(today());
      toast.success(result.message ?? "Logged");
    });
  }

  function remove(interactionId: string) {
    startTransition(async () => {
      const result = await deleteInteraction(interactionId, contactId);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-card border border-[rgba(0,0,0,0.07)] bg-paper p-[19px]">
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
        what we&rsquo;ve said
      </span>

      <div className="flex flex-col gap-[15px]">
        <div className="grid gap-[15px] sm:grid-cols-[auto_auto_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Kind</Label>
            <Select
              items={INTERACTION_KIND_LABELS}
              value={kind}
              onValueChange={(value) => setKind((value ?? "note") as InteractionKind)}
            >
              <SelectTrigger className="w-full rounded-input border-line-input bg-page px-3 py-2.5 font-sans text-[13.5px] text-ink sm:w-[132px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_KINDS.map((value) => (
                  <SelectItem
                    key={value}
                    value={value}
                   
                  >
                    {INTERACTION_KIND_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">When</Label>
            <Input
              type="date"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="bg-page sm:w-[168px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">What happened</Label>
            <Input
              value={summary}
              placeholder="Asked if they'd speak at Demo Day"
              onChange={(event) => setSummary(event.target.value)}
              className="bg-page"
            />
          </div>
        </div>

        <Textarea
          value={body}
          placeholder="Anything worth remembering in full (optional)"
          onChange={(event) => setBody(event.target.value)}
          className="bg-page"
        />

        <button
          type="button"
          disabled={isPending || !summary.trim()}
          onClick={log}
          className="w-fit rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Logging" : "Log it"}
        </button>
      </div>

      {interactions.length === 0 ? (
        <p className="font-sans text-[12.5px] text-faint">
          Nothing logged yet. This is what the follow-up suggestions read.
        </p>
      ) : (
        <div className="flex flex-col">
          {interactions.map((interaction, index) => (
            <div
              key={interaction.id}
              className={`group flex gap-3 py-3 ${
                index < interactions.length - 1 ? "border-b border-[rgba(0,0,0,0.07)]" : ""
              }`}
            >
              <span
                className="mt-1.5 size-[7px] shrink-0 rounded-full"
                style={{ background: KIND_COLORS[interaction.kind] }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-sans text-[13px] text-ink">{interaction.summary}</span>
                {interaction.body && (
                  <p className="font-sans text-[12.5px] leading-[1.7] text-body">
                    {interaction.body}
                  </p>
                )}
                <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                  {INTERACTION_KIND_LABELS[interaction.kind]} ·{" "}
                  {new Date(interaction.occurred_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {interaction.member?.full_name ?? interaction.member?.email ?? "someone"}
                </span>
              </div>
              {/* Correcting an entry means adding another one; there is no
                  update policy on this table. Removing a mistake is still
                  allowed, which is a different thing from rewriting history. */}
              <button
                type="button"
                disabled={isPending}
                aria-label="Remove this entry"
                onClick={() => remove(interaction.id)}
                className="h-fit shrink-0 rounded-chip p-1 text-faint opacity-0 transition-[opacity,color] duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
