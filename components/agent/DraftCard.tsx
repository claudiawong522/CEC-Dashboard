"use client";

import { useState, useTransition } from "react";
import { CheckIcon, CopyIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";
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
// There is no confirm step because there is nothing to confirm — the human
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
    <div className="flex flex-col gap-[15px] rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
        draft an email
      </span>

      {contacts.length === 0 ? (
        <p className="font-sans text-[12.5px] text-faint">
          Add a contact to the CRM first and this can draft to them.
        </p>
      ) : (
        <>
          <div className="grid gap-[15px] sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">To</Label>
              <Select
                items={Object.fromEntries(contacts.map((c) => [c.id, c.name]))}
                value={contactId}
                onValueChange={(value) => setContactId(value ?? "")}
              >
                <SelectTrigger className="w-full rounded-input border-line-input bg-page px-3 py-2.5 font-sans text-[13.5px] text-ink">
                  <SelectValue placeholder="Pick a contact" />
                </SelectTrigger>
                <SelectContent className="max-h-[260px] rounded-card border-line bg-paper shadow-menu ring-0">
                  {contacts.map((contact) => (
                    <SelectItem
                      key={contact.id}
                      value={contact.id}
                      className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
                    >
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">
                What does it need to do?
              </Label>
              <Input
                value={intent}
                placeholder="Ask if they'd speak at Demo Day in April"
                onChange={(event) => setIntent(event.target.value)}
                className="bg-page"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={isPending || !contactId || !intent.trim()}
            onClick={run}
            className="w-fit rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Drafting" : "Draft it"}
          </button>
        </>
      )}

      {draft && (
        <div className="flex flex-col gap-2.5 rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-page p-[15px]">
          {/* A draft written with no history behind it says so, rather than
              quietly implying a relationship that doesn't exist. */}
          <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            <InfoIcon className="size-3" />
            {draft.groundedIn > 0
              ? `grounded in ${draft.groundedIn} timeline ${draft.groundedIn === 1 ? "entry" : "entries"}`
              : "no prior contact — written as a first approach"}
          </span>
          <span className="font-sans text-[13.5px] font-medium text-ink">{draft.subject}</span>
          <p className="font-sans text-[13px] leading-[1.75] whitespace-pre-wrap text-body">
            {draft.body}
          </p>
          <button
            type="button"
            onClick={copy}
            className="flex w-fit items-center gap-1.5 rounded-btn border border-[rgba(35,32,28,0.14)] px-[13px] py-[8px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
          >
            {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <span className="font-sans text-[11.5px] text-faint">
            Nothing is sent. Read it, fix it, and send it yourself.
          </span>
        </div>
      )}
    </div>
  );
}
