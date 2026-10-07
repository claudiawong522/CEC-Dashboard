import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, type MemberProfile } from "@/lib/types/members";
import { ProfileForm } from "@/components/members/ProfileForm";
import { MatchingCard } from "@/components/members/MatchingCard";
import { TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .eq("id", session.profile.id)
    .single<MemberProfile>();

  // getSession already proved this row exists and is active, so a miss here
  // means it was deleted mid-request. Sending them to login is the honest
  // outcome: their session no longer describes anything.
  if (!member) redirect("/login");

  return (
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={5} seed={91} opacity={0.2} />

      <PageHeader
        className="relative z-10"
        title="Your profile"
        actions={
          <Link href={`/members/${member.id}`} className={buttonVariants({ variant: "outline" })}>
            View as others see it
          </Link>
        }
      >
        This is what the rest of the club sees in the directory.
      </PageHeader>

      <div className="relative z-10 flex flex-col gap-4">
        <ProfileForm member={member} />
        <MatchingCard member={member} />
      </div>

      <span className="relative z-10 font-sans text-[11.5px] text-foreground/50">
        Changes save on their own. Your role and access are set by an admin.
      </span>
    </div>
  );
}
