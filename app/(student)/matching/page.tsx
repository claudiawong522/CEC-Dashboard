import { redirect } from "next/navigation";
import { getStudent } from "@/lib/auth/getStudent";
import { createClient } from "@/lib/supabase/server";
import {
  StudentDirectory,
  type MyRequest,
  type OpenMember,
} from "@/components/matching/StudentDirectory";

export default async function MatchingPage() {
  const student = await getStudent();
  if (!student) redirect("/login");

  const supabase = await createClient();

  // chat_directory, not profiles. The view exists precisely so this page can
  // exist: it exposes opted-in members and only the columns opting in is
  // about — no email, no netid. A student cannot read the profiles table at
  // all (0018).
  const [{ data: members }, { data: requests }] = await Promise.all([
    supabase
      .from("chat_directory")
      .select(
        "id, full_name, pronouns, major, graduation_year, team, position, interests, chat_blurb",
      )
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<OpenMember[]>(),
    supabase
      .from("chat_requests")
      .select("id, profile_id, status, created_at")
      .order("created_at", { ascending: false })
      .returns<MyRequest[]>(),
  ]);

  return (
    <div className="flex flex-col gap-[19px]">
      <div className="flex flex-col gap-[7px]">
        <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Chat with a member
        </h1>
        <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
          These are club members who said they&rsquo;re happy to talk to people thinking about
          joining. Pick someone whose work sounds interesting and tell them what you&rsquo;d like to
          talk about. You&rsquo;re signed in as {student.email}.
        </p>
      </div>

      <StudentDirectory
        members={members ?? []}
        myRequests={requests ?? []}
        studentName={student.name ?? ""}
      />
    </div>
  );
}
