import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { BRAIN_LIST_COLUMNS, type BrainNote } from "@/lib/types/brain";
import { BrainList } from "@/components/brain/BrainList";
import { CaptureDialog } from "@/components/brain/CaptureDialog";
import { Sticker } from "@/components/stickers/Sticker";
import { StarPolygon } from "@/components/stickers/shapes";

export default async function BrainPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  // No visibility filter here: the RLS policy on brain_notes already limits
  // exec-only notes to admins, and repeating it in the query is how the two
  // drift apart.
  const { data: notes } = await supabase
    .from("brain_notes")
    .select(BRAIN_LIST_COLUMNS)
    .order("updated_at", { ascending: false })
    .returns<BrainNote[]>();

  const canWrite = session.profile.role === "edit" || session.profile.role === "admin";

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float1"
          floatDuration="16s"
          wrapperClassName="pointer-events-none absolute right-[9%] top-0"
          className="pointer-events-auto opacity-[0.35]"
        >
          <StarPolygon size={72} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Brain
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Retros, notes and everything the club has bothered to write down.
          </span>
        </div>
        {canWrite && <CaptureDialog />}
      </div>

      <div className="relative z-10">
        <BrainList notes={notes ?? []} />
      </div>
    </div>
  );
}
