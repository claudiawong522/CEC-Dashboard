import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { ExternalDetail } from "@/components/external/ExternalDetail";
import { flattenPeople, PERSON_EMBED } from "@/lib/types/external";
import type { IdeaRow, IdeaPersonJoin, AdminInfo } from "@/lib/types/external";
import { STAGE_LABELS } from "@/lib/validation/external-schemas";
import { PageHeader } from "@/components/ui/page-header";

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
      .select(PERSON_EMBED)
      .eq("idea_id", id)
      .order("created_at", { ascending: true })
      .returns<IdeaPersonJoin[]>(),
    supabase.from("external_idea_owners").select("profile_id").eq("idea_id", id),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .eq("status", "active"),
  ]);

  // The header is the lead as it was loaded; the Idea field below edits it
  // and autosaves, and the next visit shows the new name here.
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`External lead · ${STAGE_LABELS[idea.stage]}`}
        title={<span className="break-words">{idea.pitch.trim() || "Untitled lead"}</span>}
      />
      <ExternalDetail
        idea={idea}
        people={flattenPeople(people)}
        ownerIds={(owners ?? []).map((o) => o.profile_id)}
        admins={(admins ?? []) as (AdminInfo & { id: string })[]}
      />
    </div>
  );
}
