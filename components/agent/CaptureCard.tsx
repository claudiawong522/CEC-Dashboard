"use client";

import { useState, useTransition } from "react";
import { AlertTriangleIcon } from "lucide-react";
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
import { captureToTimeline, commitCapture } from "@/lib/actions/agent";
import { INTERACTION_KINDS, INTERACTION_KIND_LABELS } from "@/lib/validation/crm-schemas";
import type { CapturedProposal } from "@/lib/agent/types";

// The confirm card. Everything the model proposed is editable before it is
// written, and the commit sends what is on screen rather than what came back
// from the model. That difference is the entire safety property of this
// screen, not a UI nicety.
export function CaptureCard() {
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<CapturedProposal | null>(null);
  const [isPending, startTransition] = useTransition();

  function propose() {
    startTransition(async () => {
      const result = await captureToTimeline(text);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setProposal(("proposal" in result && result.proposal) || null);
    });
  }

  function commit() {
    if (!proposal) return;
    startTransition(async () => {
      const result = await commitCapture(proposal);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Saved");
      setProposal(null);
      setText("");
    });
  }

  function setContact<K extends keyof CapturedProposal["contact"]>(
    key: K,
    value: CapturedProposal["contact"][K],
  ) {
    setProposal((current) =>
      current ? { ...current, contact: { ...current.contact, [key]: value } } : current,
    );
  }

  function setInteraction<K extends keyof CapturedProposal["interaction"]>(
    key: K,
    value: CapturedProposal["interaction"][K],
  ) {
    setProposal((current) =>
      current ? { ...current, interaction: { ...current.interaction, [key]: value } } : current,
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <span className="t-eyebrow text-foreground/50">
        capture a conversation
      </span>

      <Textarea
        value={text}
        placeholder="Ran into Priya Raman from Sequoia at the ECE mixer on Tuesday. She's an associate, said she'd be up for speaking in the spring if we email her in January. priya@sequoiacap.com"
        onChange={(event) => setText(event.target.value)}
        className="min-h-[110px]"
      />

      <Button
        type="button"
        className="w-fit"
        disabled={isPending || text.trim().length < 15}
        onClick={propose}
      >
        {isPending && !proposal ? "Reading" : "Pull out the records"}
      </Button>

      {proposal && (
        <div className="flex flex-col gap-4 border border-line bg-muted/40 p-4">
          <span className="t-eyebrow text-foreground/50">
            proposed · nothing is saved yet
          </span>

          {proposal.duplicates.length > 0 && (
            <div className="flex flex-col gap-2 border border-amber bg-amber/10 p-3">
              <span className="flex items-center gap-1.5 font-sans text-[13px] font-medium text-foreground">
                <AlertTriangleIcon className="size-3.5" />
                Might already be in the CRM
              </span>
              {proposal.duplicates.map((duplicate) => (
                <label key={duplicate.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="dedupe"
                    checked={proposal.contact.existingContactId === duplicate.id}
                    onChange={() => setContact("existingContactId", duplicate.id)}
                  />
                  <span className="font-sans text-[13px] text-subtle">
                    Add to {duplicate.name}{" "}
                    <span className="text-foreground/50">({duplicate.reason})</span>
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="dedupe"
                  checked={proposal.contact.existingContactId === null}
                  onChange={() => setContact("existingContactId", null)}
                />
                <span className="font-sans text-[13px] text-subtle">
                  No, this is someone new
                </span>
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input
                value={proposal.contact.name}
                onChange={(event) => setContact("name", event.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                value={proposal.contact.email ?? ""}
                onChange={(event) => setContact("email", event.target.value || null)}
              />
            </Field>
            <Field label="Company">
              <Input
                value={proposal.contact.company ?? ""}
                onChange={(event) => setContact("company", event.target.value || null)}
              />
            </Field>
            <Field label="Title">
              <Input
                value={proposal.contact.title ?? ""}
                onChange={(event) => setContact("title", event.target.value || null)}
              />
            </Field>
            <Field label="Follow up on">
              <Input
                type="date"
                value={proposal.contact.nextFollowUpAt?.slice(0, 10) ?? ""}
                onChange={(event) => setContact("nextFollowUpAt", event.target.value || null)}
              />
            </Field>
            <Field label="Kind">
              <Select
                items={INTERACTION_KIND_LABELS}
                value={proposal.interaction.kind}
                onValueChange={(value) => setInteraction("kind", value ?? "note")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_KINDS.map((kind) => (
                    <SelectItem
                      key={kind}
                      value={kind}
                    >
                      {INTERACTION_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="What happened">
            <Input
              value={proposal.interaction.summary}
              onChange={(event) => setInteraction("summary", event.target.value)}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setProposal(null)}>
              Discard
            </Button>
            <Button type="button" disabled={isPending} onClick={commit}>
              {isPending ? "Saving" : "Save to the CRM"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="t-eyebrow text-foreground/50">{label}</Label>
      {children}
    </div>
  );
}
