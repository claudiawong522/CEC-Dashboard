"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createContact } from "@/lib/actions/crm";
import { CONTACT_TYPES, type ContactType } from "@/lib/validation/crm-schemas";

const CONTACT_TYPE_ITEMS = Object.fromEntries(
  CONTACT_TYPES.map((value) => [value, value.charAt(0).toUpperCase() + value.slice(1)]),
);

export function NewContactDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<ContactType>("speaker");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await createContact({
        name,
        email,
        company,
        title: "",
        type,
        status: "identified",
        notes: "",
        assignedTo: null,
        organizationId: null,
        visibility: "exec",
        source: "",
        linkedinUrl: "",
        nextFollowUpAt: "",
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setName("");
      setEmail("");
      setCompany("");
      setOpen(false);
      // Land on the new contact rather than staying on the list. A name alone
      // is a stub, and the next thing anyone does is fill the rest in, the
      // same reasoning External's quick-add already follows.
      if (result.contactId) router.push(`/crm/${result.contactId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="brutalist-border flex h-9 shrink-0 items-center gap-1.5 bg-mint px-4 font-display text-[12px] font-bold tracking-wide uppercase transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint">
        <PlusIcon className="size-3.5" />
        Add contact
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold text-foreground">
            New contact
          </DialogTitle>
          <DialogDescription className="font-sans text-[13px] text-subtle">
            Enough to find them again. The rest goes on their page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Used to spot duplicates and match an organization"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="t-eyebrow text-foreground/50">Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="t-eyebrow text-foreground/50">Kind</Label>
              <Select
                items={CONTACT_TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType((v ?? "speaker") as ContactType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_TYPES.map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="capitalize"
                    >
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending || !name.trim()} onClick={submit}>
            {isPending ? "Adding" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
