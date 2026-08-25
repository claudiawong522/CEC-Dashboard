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
      // is a stub, and the next thing anyone does is fill the rest in — the
      // same reasoning External's quick-add already follows.
      if (result.contactId) router.push(`/crm/${result.contactId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex shrink-0 items-center gap-1.5 rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975]">
        <PlusIcon className="size-3.5" />
        Add contact
      </DialogTrigger>
      <DialogContent className="rounded-card border-line bg-paper sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
            New contact
          </DialogTitle>
          <DialogDescription className="font-sans text-[12.5px] text-body">
            Enough to find them again. The rest goes on their page.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-page" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Used to spot duplicates and match an organization"
              className="bg-page"
            />
          </div>
          <div className="grid gap-[15px] sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Company</Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-page"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Kind</Label>
              <Select
                items={CONTACT_TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType((v ?? "speaker") as ContactType)}
              >
                <SelectTrigger className="w-full rounded-input border-line-input bg-page px-3 py-2.5 font-sans text-[13.5px] text-ink">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-card border-line bg-paper shadow-menu ring-0">
                  {CONTACT_TYPES.map((value) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className="font-sans text-[12.5px] capitalize focus:bg-wash focus:text-ink"
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
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending || !name.trim()}
            onClick={submit}
            className="rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Adding" : "Add"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
