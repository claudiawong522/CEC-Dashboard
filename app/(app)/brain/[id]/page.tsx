import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { BRAIN_NOTE_COLUMNS, type BrainNoteWithContent } from "@/lib/types/brain";
import { NoteEditorPanel } from "@/components/brain/NoteEditorPanel";

export default async function BrainNotePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();

  const { data: note } = await supabase
    .from("brain_notes")
    .select(BRAIN_NOTE_COLUMNS)
    .eq("id", id)
    .maybeSingle<BrainNoteWithContent>();

  // An exec-only note is filtered out by RLS for a non-admin, so a miss here
  // is either "gone" or "not yours". Both are a 404 on purpose: telling
  // someone a note exists but they may not read it is itself a disclosure.
  if (!note) notFound();

  const [{ data: events }, { data: contacts }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name")
      .order("event_date", { ascending: false })
      .limit(60)
      .returns<{ id: string; name: string }[]>(),
    // Non-admins can't see the CRM at all, and this select would come back
    // empty for them anyway under the contacts policy. Skipping it keeps the
    // picker honest rather than showing an empty dropdown.
    session.profile.role === "admin"
      ? supabase
          .from("outreach_contacts")
          .select("id, name")
          .order("name")
          .returns<{ id: string; name: string }[]>()
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  // Matches the update policies: an admin edits anything, an author edits
  // their own, and the shared club doc is editable by anyone with edit.
  const isAdmin = session.profile.role === "admin";
  const canEdit =
    isAdmin ||
    (session.profile.role === "edit" &&
      (note.kind === "doc" || note.author?.id === session.profile.id));

  return (
    <NoteEditorPanel
      note={note}
      editable={canEdit}
      canDelete={isAdmin}
      events={events ?? []}
      contacts={contacts ?? []}
    />
  );
}
