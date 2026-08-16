"use client";

import { useMemo, useState, useTransition } from "react";
import { SearchIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestChat } from "@/lib/actions/matching";
import {
  MAX_OPEN_PER_STUDENT,
  REQUEST_STATUS_LABELS,
  type RequestStatus,
} from "@/lib/validation/matching-schemas";
import { TEAM_COLORS, TEAM_LABELS, type Team } from "@/lib/validation/member-schemas";

export type OpenMember = {
  id: string;
  full_name: string | null;
  pronouns: string | null;
  major: string | null;
  graduation_year: number | null;
  team: Team | null;
  position: string;
  interests: string[];
  chat_blurb: string | null;
};

export type MyRequest = {
  id: string;
  profile_id: string;
  status: RequestStatus;
  created_at: string;
};

export function StudentDirectory({
  members,
  myRequests,
  studentName,
}: {
  members: OpenMember[];
  myRequests: MyRequest[];
  studentName: string;
}) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<OpenMember | null>(null);
  const [name, setName] = useState(studentName);
  const [prompt, setPrompt] = useState("");
  const [isPending, startTransition] = useTransition();

  const askedByProfile = useMemo(() => {
    const map = new Map<string, RequestStatus>();
    for (const request of myRequests) map.set(request.profile_id, request.status);
    return map;
  }, [myRequests]);

  const openCount = myRequests.filter((request) => request.status === "pending").length;

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter((member) =>
      [member.full_name, member.major, member.position, ...member.interests]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [members, query]);

  function send() {
    if (!target) return;
    startTransition(async () => {
      const result = await requestChat({
        profileId: target.id,
        studentName: name,
        prompt,
        // The member's own listed interests double as the topics, so a
        // student doesn't have to guess at tags to fill in.
        tags: target.interests.slice(0, 5),
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Sent");
      setPrompt("");
      setTarget(null);
    });
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, major or what they talk about"
          className="w-full rounded-input border border-line-input bg-paper py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]"
        />
      </div>

      <span className="font-sans text-[11.5px] text-faint">
        {openCount} of {MAX_OPEN_PER_STUDENT} requests open. Wait for a reply before sending more.
      </span>

      {visible.length === 0 ? (
        <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
          Nobody is taking chat requests right now. Check back after recruitment opens.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {visible.map((member) => {
            const asked = askedByProfile.get(member.id);
            return (
              <div
                key={member.id}
                className="flex flex-col gap-2.5 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px]"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-sans text-[13.5px] font-medium text-ink">
                    {member.full_name ?? "A member"}
                    {member.pronouns && (
                      <span className="ml-1.5 font-normal text-faint">({member.pronouns})</span>
                    )}
                  </span>
                  <span className="font-sans text-[11.5px] text-faint">
                    {[
                      member.position,
                      member.major,
                      member.graduation_year ? `class of ${member.graduation_year}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>

                {member.chat_blurb && (
                  <p className="font-sans text-[12.5px] leading-[1.7] text-body">
                    {member.chat_blurb}
                  </p>
                )}

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
                  {member.interests.slice(0, 3).map((interest) => (
                    <span
                      key={interest}
                      className="rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                {asked ? (
                  <span className="mt-auto font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                    {REQUEST_STATUS_LABELS[asked]}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTarget(member)}
                    className="mt-auto w-fit rounded-btn bg-ink px-[15px] py-[9px] font-sans text-[12.5px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975]"
                  >
                    Ask for a chat
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="rounded-card border-line bg-paper sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
              Ask {target?.full_name ?? "them"} for a chat
            </DialogTitle>
            <DialogDescription className="font-sans text-[12.5px] text-body">
              They&rsquo;ll see your name, your Cornell email, and what you write here.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-[15px]">
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">Your name</Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="bg-page"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="font-sans text-[12px] font-normal text-body">
                What would you like to talk about?
              </Label>
              <Textarea
                value={prompt}
                maxLength={600}
                placeholder="I'm a sophomore in ECE thinking about hardware startups and wanted to hear how you got into building."
                onChange={(event) => setPrompt(event.target.value)}
                className="bg-page"
              />
              <span className="self-end font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                {prompt.trim().length} / 600
              </span>
            </div>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || prompt.trim().length < 20}
              onClick={send}
              className="rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
            >
              {isPending ? "Sending" : "Send"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
