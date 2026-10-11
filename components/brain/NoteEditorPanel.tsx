"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { PartialBlock } from "@blocknote/core";
import { NotesEditor } from "@/components/notes/NotesEditorClient";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { deleteNote, saveNoteContent, updateNoteMeta } from "@/lib/actions/brain";
import {
  BRAIN_KINDS,
  BRAIN_KIND_COLORS,
  BRAIN_KIND_LABELS,
  type BrainKind,
} from "@/lib/validation/brain-schemas";
import type { BrainNoteWithContent } from "@/lib/types/brain";

const NONE = "__none__";

export function NoteEditorPanel({
  note,
  editable,
  canDelete,
  events,
  contacts,
}: {
  note: BrainNoteWithContent;
  editable: boolean;
  canDelete: boolean;
  events: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
}) {
  const router = useRouter();

  const [draft, setDraft] = useState({
    title: note.title,
    kind: note.kind,
    semester: note.semester ?? "",
    visibility: note.visibility,
    sourceUrl: note.source_url ?? "",
    eventId: note.event_id ?? NONE,
    contactId: note.contact_id ?? NONE,
  });

  const status = useAutoSave(draft, async (value) => {
    const result = await updateNoteMeta(note.id, {
      ...value,
      eventId: value.eventId === NONE ? null : value.eventId,
      contactId: value.contactId === NONE ? null : value.contactId,
    });
    if (!result.ok) {
      toast.error(result.message);
      throw new Error(result.message);
    }
  });

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function remove() {
    const result = await deleteNote(note.id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message ?? "Deleted");
    router.replace("/brain");
  }

  // A captured note has a body but no block document yet, so it starts as
  // one paragraph per line of that body. The first edit then saves real
  // blocks and the sync trigger keeps body in step, instead of an empty
  // editor overwriting the paste.
  const initialContent: PartialBlock[] = Array.isArray(note.content)
    ? (note.content as PartialBlock[])
    : note.body.trim()
      ? note.body.split("\n").map((line) => ({ type: "paragraph", content: line }))
      : [];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/brain"
        className="link-underline -my-3 flex min-h-11 w-fit items-center gap-1.5 font-sans text-[12px] text-foreground/50 transition-colors duration-200 hover:text-foreground md:my-0 md:min-h-0"
      >
        <ArrowLeftIcon className="size-3.5" />
        Brain
      </Link>

      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="size-2 shrink-0" style={{ background: BRAIN_KIND_COLORS[draft.kind] }} />
            Brain note · {BRAIN_KIND_LABELS[draft.kind]}
          </span>
        }
        title={<span className="break-words">{draft.title.trim() || "Untitled"}</span>}
        actions={
          <>
            <SaveIndicator status={status} />
            {canDelete && (
              <ConfirmButton
                trigger={<Trash2Icon className="size-4" />}
                triggerTitle="Delete this note"
                triggerClassName="inline-flex size-9 items-center justify-center border-2 border-foreground text-foreground transition-colors duration-200 ease-fluid hover:border-red hover:bg-red hover:text-background max-md:size-11"
                askLabel="Delete note?"
                yesLabel="Delete"
                cancelLabel="Keep"
                onConfirm={remove}
              />
            )}
          </>
        }
      />

      <div className="flex flex-col gap-4 border border-line bg-background p-4 shadow-soft sm:p-5">
        <Field label="Title">
          <Input
            value={draft.title}
            disabled={!editable}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kind">
            <Picker
              value={draft.kind}
              disabled={!editable}
              onChange={(value) => set("kind", value as BrainKind)}
              options={BRAIN_KINDS.map((value) => ({ value, label: BRAIN_KIND_LABELS[value] }))}
            />
          </Field>
          <Field label="Semester">
            <Input
              value={draft.semester}
              disabled={!editable}
              placeholder="F26"
              onChange={(event) => set("semester", event.target.value)}
            />
          </Field>
          <Field label="Visible to">
            <Picker
              value={draft.visibility}
              disabled={!editable}
              onChange={(value) => set("visibility", value as "exec" | "club")}
              options={[
                { value: "club", label: "Whole club" },
                { value: "exec", label: "Exec only" },
              ]}
            />
          </Field>

          <Field label="About which event">
            <Picker
              value={draft.eventId}
              disabled={!editable}
              onChange={(value) => set("eventId", value)}
              placeholder="Not about an event"
              options={events.map((event) => ({ value: event.id, label: event.name }))}
            />
          </Field>
          <Field label="About which contact">
            <Picker
              value={draft.contactId}
              disabled={!editable}
              onChange={(value) => set("contactId", value)}
              placeholder="Not about a contact"
              options={contacts.map((contact) => ({ value: contact.id, label: contact.name }))}
            />
          </Field>
          <Field label="Source">
            <Input
              value={draft.sourceUrl}
              disabled={!editable}
              placeholder="https://…"
              onChange={(event) => set("sourceUrl", event.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="relative">
        <span className="absolute top-0.5 bottom-0.5 -left-3 w-[3px] bg-mint sm:-left-4" />
        {/* The editor writes `content`; a database trigger keeps `body` in
            sync from it, so what gets typed here is searchable without the
            page having to flatten anything itself. */}
        <NotesEditor
          initialContent={initialContent}
          editable={editable}
          onSave={(content) => saveNoteContent(note.id, content)}
        />
      </div>

      <span className="font-sans text-[12px] text-foreground/50">
        Autosaves. Everything written here is searchable and answerable from the ask bar.
      </span>
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

function Picker({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select
      items={{
        ...(placeholder ? { [NONE]: placeholder } : {}),
        ...Object.fromEntries(options.map((option) => [option.value, option.label])),
      }}
      value={value}
      onValueChange={(next) => onChange(next ?? NONE)}
      disabled={disabled}
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
           
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
