import { notFound, redirect } from "next/navigation";
import Link from "next/link";
// lucide dropped its brand icons in v1, so LinkedIn gets the generic link
// glyph and the label carries the meaning.
import { ArrowLeftIcon, GlobeIcon, LinkIcon } from "lucide-react";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, classLabel, memberInitials, type MemberProfile } from "@/lib/types/members";
import { TEAM_COLORS, TEAM_LABELS } from "@/lib/validation/member-schemas";
import { Sticker } from "@/components/stickers/Sticker";
import { Sprig } from "@/components/stickers/shapes";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">{label}</span>
      <span className="font-sans text-[13.5px] text-ink">{value}</span>
    </div>
  );
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select(MEMBER_COLUMNS)
    .eq("id", id)
    .neq("status", "revoked")
    .maybeSingle<MemberProfile>();

  if (!member) notFound();

  const isSelf = member.id === session.profile.id;

  return (
    <div className="relative flex flex-col gap-[17px]">
      <Link
        href="/members"
        className="flex w-fit items-center gap-1.5 font-sans text-[12px] text-faint transition-colors duration-200 hover:text-ink"
      >
        <ArrowLeftIcon className="size-3.5" />
        Members
      </Link>

      <div className="relative overflow-hidden rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
        <Sticker
          floatVariant="float1"
          floatDuration="15s"
          wrapperClassName="pointer-events-none absolute -top-2 right-4"
          className="pointer-events-auto opacity-[0.3]"
        >
          <Sprig size={62} />
        </Sticker>

        <div className="relative z-10 flex flex-col gap-[15px]">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-[52px] shrink-0 items-center justify-center">
              {member.open_to_chats && (
                <div
                  className="absolute -inset-[3px] rounded-full opacity-75 blur-[2px]"
                  style={{
                    background:
                      "conic-gradient(from 200deg, var(--coral), var(--amber), var(--teal), var(--blue), var(--coral))",
                  }}
                />
              )}
              <div className="relative flex size-[52px] items-center justify-center rounded-full bg-wash font-sans text-[16px] font-medium text-strong">
                {memberInitials(member)}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
                {member.full_name ?? member.email}
                {member.pronouns && (
                  <span className="ml-2 text-[15px] font-normal text-faint">
                    ({member.pronouns})
                  </span>
                )}
              </h1>
              <span className="font-sans text-[12.5px] text-body">
                {[member.position, classLabel(member.graduation_year), member.hometown]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            {isSelf && (
              <Link
                href="/profile"
                className="ml-auto shrink-0 rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
              >
                Edit
              </Link>
            )}
          </div>

          {member.team && (
            <span className="flex w-fit items-center gap-1.5 rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase">
              <span
                className="size-[7px] rounded-full"
                style={{ background: TEAM_COLORS[member.team] }}
              />
              {TEAM_LABELS[member.team]}
            </span>
          )}

          {member.about && (
            <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
              {member.about}
            </p>
          )}

          <div className="grid gap-[15px] sm:grid-cols-3">
            <Field label="major" value={member.major} />
            <Field label="minor" value={member.minor} />
            <Field label="college" value={member.college} />
            <Field label="email" value={member.email} />
            {/* A netid is only shown to the person themselves and to admins.
                It's the Cornell-wide handle, and the directory doesn't need
                to publish everyone's to everyone. */}
            {(isSelf || session.profile.role === "admin") && (
              <Field label="netid" value={member.netid} />
            )}
          </div>

          {(member.linkedin_url || member.portfolio_url) && (
            <div className="flex flex-wrap items-center gap-2.5">
              {member.linkedin_url && (
                <a
                  href={member.linkedin_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 font-sans text-[12.5px] text-body underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline"
                >
                  <LinkIcon className="size-3.5" />
                  LinkedIn
                </a>
              )}
              {member.portfolio_url && (
                <a
                  href={member.portfolio_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 font-sans text-[12.5px] text-body underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline"
                >
                  <GlobeIcon className="size-3.5" />
                  Portfolio
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {member.open_to_chats && member.chat_blurb && (
        <div className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              open to coffee chats
            </span>
            <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
              {member.chat_blurb}
            </p>
            {member.interests.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {member.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
