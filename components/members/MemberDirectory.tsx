"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "lucide-react";
import type { MemberProfile } from "@/lib/types/members";
import { classLabel, memberInitials } from "@/lib/types/members";
import { TEAMS, TEAM_COLORS, TEAM_LABELS, type Team } from "@/lib/validation/member-schemas";
import { cn } from "@/lib/utils";

// Filtering happens in the browser rather than as a round trip. A club
// directory is a few hundred rows at most, they're already all on the page,
// and typing into a filter that re-queries per keystroke feels worse than
// one that doesn't — this is the same trade Past Events makes with its term
// seals.
function matches(member: MemberProfile, query: string): boolean {
  if (!query) return true;
  const haystack = [
    member.full_name,
    member.email,
    member.netid,
    member.major,
    member.position,
    member.hometown,
    ...member.interests,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export function MemberDirectory({ members }: { members: MemberProfile[] }) {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState<Team | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const counts = useMemo(() => {
    const byTeam = new Map<Team, number>();
    for (const member of members) {
      if (!member.active && !showInactive) continue;
      if (member.team) byTeam.set(member.team, (byTeam.get(member.team) ?? 0) + 1);
    }
    return byTeam;
  }, [members, showInactive]);

  const visible = useMemo(
    () =>
      members.filter(
        (member) =>
          (showInactive || member.active) &&
          (team === null || member.team === team) &&
          matches(member, query),
      ),
    [members, query, team, showInactive],
  );

  const inactiveCount = members.filter((member) => !member.active).length;

  return (
    <div className="relative z-10 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, major, netid or interest"
            className="w-full border border-line bg-background py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {TEAMS.map((value) => {
            const active = team === value;
            const count = counts.get(value) ?? 0;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTeam(active ? null : value)}
                className={cn(
                  "t-eyebrow flex items-center gap-1.5 border px-2 py-1 transition-[background-color,border-color,color] duration-200 ease-fluid",
                  active
                    ? "border-foreground bg-mint text-foreground"
                    : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground",
                )}
              >
                <span
                  className="size-2"
                  style={{ background: TEAM_COLORS[value] }}
                />
                {TEAM_LABELS[value]}
                <span className="text-foreground/50">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border border-line bg-background px-4 py-8 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
          Nobody matches that yet.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className={cn(
                "group flex flex-col gap-2.5 border border-line bg-background p-4 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-1 hover:border-foreground hover:shadow-mint",
                !member.active && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5">
                {/* Open to coffee chats is the one thing worth spotting while
                    scanning, so that portrait sits on mint. */}
                <div
                  className={cn(
                    "flex size-[34px] shrink-0 items-center justify-center border-2 border-foreground font-display text-[11.5px] font-bold text-foreground",
                    member.open_to_chats ? "bg-mint" : "bg-muted/40",
                  )}
                >
                  {memberInitials(member)}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-sans text-[13.5px] font-medium text-foreground">
                    {member.full_name ?? member.email}
                    {member.pronouns && (
                      <span className="ml-1.5 font-normal text-foreground/50">({member.pronouns})</span>
                    )}
                  </span>
                  <span className="truncate font-sans text-[11.5px] text-foreground/50">
                    {[member.position, classLabel(member.graduation_year)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {member.team && (
                  <span className="t-eyebrow flex items-center gap-1.5 border border-line px-2 py-0.5 text-foreground">
                    <span
                      className="size-2"
                      style={{ background: TEAM_COLORS[member.team] }}
                    />
                    {TEAM_LABELS[member.team]}
                  </span>
                )}
                {member.major && (
                  <span className="truncate font-sans text-[11.5px] text-subtle">{member.major}</span>
                )}
                {!member.active && (
                  <span className="t-eyebrow text-foreground/50">
                    inactive
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-sans text-[11.5px] text-foreground/50">
          {visible.length} of {members.length} shown.
        </span>
        {inactiveCount > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive((value) => !value)}
            className="link-underline font-sans text-[11.5px] text-foreground/50 transition-colors duration-200 hover:text-foreground"
          >
            {showInactive ? "Hide" : "Show"} {inactiveCount} inactive
          </button>
        )}
      </div>
    </div>
  );
}
