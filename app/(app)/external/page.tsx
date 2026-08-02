import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { ExternalDecor } from "@/components/external/ExternalDecor";
import { QuickAdd } from "@/components/external/QuickAdd";
import { ExternalList } from "@/components/external/ExternalList";
import type { IdeaWithRelations } from "@/lib/types/external";

export default async function ExternalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect("/calendar");

  const supabase = await createClient();

  const [{ data: ideas }, { data: admins }] = await Promise.all([
    supabase
      .from("external_ideas")
      .select("*, external_idea_people(id, name, email), external_idea_owners(profile_id)")
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
    <div className="relative flex flex-col gap-[17px]">
      <ExternalDecor />
      <div className="relative z-10 flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          External
        </h1>
        <p className="font-sans text-[12.5px] text-body">
          Speaker outreach — every lead, no matter the stage. Admin only.
        </p>
      </div>
      <QuickAdd />
      <ExternalList ideas={ideas ?? []} adminsById={adminsById} />
    </div>
  );
}
