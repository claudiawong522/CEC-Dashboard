import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { NotesEditor } from "@/components/notes/NotesEditor";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon, HighlighterBar } from "@/components/stickers/shapes";

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
    <div className="relative flex flex-col gap-[17px]">
      <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
        Notes
      </h1>
      <div className="relative overflow-hidden rounded-card border border-[rgba(35,32,28,0.1)] bg-paper px-6 py-[22px]">
        <Sticker
          floatVariant="float3"
          floatDuration="17s"
          wrapperClassName="pointer-events-none absolute -top-3 -right-3 z-0"
          className="pointer-events-none opacity-[0.09]"
        >
          <StarPolygon size={64} />
        </Sticker>
        <div className="relative z-10">
          <NotesEditor initialContent={content} editable={editable} />
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="font-sans text-[11.5px] text-faint">
          Autosaves. View-role members see the same page read-only, with no handles or slash menu.
        </span>
        <Sticker floatVariant="none" className="opacity-40 hover:opacity-70">
          <HighlighterBar width={30} height={9} />
        </Sticker>
      </div>
    </div>
  );
}
