"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { tagMember, untagMember } from "@/lib/actions/eventMembers";
import type { Profile } from "@/lib/auth/getSession";

function initials(member: Pick<Profile, "full_name" | "email">) {
  const source = member.full_name ?? member.email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TaggedMembersSection({
  eventId,
  taggedMembers,
  allMembers,
}: {
  eventId: string;
  taggedMembers: Profile[];
  allMembers: Profile[];
}) {
  const [tagged, setTagged] = useState(taggedMembers);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const taggedIds = useMemo(() => new Set(tagged.map((m) => m.id)), [tagged]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allMembers
      .filter((m) => !taggedIds.has(m.id))
      .filter(
        (m) => !q || (m.full_name ?? "").toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [allMembers, taggedIds, query]);

  function handleTag(member: Profile) {
    setTagged((prev) => [...prev, member]);
    setQuery("");
    setOpen(false);
    startTransition(async () => {
      try {
        await tagMember(eventId, member.id);
      } catch {
        toast.error("Couldn't tag member — try again");
        setTagged((prev) => prev.filter((m) => m.id !== member.id));
      }
    });
  }

  function handleUntag(member: Profile) {
    setTagged((prev) => prev.filter((m) => m.id !== member.id));
    startTransition(async () => {
      try {
        await untagMember(eventId, member.id);
      } catch {
        toast.error("Couldn't remove member — try again");
        setTagged((prev) => [...prev, member]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-[rgba(0,0,0,0.07)] pt-4">
      <Label className="font-sans text-[12px] font-normal text-body">Members</Label>
      <div className="flex flex-wrap items-center gap-2">
        {tagged.map((member) => (
          <span
            key={member.id}
            className="flex items-center gap-1.5 rounded-[20px] border border-line-input bg-page py-1 pr-1.5 pl-1"
          >
            <Avatar size="sm">
              <AvatarImage src={member.avatar_url ?? undefined} alt="" />
              <AvatarFallback className="font-sans text-[9px]">{initials(member)}</AvatarFallback>
            </Avatar>
            <span className="font-sans text-[12.5px] text-ink">{member.full_name ?? member.email}</span>
            <button
              type="button"
              onClick={() => handleUntag(member)}
              aria-label={`Remove ${member.full_name ?? member.email}`}
              className="flex size-4 items-center justify-center rounded-full text-faint transition-colors duration-150 hover:bg-wash hover:text-ink"
            >
              ×
            </button>
          </span>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger className="rounded-input border border-line-input bg-paper px-[13px] py-[7px] font-sans text-[12.5px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink">
            + Tag member
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members..."
            />
            <div className="flex max-h-56 flex-col gap-0.5 overflow-y-auto">
              {results.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleTag(member)}
                  className="flex items-center gap-2 rounded-[8px] px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-wash"
                >
                  <Avatar size="sm">
                    <AvatarImage src={member.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="font-sans text-[9px]">{initials(member)}</AvatarFallback>
                  </Avatar>
                  <span className="flex flex-col">
                    <span className="font-sans text-[12.5px] text-ink">
                      {member.full_name ?? member.email}
                    </span>
                    {member.full_name && (
                      <span className="font-sans text-[10.5px] text-faint">{member.email}</span>
                    )}
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <span className="px-1.5 py-2 font-sans text-[12px] text-faint">
                  {query ? "No matches" : "Everyone's tagged"}
                </span>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
