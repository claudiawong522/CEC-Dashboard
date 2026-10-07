import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, type MemberProfile } from "@/lib/types/members";
import { MemberDirectory } from "@/components/members/MemberDirectory";
import { MembersDecor } from "@/components/members/MembersDecor";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="relative flex flex-col gap-6">
      <MembersDecor />
      <PageHeader
        className="relative z-10"
        title="Members"
        actions={
          <Link href="/profile" className={buttonVariants({ variant: "outline" })}>
            Edit your profile
          </Link>
        }
      >
        Everyone in the club, what they work on, and who&rsquo;s up for a coffee chat.
      </PageHeader>

      <div className="relative z-10">
        <MemberDirectory members={members ?? []} />
      </div>
    </div>
  );
}
