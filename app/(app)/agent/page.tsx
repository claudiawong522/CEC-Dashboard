import { redirect } from "next/navigation";
import Link from "next/link";
import { AlarmClockIcon } from "lucide-react";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { suggestFollowUps } from "@/lib/actions/agent";
import { MissingKeyNotice } from "@/components/ui/missing-key-notice";
import { CaptureCard } from "@/components/agent/CaptureCard";
import { DraftCard } from "@/components/agent/DraftCard";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";

export default async function AgentPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Everything here reads and writes the CRM, which is admin-only end to end.
  if (session.profile.role !== "admin") redirect("/calendar");

  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  const supabase = await createClient();
  const [{ data: contacts }, followUps] = await Promise.all([
    supabase
      .from("outreach_contacts")
      .select("id, name")
      .order("name")
      .limit(200)
      .returns<{ id: string; name: string }[]>(),
    suggestFollowUps(),
  ]);

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={33} opacity={0.2} />
      </div>

      <div className="relative z-10">
        <PageHeader title="Agent">
          Drafts emails and turns notes into CRM records. It proposes; you confirm.
        </PageHeader>
      </div>

      {!hasKey && (
        <div className="relative z-10">
          <MissingKeyNotice
            feature="The agent's drafting and capture"
            isAdmin
            stillWorks="The follow-up suggestions below are worked out from the CRM timeline, not a model, so they still work."
          />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4">
        {followUps.length > 0 && (
          <div className="flex flex-col gap-2.5 border border-line bg-background p-5 shadow-soft">
            <span className="t-eyebrow text-foreground/50">
              gone quiet · {followUps.length}
            </span>
            {followUps.map((followUp) => (
              <Link
                key={followUp.contactId}
                href={`/crm/${followUp.contactId}`}
                className="flex items-center gap-2.5 px-2 py-1.5 transition-colors duration-200 ease-fluid hover:bg-muted/40"
              >
                <AlarmClockIcon className="size-3 shrink-0 text-foreground/50" />
                <span className="shrink-0 font-sans text-[13px] font-medium text-foreground">
                  {followUp.name}
                </span>
                <span className="truncate font-sans text-[12.5px] text-subtle">
                  {followUp.suggestion}
                </span>
                <span className="t-eyebrow ml-auto shrink-0 text-foreground/50">
                  {followUp.staleDays}d
                </span>
              </Link>
            ))}
            <span className="font-sans text-[12px] text-foreground/50">
              Worked out from the timeline, not asked of a model. Who has gone quiet is a fact the
              database already knows.
            </span>
          </div>
        )}

        <CaptureCard />
        <DraftCard contacts={contacts ?? []} />
      </div>
    </div>
  );
}
