import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { NotesEditor } from "@/components/notes/NotesEditor";
import { PageHeader } from "@/components/ui/page-header";

import { saveNotesDoc } from "@/lib/actions/notes";
import { CLUB_NOTES_ID } from "@/lib/types/brain";

export default async function NotesPage() {
  const supabase = await createClient();
  const session = await getSession();

  // Since 0038 this doc is a brain note of kind 'doc', so everything written
  // here is searchable and answerable rather than sitting in a table nothing
  // else reads.
  const { data: doc } = await supabase
    .from("brain_notes")
    .select("content")
    .eq("id", CLUB_NOTES_ID)
    .maybeSingle();

  const editable = session?.profile.role === "edit" || session?.profile.role === "admin";
  const content = Array.isArray(doc?.content) ? doc.content : [];

  // No decor on this screen: nothing may ever sit over the editor.
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Notes" />

      <div className="relative">
        <span className="absolute top-0.5 bottom-0.5 -left-4 w-[3px] bg-mint" />
        <NotesEditor initialContent={content} editable={editable} onSave={saveNotesDoc} />
      </div>

      <span className="font-sans text-[12px] text-foreground/50">
        Autosaves. View-role members see the same page read-only, with no handles or slash menu.
      </span>
    </div>
  );
}
