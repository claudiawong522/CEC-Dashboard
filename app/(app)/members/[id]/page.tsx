import { notFound, redirect } from "next/navigation";
import Link from "next/link";
// lucide dropped its brand icons in v1, so LinkedIn gets the generic link
// glyph and the label carries the meaning.
import { ArrowLeftIcon, GlobeIcon, LinkIcon } from "lucide-react";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { MEMBER_COLUMNS, classLabel, memberInitials, type MemberProfile } from "@/lib/types/members";
import { TEAM_COLORS, TEAM_LABELS } from "@/lib/validation/member-schemas";
import { TriangleScatter } from "@/components/decor/shapes";
import { buttonVariants } from "@/components/ui/button";

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="t-eyebrow text-foreground/50">{label}</span>
      <span className="font-sans text-[13.5px] text-foreground">{value}</span>
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
    <div className="relative flex flex-col gap-6">
      <Link
        href="/members"
        className="link-underline flex w-fit items-center gap-1.5 font-sans text-[12px] text-foreground/50 transition-colors duration-200 hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        Members
      </Link>

      <div className="relative overflow-hidden border border-line bg-background p-5 shadow-soft">
        <TriangleScatter count={4} seed={21} opacity={0.18} />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-[52px] shrink-0 items-center justify-center border-2 border-foreground bg-muted/40 font-display text-[16px] font-bold text-foreground">
              {memberInitials(member)}
            </div>

            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="t-display text-[28px] text-foreground">
                {member.full_name ?? member.email}
                {member.pronouns && (
                  <span className="ml-2 font-sans text-[14px] font-normal normal-case tracking-normal text-foreground/50">
                    ({member.pronouns})
                  </span>
                )}
              </h1>
              <span className="font-sans text-[12.5px] text-subtle">
                {[member.position, classLabel(member.graduation_year), member.hometown]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>

            {isSelf && (
              <Link
                href="/profile"
                className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto" })}
              >
                Edit
              </Link>
            )}
          </div>

          {member.team && (
            <span className="t-eyebrow flex w-fit items-center gap-1.5 border border-line px-2 py-0.5 text-foreground">
              <span
                className="size-2"
                style={{ background: TEAM_COLORS[member.team] }}
              />
              {TEAM_LABELS[member.team]}
            </span>
          )}

          {member.about && (
            <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-subtle">
              {member.about}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
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
                  className="link-underline flex items-center gap-1.5 font-sans text-[12.5px] text-subtle transition-colors duration-200 hover:text-foreground"
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
                  className="link-underline flex items-center gap-1.5 font-sans text-[12.5px] text-subtle transition-colors duration-200 hover:text-foreground"
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
        <div className="border border-line bg-background p-5 shadow-soft">
          <div className="flex flex-col gap-2">
            <span className="t-eyebrow text-foreground/50">
              open to coffee chats
            </span>
            <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-subtle">
              {member.chat_blurb}
            </p>
            {member.interests.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {member.interests.map((interest) => (
                  <span
                    key={interest}
                    className="t-eyebrow border border-line px-2 py-0.5 text-foreground"
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
