import { redirect } from "next/navigation";
import Link from "next/link";
import { AlarmClockIcon } from "lucide-react";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { suggestFollowUps } from "@/lib/actions/agent";
import { MissingKeyNotice } from "@/components/ui/missing-key-notice";
import { CaptureCard } from "@/components/agent/CaptureCard";
import { DraftCard } from "@/components/agent/DraftCard";
import { Sticker } from "@/components/stickers/Sticker";
import { Confetti } from "@/components/stickers/shapes";

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
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float3"
          floatDuration="17s"
          wrapperClassName="pointer-events-none absolute right-[9%] top-1"
          className="pointer-events-auto opacity-[0.34]"
        >
          <Confetti size={70} />
        </Sticker>
      </div>

      <div className="relative z-10 flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Agent
        </h1>
        <span className="font-sans text-[12.5px] text-body">
          Drafts emails and turns notes into CRM records. It proposes; you confirm.
        </span>
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

      <div className="relative z-10 flex flex-col gap-[15px]">
        {followUps.length > 0 && (
          <div className="flex flex-col gap-2.5 rounded-card border border-[rgba(0,0,0,0.07)] bg-paper p-[19px]">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              gone quiet · {followUps.length}
            </span>
            {followUps.map((followUp) => (
              <Link
                key={followUp.contactId}
                href={`/crm/${followUp.contactId}`}
                className="flex items-center gap-2.5 rounded-chip px-2 py-1.5 transition-colors duration-200 hover:bg-wash"
              >
                <AlarmClockIcon className="size-3 shrink-0 text-faint" />
                <span className="shrink-0 font-sans text-[12.5px] font-medium text-ink">
                  {followUp.name}
                </span>
                <span className="truncate font-sans text-[12px] text-body">
                  {followUp.suggestion}
                </span>
                <span className="ml-auto shrink-0 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                  {followUp.staleDays}d
                </span>
              </Link>
            ))}
            <span className="font-sans text-[11.5px] text-faint">
              Worked out from the timeline, not asked of a model — who has gone quiet is a fact the
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
