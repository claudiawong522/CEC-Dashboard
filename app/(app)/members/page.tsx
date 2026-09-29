import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, type MemberProfile } from "@/lib/types/members";
import { MemberDirectory } from "@/components/members/MemberDirectory";
import { MembersDecor } from "@/components/members/MembersDecor";

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  // Same exclusion /admin makes: someone whose access was removed isn't a
  // member any more, so they don't appear here either. Inactive members do
  // appear (behind a toggle) — that's alumni, not removal.
  const { data: members } = await supabase
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .neq("status", "revoked")
    .order("full_name", { ascending: true, nullsFirst: false })
    .returns<MemberProfile[]>();

  return (
    <div className="relative flex flex-col gap-[17px]">
      <MembersDecor />
      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Members
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Everyone in the club, what they work on, and who&rsquo;s up for a coffee chat.
          </span>
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975]"
          style={{ boxShadow: "none" }}
        >
          Edit your profile
        </Link>
      </div>

      <MemberDirectory members={members ?? []} />
    </div>
  );
}
