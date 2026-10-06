"use client";

import { useState, useTransition } from "react";
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { draftOutreachEmail } from "@/lib/actions/agent";
import type { DraftedEmail } from "@/lib/agent/types";

// Drafting is read-only: it produces text to copy, and never sends anything.
// There is no confirm step because there is nothing to confirm. The human
// step is pasting it into their own mail client.
export function DraftCard({ contacts }: { contacts: { id: string; name: string }[] }) {
  const [contactId, setContactId] = useState("");
  const [intent, setIntent] = useState("");
  const [draft, setDraft] = useState<DraftedEmail | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await draftOutreachEmail(contactId, intent);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setDraft(("draft" in result && result.draft) || null);
    });
  }

  async function copy() {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <span className="t-eyebrow text-foreground/50">
        draft an email
      </span>

      {contacts.length === 0 ? (
        <p className="font-sans text-[13px] text-foreground/50">
          Add a contact to the CRM first and this can draft to them.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="t-eyebrow text-foreground/50">To</Label>
              <Select
                items={Object.fromEntries(contacts.map((c) => [c.id, c.name]))}
                value={contactId}
                onValueChange={(value) => setContactId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a contact" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px]">
                  {contacts.map((contact) => (
                    <SelectItem
                      key={contact.id}
                      value={contact.id}
                    >
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="t-eyebrow text-foreground/50">What does it need to do?</Label>
              <Input
                value={intent}
                placeholder="Ask if they'd speak at Demo Day in April"
                onChange={(event) => setIntent(event.target.value)}
              />
            </div>
          </div>

          <Button
            type="button"
            className="w-fit"
            disabled={isPending || !contactId || !intent.trim()}
            onClick={run}
          >
            {isPending ? "Drafting" : "Draft it"}
          </Button>
        </>
      )}

      {draft && (
        <div className="flex flex-col gap-2.5 border border-line bg-muted/40 p-4">
          {/* A draft written with no history behind it says so, rather than
              quietly implying a relationship that doesn't exist. */}
          <span className="t-eyebrow flex items-center gap-1.5 text-foreground/50">
            <InfoIcon className="size-3" />
            {draft.groundedIn > 0
              ? `grounded in ${draft.groundedIn} timeline ${draft.groundedIn === 1 ? "entry" : "entries"}`
              : "no prior contact, written as a first approach"}
          </span>
          <span className="font-display text-[15px] font-bold text-foreground">{draft.subject}</span>
          <p className="font-sans text-[13px] leading-[1.75] whitespace-pre-wrap text-subtle">
            {draft.body}
          </p>
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={copy}>
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <span className="font-sans text-[12px] text-foreground/50">
            Nothing is sent. Read it, fix it, and send it yourself.
          </span>
        </div>
      )}
    </div>
  );
}
