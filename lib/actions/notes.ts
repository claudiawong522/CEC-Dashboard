"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import { CLUB_NOTES_ID } from "@/lib/types/brain";

// Since 0038 the shared club doc is a row in brain_notes of kind 'doc',
// carrying a fixed id so this stays a direct lookup rather than a search.
// Everything written here is now readable by the ask bar, which was the
// entire reason for folding it in: `body` is kept in sync with `content` by
// a database trigger, so the search index cannot fall behind the document.
// The id lives in lib/types/brain.ts: a "use server" module may only export
// async functions, and a plain const here invalidates every action in it.

export async function saveNotesDoc(content: unknown) {
  await requireRole("edit");
  const supabase = await createClient();

  const { error } = await supabase
    .from("brain_notes")
    // No author_id: the club doc is the one note with no single
    // author, and stamping the last editor there would also be the thing
    // that decides who may edit it under 0033's author-or-admin policy.
    .update({ content })
    .eq("id", CLUB_NOTES_ID);

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
  revalidatePath("/brain");
}
