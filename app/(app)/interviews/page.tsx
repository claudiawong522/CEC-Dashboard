import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { InterviewAdmin, type Cycle, type Slot } from "@/components/interviews/InterviewAdmin";
import { formatSlot } from "@/lib/validation/interview-schemas";
import { Sticker } from "@/components/decor/Sticker";
import { Seal, TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";

export default async function InterviewsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role === "view") redirect("/calendar");

  const supabase = await createClient();
  const isAdmin = session.profile.role === "admin";

  const { data: cycle } = await supabase
    .from("interview_cycles")
    .select("id, name, approved_netids, is_active")
    .eq("is_active", true)
    .maybeSingle<Cycle>();

  const { data: slots } = cycle
    ? await supabase
        .from("interview_slots")
        .select(
          "id, start_time, end_time, location, applicant_netid, is_claimed, " +
            "interviewer:profiles!interview_slots_interviewer_id_fkey(full_name, email)",
        )
        .eq("cycle_id", cycle.id)
        .order("start_time")
        .returns<Slot[]>()
    : { data: [] as Slot[] };

  const all = slots ?? [];
  const mine = all.filter(
    (slot) => slot.interviewer?.email === session.profile.email && slot.is_claimed,
  );

  return (
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={4} seed={81} opacity={0.2} />

      <PageHeader
        className="relative z-10"
        title="Interviews"
        actions={
          cycle && (
            <Sticker floatVariant="none" wrapperClassName="shrink-0">
              <Seal label={`${all.filter((s) => s.is_claimed).length}/${all.length}`} size={40} />
            </Sticker>
          )
        }
      >
        {cycle ? `${cycle.name} is open.` : "No cycle is open right now."}
      </PageHeader>

      {/* An interviewer who isn't an admin only needs their own day. */}
      {mine.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2.5">
          <span className="t-eyebrow text-foreground/50">
            your interviews
          </span>
          <div className="overflow-hidden border border-line bg-background shadow-soft">
            {mine.map((slot, index) => (
              <div
                key={slot.id}
                className={`grid grid-cols-[1.6fr_1fr_auto] items-center gap-3 px-4 py-3 ${
                  index < mine.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="truncate font-sans text-[12.5px] text-foreground">
                  {formatSlot(slot.start_time, slot.end_time)}
                </span>
                <span className="truncate font-sans text-[12px] text-subtle">
                  {slot.location ?? "—"}
                </span>
                <span className="t-eyebrow justify-self-end text-foreground">
                  {slot.applicant_netid}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="relative z-10">
          <InterviewAdmin cycle={cycle ?? null} slots={all} />
        </div>
      ) : (
        mine.length === 0 && (
          <p className="relative z-10 border border-line bg-background px-4 py-8 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
            Nothing booked with you yet.
          </p>
        )
      )}
    </div>
  );
}
