"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import type { PartialBlock } from "@blocknote/core";
import { NotesEditor } from "@/components/notes/NotesEditor";
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
  const [isDeleting, startDelete] = useTransition();

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

  function remove() {
    startDelete(async () => {
      const result = await deleteNote(note.id);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Deleted");
      router.replace("/brain");
    });
  }

  const initialContent = Array.isArray(note.content) ? (note.content as PartialBlock[]) : [];

  return (
    <div className="flex flex-col gap-[17px]">
      <Link
        href="/brain"
        className="flex w-fit items-center gap-1.5 font-sans text-[12px] text-faint transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeftIcon className="size-3.5" />
        Brain
      </Link>

      <div className="flex flex-col gap-[15px] rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="size-[7px] shrink-0 rounded-full"
              style={{ background: BRAIN_KIND_COLORS[draft.kind] }}
            />
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              {BRAIN_KIND_LABELS[draft.kind]}
            </span>
          </span>
          <span className="flex items-center gap-2.5">
            <SaveIndicator status={status} />
            {canDelete && (
              <button
                type="button"
                disabled={isDeleting}
                aria-label="Delete this note"
                onClick={remove}
                className="rounded-chip p-1.5 text-faint transition-colors duration-200 hover:bg-coral/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            )}
          </span>
        </div>

        <Input
          value={draft.title}
          disabled={!editable}
          onChange={(event) => set("title", event.target.value)}
          className="border-transparent bg-transparent px-0 font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink focus-visible:border-transparent focus-visible:ring-0"
        />

        <div className="grid gap-[15px] sm:grid-cols-3">
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
        <span className="absolute top-0.5 bottom-0.5 -left-4 w-[2.5px] rounded-full bg-amber/50" />
        {/* The editor writes `content`; a database trigger keeps `body` in
            sync from it, so what gets typed here is searchable without the
            page having to flatten anything itself. */}
        <NotesEditor
          initialContent={initialContent}
          editable={editable}
          onSave={(content) => saveNoteContent(note.id, content)}
        />
      </div>

      <span className="font-sans text-[11.5px] text-faint">
        Autosaves. Everything written here is searchable and answerable from the ask bar.
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-sans text-[12px] font-normal text-body">{label}</Label>
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
      <SelectTrigger className="w-full rounded-input border-line-input bg-paper px-3 py-2.5 font-sans text-[13.5px] text-ink">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-[260px] rounded-card border-line bg-paper shadow-menu ring-0">
        {placeholder && (
          <SelectItem value={NONE} className="font-sans text-[12.5px] focus:bg-wash">
            {placeholder}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
