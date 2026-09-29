"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { actionFailed, actionOk, type ActionResult } from "@/lib/actions/result";
import { currentTermKey } from "@/lib/utils/terms";
import {
  captureSchema,
  noteSchema,
  type CaptureInput,
  type NoteInput,
} from "@/lib/validation/brain-schemas";

function databaseFailure(what: string, error: { message: string }): ActionResult {
  console.error(`[brain] couldn't ${what}:`, error.message);
  return actionFailed(`Couldn't ${what} — try again`);
}

export async function createNote(
  input: NoteInput,
): Promise<ActionResult & { noteId?: string }> {
  const session = await requireRole("edit");

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_notes")
    .insert({
      author_id: session.profile.id,
      kind: values.kind,
      title: values.title,
      // Empty for now. The trigger from 0038 fills it from `content` the
      // moment anything is typed into the editor, so search stays correct
      // without the app having to remember to flatten the document.
      body: "",
      content: [],
      semester: values.semester ?? currentTermKey(),
      visibility: values.visibility,
      source_url: values.sourceUrl,
      event_id: values.eventId,
      contact_id: values.contactId,
    })
    .select("id")
    .single();

  if (error || !data) return databaseFailure("create that note", error ?? { message: "no row" });

  revalidatePath("/brain");
  return { ...actionOk(), noteId: data.id as string };
}

// Capture without opening the editor: a pasted retro, a link with a comment,
// something someone said in a meeting. Stored as plain body text with no
// block document, which is exactly the shape `body` exists for.
export async function captureNote(
  input: CaptureInput,
): Promise<ActionResult & { noteId?: string }> {
  const session = await requireRole("edit");

  const parsed = captureSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("brain_notes")
    .insert({
      author_id: session.profile.id,
      kind: values.kind,
      title: values.title,
      body: values.body,
      // Deliberately null rather than []: a captured note has no block
      // document, and the sync trigger only overwrites body when there is
      // one, so this is what keeps the pasted text intact.
      content: null,
      semester: currentTermKey(),
      visibility: "club",
      source_url: values.sourceUrl,
    })
    .select("id")
    .single();

  if (error || !data) return databaseFailure("capture that", error ?? { message: "no row" });

  revalidatePath("/brain");
  return { ...actionOk("Captured"), noteId: data.id as string };
}

export async function updateNoteMeta(noteId: string, input: NoteInput): Promise<ActionResult> {
  await requireRole("edit");

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) {
    return actionFailed(parsed.error.issues[0]?.message ?? "Check the form");
  }
  const values = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("brain_notes")
    .update({
      title: values.title,
      kind: values.kind,
      semester: values.semester,
      visibility: values.visibility,
      source_url: values.sourceUrl,
      event_id: values.eventId,
      contact_id: values.contactId,
    })
    .eq("id", noteId);

  if (error) return databaseFailure("save that note", error);

  revalidatePath("/brain");
  revalidatePath(`/brain/${noteId}`);
  return actionOk();
}

// Separate from the metadata save because it fires on a different rhythm:
// the editor autosaves every second of typing, the metadata form only when a
// field changes.
export async function saveNoteContent(noteId: string, content: unknown): Promise<void> {
  await requireRole("edit");
  const supabase = await createClient();

  const { error } = await supabase.from("brain_notes").update({ content }).eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/brain/${noteId}`);
}

export async function deleteNote(noteId: string): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { error } = await supabase.from("brain_notes").delete().eq("id", noteId);
  if (error) return databaseFailure("delete that note", error);

  revalidatePath("/brain");
  return actionOk("Deleted");
}

// A retro belongs to an event, and there should only ever be one per event —
// two retros for the same night is two half-written ones. If it already
// exists, this returns it rather than making a second.
export async function startRetroForEvent(
  eventId: string,
): Promise<ActionResult & { noteId?: string }> {
  const session = await requireRole("edit");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("brain_notes")
    .select("id")
    .eq("kind", "retro")
    .eq("event_id", eventId)
    .maybeSingle<{ id: string }>();

  if (existing) return { ...actionOk("Opening the existing retro"), noteId: existing.id };

  const { data: event } = await supabase
    .from("events")
    .select("name, event_date")
    .eq("id", eventId)
    .maybeSingle<{ name: string; event_date: string }>();

  if (!event) return actionFailed("That event no longer exists");

  const { data, error } = await supabase
    .from("brain_notes")
    .insert({
      author_id: session.profile.id,
      kind: "retro",
      title: `${event.name} retro`,
      body: "",
      content: [],
      semester: currentTermKey(),
      visibility: "club",
      event_id: eventId,
    })
    .select("id")
    .single();

  if (error || !data) return databaseFailure("start that retro", error ?? { message: "no row" });

  revalidatePath("/brain");
  return { ...actionOk(), noteId: data.id as string };
}

// Retrieval. Runs full-text and trigram side by side and unions them, because
// they fail in different directions: FTS misses misspellings and run-together
// words, trigram misses stemming. This is what the ask bar reads, so it is
// exported from here rather than inlined into a page.
export async function searchNotes(query: string, limit = 20) {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const columns = "id, kind, title, body, semester, visibility, event_id, contact_id, created_at";

  const [byText, byTitle] = await Promise.all([
    supabase
      .from("brain_notes")
      .select(columns)
      .textSearch("search_vector", trimmed, { type: "websearch", config: "english" })
      .limit(limit),
    supabase.from("brain_notes").select(columns).ilike("title", `%${trimmed}%`).limit(limit),
  ]);

  const seen = new Set<string>();
  const merged: Record<string, unknown>[] = [];
  // Full-text hits first: when both find something, the one that matched on
  // meaning is the better answer than the one that matched on spelling.
  for (const row of [...(byText.data ?? []), ...(byTitle.data ?? [])]) {
    const id = (row as { id: string }).id;
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(row as Record<string, unknown>);
  }

  return merged.slice(0, limit);
}
