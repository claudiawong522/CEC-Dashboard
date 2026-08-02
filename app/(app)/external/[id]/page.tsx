import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { ExternalDetail } from "@/components/external/ExternalDetail";
import type { IdeaRow, IdeaPersonRow, AdminInfo } from "@/lib/types/external";

export default async function ExternalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect("/calendar");

  const supabase = await createClient();

  const { data: idea } = await supabase
    .from("external_ideas")
    .select("*")
    .eq("id", id)
    .maybeSingle<IdeaRow>();

  if (!idea) notFound();

  const [{ data: people }, { data: owners }, { data: admins }] = await Promise.all([
    supabase
      .from("external_idea_people")
      .select("*")
      .eq("idea_id", id)
      .order("created_at", { ascending: true })
      .returns<IdeaPersonRow[]>(),
    supabase.from("external_idea_owners").select("profile_id").eq("idea_id", id),
    supabase.from("profiles").select("id, full_name, email").eq("role", "admin"),
  ]);

  return (
    <ExternalDetail
      idea={idea}
      people={people ?? []}
      ownerIds={(owners ?? []).map((o) => o.profile_id)}
      admins={(admins ?? []) as (AdminInfo & { id: string })[]}
    />
  );
}
