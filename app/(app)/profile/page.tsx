import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, type MemberProfile } from "@/lib/types/members";
import { ProfileForm } from "@/components/members/ProfileForm";
import { MatchingCard } from "@/components/members/MatchingCard";
import { Sticker } from "@/components/stickers/Sticker";
import { Heart } from "@/components/stickers/shapes";

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
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float1"
          floatDuration="15s"
          wrapperClassName="pointer-events-none absolute right-[9%] top-1"
          className="pointer-events-auto opacity-[0.38]"
        >
          <Heart size={58} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Your profile
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            This is what the rest of the club sees in the directory.
          </span>
        </div>
        <Link
          href={`/members/${member.id}`}
          className="shrink-0 rounded-btn border border-[rgba(0,0,0,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(0,0,0,0.24)] hover:bg-wash hover:text-ink"
        >
          View as others see it
        </Link>
      </div>

      <div className="relative z-10 flex flex-col gap-[15px]">
        <ProfileForm member={member} />
        <MatchingCard member={member} />
      </div>

      <span className="font-sans text-[11.5px] text-faint">
        Changes save on their own. Your role and access are set by an admin.
      </span>
    </div>
  );
}
