import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";
import { QuickAdd } from "@/components/external/QuickAdd";
import { ExternalList } from "@/components/external/ExternalList";
import { sortIdeas } from "@/lib/utils/external-stage";
import { PERSON_EMBED } from "@/lib/types/external";
import type { IdeaWithRelations } from "@/lib/types/external";

export default async function ExternalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect("/calendar");

  const supabase = await createClient();

  const [{ data: ideas }, { data: admins }] = await Promise.all([
    supabase
      .from("external_ideas")
      .select(`*, external_idea_people(${PERSON_EMBED}), external_idea_owners(profile_id)`)
      .order("created_at", { ascending: false })
      .returns<IdeaWithRelations[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .eq("status", "active"),
  ]);

  const adminsById = Object.fromEntries(
    (admins ?? []).map((a) => [a.id, { full_name: a.full_name, email: a.email }]),
  );

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={5} seed={35} opacity={0.2} />
      </div>
      <div className="relative z-10">
        <PageHeader title="External">
          Speaker outreach: every lead, no matter the stage. Admin only.
        </PageHeader>
      </div>
      <div className="relative z-10">
        <QuickAdd />
      </div>
      <ExternalList ideas={sortIdeas(ideas ?? [])} adminsById={adminsById} />
    </div>
  );
}
