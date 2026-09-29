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
    <div className="relative z-10 flex flex-col gap-[17px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, major, netid or interest"
            className="w-full rounded-input border border-line-input bg-paper py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]"
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
                  "flex items-center gap-1.5 rounded-[20px] border px-[11px] py-[6px] font-mono text-[9.5px] tracking-[0.1em] uppercase transition-[background-color,border-color,color] duration-200 ease-brand",
                  active
                    ? "border-transparent bg-cent-tint text-ink"
                    : "border-line-input bg-paper text-body hover:border-[rgba(35,32,28,0.24)] hover:text-ink",
                )}
              >
                <span
                  className="size-[7px] rounded-full"
                  style={{ background: TEAM_COLORS[value] }}
                />
                {TEAM_LABELS[value]}
                <span className="text-faint">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
          Nobody matches that yet.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className={cn(
                "group flex flex-col gap-2.5 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px] transition-[background-color,border-color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.14)] hover:bg-wash",
                !member.active && "opacity-60",
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative flex size-[34px] shrink-0 items-center justify-center">
                  {member.open_to_chats && (
                    // The bloom ring is the kit's "this one is special"
                    // treatment. Here it means open to coffee chats, which
                    // is the one thing worth spotting while scanning.
                    <div
                      className="absolute -inset-0.5 rounded-full opacity-75 blur-[2px]"
                      style={{
                        background:
                          "conic-gradient(from 200deg, var(--coral), var(--amber), var(--teal), var(--blue), var(--coral))",
                      }}
                    />
                  )}
                  <div className="relative flex size-[34px] items-center justify-center rounded-full bg-wash font-sans text-[11.5px] font-medium text-strong">
                    {memberInitials(member)}
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-sans text-[13.5px] font-medium text-ink">
                    {member.full_name ?? member.email}
                    {member.pronouns && (
                      <span className="ml-1.5 font-normal text-faint">({member.pronouns})</span>
                    )}
                  </span>
                  <span className="truncate font-sans text-[11.5px] text-faint">
                    {[member.position, classLabel(member.graduation_year)]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {member.team && (
                  <span className="flex items-center gap-1.5 rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase">
                    <span
                      className="size-[7px] rounded-full"
                      style={{ background: TEAM_COLORS[member.team] }}
                    />
                    {TEAM_LABELS[member.team]}
                  </span>
                )}
                {member.major && (
                  <span className="truncate font-sans text-[11.5px] text-body">{member.major}</span>
                )}
                {!member.active && (
                  <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                    inactive
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="font-sans text-[11.5px] text-faint">
          {visible.length} of {members.length} shown.
        </span>
        {inactiveCount > 0 && (
          <button
            type="button"
            onClick={() => setShowInactive((value) => !value)}
            className="font-sans text-[11.5px] text-faint underline-offset-2 transition-colors duration-200 hover:text-ink hover:underline"
          >
            {showInactive ? "Hide" : "Show"} {inactiveCount} inactive
          </button>
        )}
      </div>
    </div>
  );
}
