import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { InterviewAdmin, type Cycle, type Slot } from "@/components/interviews/InterviewAdmin";
import { formatSlot } from "@/lib/validation/interview-schemas";
import { Sticker } from "@/components/stickers/Sticker";
import { Seal } from "@/components/stickers/shapes";

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
    <div className="relative flex flex-col gap-[17px]">
      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Interviews
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            {cycle ? `${cycle.name} is open.` : "No cycle is open right now."}
          </span>
        </div>
        {cycle && (
          <Sticker floatVariant="none" wrapperClassName="shrink-0">
            <Seal label={`${all.filter((s) => s.is_claimed).length}/${all.length}`} size={40} />
          </Sticker>
        )}
      </div>

      {/* An interviewer who isn't an admin only needs their own day. */}
      {mine.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2.5">
          <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            your interviews
          </span>
          <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
            {mine.map((slot, index) => (
              <div
                key={slot.id}
                className={`grid grid-cols-[1.6fr_1fr_auto] items-center gap-3 px-[15px] py-3 ${
                  index < mine.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
                }`}
              >
                <span className="truncate font-sans text-[12.5px] text-ink">
                  {formatSlot(slot.start_time, slot.end_time)}
                </span>
                <span className="truncate font-sans text-[12px] text-body">
                  {slot.location ?? "—"}
                </span>
                <span className="justify-self-end font-mono text-[11px] text-strong">
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
          <p className="relative z-10 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
            Nothing booked with you yet.
          </p>
        )
      )}
    </div>
  );
}
