"use server";

import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";

const NOTES_DOC_ID = "00000000-0000-0000-0000-000000000001";

export async function saveNotesDoc(content: unknown) {
  const session = await requireRole("edit");
  const supabase = await createClient();

  const { error } = await supabase
    .from("notes_doc")
    .update({ content, updated_by: session.user.id, updated_at: new Date().toISOString() })
    .eq("id", NOTES_DOC_ID);

  if (error) throw new Error(error.message);
}
