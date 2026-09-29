import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { NotesEditor } from "@/components/notes/NotesEditor";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon, HighlighterBar } from "@/components/stickers/shapes";

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

  return (
    <div className="relative flex flex-col gap-[22px]">
      <Sticker
        floatVariant="float3"
        floatDuration="17s"
        wrapperClassName="pointer-events-none absolute -top-8 right-0 z-0"
        className="pointer-events-none opacity-[0.18]"
      >
        <StarPolygon size={104} />
      </Sticker>

      <h1 className="relative z-10 font-sans text-[34px] leading-[1.15] font-medium tracking-[-0.026em] text-ink">
        Notes
      </h1>

      <div className="relative z-10">
        <span className="absolute top-0.5 bottom-0.5 -left-4 w-[2.5px] rounded-full bg-amber/50" />
        <NotesEditor initialContent={content} editable={editable} onSave={saveNotesDoc} />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="font-sans text-[11.5px] text-faint">
          Autosaves. View-role members see the same page read-only, with no handles or slash menu.
        </span>
        <Sticker floatVariant="none" className="opacity-70 hover:opacity-100">
          <HighlighterBar width={48} height={14} />
        </Sticker>
      </div>
    </div>
  );
}
