"use client";

import { useState, useTransition } from "react";
import { Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <span className="t-eyebrow text-foreground/50">
        what we&rsquo;ve said
      </span>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[auto_auto_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Kind</Label>
            <Select
              items={INTERACTION_KIND_LABELS}
              value={kind}
              onValueChange={(value) => setKind((value ?? "note") as InteractionKind)}
            >
              <SelectTrigger className="w-full sm:w-[132px]">
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
            <Label className="t-eyebrow text-foreground/50">When</Label>
            <Input
              type="date"
              value={occurredAt}
              onChange={(event) => setOccurredAt(event.target.value)}
              className="sm:w-[168px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">What happened</Label>
            <Input
              value={summary}
              placeholder="Asked if they'd speak at Demo Day"
              onChange={(event) => setSummary(event.target.value)}
            />
          </div>
        </div>

        <Textarea
          value={body}
          placeholder="Anything worth remembering in full (optional)"
          onChange={(event) => setBody(event.target.value)}
        />

        <Button
          type="button"
          className="w-fit"
          disabled={isPending || !summary.trim()}
          onClick={log}
        >
          {isPending ? "Logging" : "Log it"}
        </Button>
      </div>

      {interactions.length === 0 ? (
        <p className="font-sans text-[13px] text-foreground/50">
          Nothing logged yet. This is what the follow-up suggestions read.
        </p>
      ) : (
        <div className="flex flex-col">
          {interactions.map((interaction, index) => (
            <div
              key={interaction.id}
              className={`group flex gap-3 py-3 ${
                index < interactions.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <span
                className="mt-1.5 size-2 shrink-0"
                style={{ background: KIND_COLORS[interaction.kind] }}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-sans text-[13px] font-medium text-foreground">{interaction.summary}</span>
                {interaction.body && (
                  <p className="font-sans text-[13px] leading-[1.7] text-subtle">
                    {interaction.body}
                  </p>
                )}
                <span className="t-eyebrow text-foreground/50">
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
                className="h-fit shrink-0 p-1 text-foreground/50 opacity-0 transition-[opacity,color] duration-200 ease-fluid group-hover:opacity-100 focus-visible:opacity-100 hover:text-red"
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
