import { redirect } from "next/navigation";
import { getStudent } from "@/lib/auth/getStudent";
import { createClient } from "@/lib/supabase/server";
import { ApplicantSlots, type ApplicantSlot } from "@/components/interviews/ApplicantSlots";
import { PageHeader } from "@/components/ui/page-header";

export default async function ApplyPage() {
  const student = await getStudent();
  if (!student) redirect("/login");

  const netid = student.email.split("@")[0].toLowerCase();
  const supabase = await createClient();

  // No interviewer names and no cycle details here. The applicant policy in
  // 0036 returns slots in a cycle they're approved for; who is interviewing
  // and who else is booked are not theirs to see, and profiles is
  // members-only since 0039 anyway.
  const { data: slots } = await supabase
    .from("interview_slots")
    .select("id, start_time, end_time, location, is_claimed, applicant_netid")
    .order("start_time")
    .returns<ApplicantSlot[]>();

  const visible = (slots ?? []).map((slot) => ({
    ...slot,
    // Another applicant's netid is stripped before it reaches the browser.
    applicant_netid: slot.applicant_netid === netid ? slot.applicant_netid : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Book your interview">
        Pick a time that works. You&rsquo;re signed in as {student.email}.
      </PageHeader>

      <ApplicantSlots slots={visible} netid={netid} />
    </div>
  );
}
