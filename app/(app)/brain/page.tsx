import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { BRAIN_LIST_COLUMNS, type BrainNote } from "@/lib/types/brain";
import { BrainList } from "@/components/brain/BrainList";
import { CaptureDialog } from "@/components/brain/CaptureDialog";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";

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
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={31} opacity={0.2} />
      </div>

      <div className="relative z-10">
        <PageHeader title="Brain" actions={canWrite ? <CaptureDialog /> : undefined}>
          Retros, notes and everything the club has bothered to write down.
        </PageHeader>
      </div>

      <div className="relative z-10">
        <BrainList notes={notes ?? []} />
      </div>
    </div>
  );
}
