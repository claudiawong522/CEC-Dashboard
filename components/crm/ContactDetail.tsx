"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
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
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { deleteContact, updateContact } from "@/lib/actions/crm";
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  CONTACT_TYPES,
  VISIBILITIES,
  type ContactStatus,
  type ContactType,
  type Visibility,
} from "@/lib/validation/crm-schemas";
import type { ContactWithOrg, Interaction, Organization } from "@/lib/types/crm";
import type { ChatPerson } from "@/lib/types/coffee-chats";
import { InteractionTimeline } from "@/components/crm/InteractionTimeline";

const NONE = "__none__";

export function ContactDetail({
  contact,
  interactions,
  organizations,
  admins,
}: {
  contact: ContactWithOrg;
  interactions: Interaction[];
  organizations: Organization[];
  admins: ChatPerson[];
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const [draft, setDraft] = useState({
    name: contact.name,
    email: contact.email ?? "",
    company: contact.company ?? "",
    title: contact.title ?? "",
    type: contact.type,
    status: contact.status,
    notes: contact.notes ?? "",
    assignedTo: contact.assigned_to ?? NONE,
    organizationId: contact.organization_id ?? NONE,
    visibility: contact.visibility,
    source: contact.source ?? "",
    linkedinUrl: contact.linkedin_url ?? "",
    nextFollowUpAt: contact.next_follow_up_at ? contact.next_follow_up_at.slice(0, 10) : "",
  });

  const status = useAutoSave(draft, async (value) => {
    const result = await updateContact(contact.id, {
      ...value,
      assignedTo: value.assignedTo === NONE ? null : value.assignedTo,
      organizationId: value.organizationId === NONE ? null : value.organizationId,
    });
    if (!result.ok) {
      toast.error(result.message);
      throw new Error(result.message);
    }
  });

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function remove() {
    startDelete(async () => {
      const result = await deleteContact(contact.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Deleted");
      router.replace("/crm");
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/crm"
        className="link-underline flex w-fit items-center gap-1.5 font-sans text-[12px] text-foreground/50 transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        CRM
      </Link>

      <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h1 className="t-display text-[28px] text-foreground">
            {draft.name || "Unnamed contact"}
          </h1>
          <div className="flex items-center gap-2.5">
            <SaveIndicator status={status} />
            <button
              type="button"
              disabled={isDeleting}
              aria-label="Delete this contact"
              onClick={remove}
              className="p-1.5 text-foreground/50 transition-colors duration-200 ease-fluid hover:bg-red/10 hover:text-red disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2Icon className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={draft.company} onChange={(e) => set("company", e.target.value)} />
          </Field>

          <Field label="Organization" hint="Groups everyone from the same place.">
            <Picker
              value={draft.organizationId}
              onChange={(value) => set("organizationId", value)}
              placeholder="No organization"
              options={organizations.map((org) => ({ value: org.id, label: org.name }))}
            />
          </Field>
          <Field label="Owner">
            <Picker
              value={draft.assignedTo}
              onChange={(value) => set("assignedTo", value)}
              placeholder="Unassigned"
              options={admins.map((admin) => ({
                value: admin.id,
                label: admin.full_name ?? admin.email,
              }))}
            />
          </Field>

          <Field label="Status">
            <Picker
              value={draft.status}
              onChange={(value) => set("status", value as ContactStatus)}
              options={CONTACT_STATUSES.map((value) => ({
                value,
                label: CONTACT_STATUS_LABELS[value],
              }))}
            />
          </Field>
          <Field label="Kind">
            <Picker
              value={draft.type}
              onChange={(value) => set("type", value as ContactType)}
              // Capitalised here rather than with a `capitalize` class: the
              // class styled the dropdown but left the trigger showing the raw
              // "speaker", since the label itself was the value.
              options={CONTACT_TYPES.map((value) => ({
                value,
                label: value.charAt(0).toUpperCase() + value.slice(1),
              }))}
            />
          </Field>

          <Field
            label="Visible to"
            hint="Exec keeps them to admins. Club opens them to every member."
          >
            <Picker
              value={draft.visibility}
              onChange={(value) => set("visibility", value as Visibility)}
              options={VISIBILITIES.map((value) => ({
                value,
                label: value === "exec" ? "Exec only" : "Whole club",
              }))}
            />
          </Field>
          <Field label="Follow up on">
            <Input
              type="date"
              value={draft.nextFollowUpAt}
              onChange={(e) => set("nextFollowUpAt", e.target.value)}
            />
          </Field>

          <Field label="LinkedIn">
            <Input value={draft.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} />
          </Field>
          <Field label="Source" hint="Where they came from.">
            <Input value={draft.source} onChange={(e) => set("source", e.target.value)} />
          </Field>
        </div>

        <Field label="Notes">
          <Textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} />
        </Field>

        {contact.last_touched_at && (
          <span className="t-eyebrow text-foreground/50">
            last touched{" "}
            {new Date(contact.last_touched_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        )}
      </div>

      <InteractionTimeline contactId={contact.id} interactions={interactions} />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="t-eyebrow text-foreground/50">{label}</Label>
      {children}
      {hint && <span className="font-sans text-[12px] text-foreground/50">{hint}</span>}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select
      // Without this the trigger shows the raw value: "identified", "exec",
      // "__none__". The options are already here, so the label map is free.
      items={{
        ...(placeholder ? { [NONE]: placeholder } : {}),
        ...Object.fromEntries(options.map((option) => [option.value, option.label])),
      }}
      value={value}
      onValueChange={(next) => onChange(next ?? NONE)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[260px]">
        {placeholder && (
          <SelectItem value={NONE}>
            {placeholder}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="capitalize"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
