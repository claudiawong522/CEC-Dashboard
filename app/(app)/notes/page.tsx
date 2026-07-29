import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { NotesEditor } from "@/components/notes/NotesEditor";

const NOTES_DOC_ID = "00000000-0000-0000-0000-000000000001";

export default async function NotesPage() {
  const supabase = await createClient();
  const session = await getSession();

  const { data: doc } = await supabase
    .from("notes_doc")
    .select("content")
    .eq("id", NOTES_DOC_ID)
    .maybeSingle();

  const editable = session?.profile.role === "edit" || session?.profile.role === "admin";
  const content = Array.isArray(doc?.content) ? doc.content : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium tracking-tight">Notes</h1>
      <div className="rounded-lg border border-stone-200">
        <NotesEditor initialContent={content} editable={editable} />
      </div>
    </div>
  );
}
