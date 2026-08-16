"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateOwnMatching } from "@/lib/actions/members";
import type { MemberProfile } from "@/lib/types/members";

const MAX_INTERESTS = 12;

// Coffee-chat matching is opt-in, and opting in publishes a blurb to
// prospective students who are not club members. That's a different audience
// from the rest of the profile, so it gets its own card and its own save —
// turning it off should take one toggle and no thought about the rest of the
// page.
export function MatchingCard({ member }: { member: MemberProfile }) {
  const [openToChats, setOpenToChats] = useState(member.open_to_chats);
  const [interests, setInterests] = useState<string[]>(member.interests);
  const [blurb, setBlurb] = useState(member.chat_blurb ?? "");
  const [pendingInterest, setPendingInterest] = useState("");

  const status = useAutoSave({ openToChats, interests, blurb }, async (value) => {
    const result = await updateOwnMatching({
      open_to_chats: value.openToChats,
      interests: value.interests,
      chat_blurb: value.blurb,
    });
    if (!result.ok) {
      toast.error(result.message);
      throw new Error(result.message);
    }
  });

  function addInterest() {
    const next = pendingInterest.trim().toLowerCase();
    setPendingInterest("");
    if (!next) return;
    if (interests.includes(next)) return;
    if (interests.length >= MAX_INTERESTS) {
      toast.error(`${MAX_INTERESTS} interests is plenty`);
      return;
    }
    setInterests((current) => [...current, next]);
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          coffee chats
        </span>
        <SaveIndicator status={status} />
      </div>

      <label className="flex items-center justify-between gap-4">
        <span className="flex flex-col gap-0.5">
          <span className="font-sans text-[13.5px] text-ink">
            Open to chats with prospective members
          </span>
          <span className="font-sans text-[11.5px] text-faint">
            Students outside the club can see your blurb and ask for a chat.
          </span>
        </span>
        <Switch checked={openToChats} onCheckedChange={setOpenToChats} />
      </label>

      {/* The rest of the card is only meaningful once the toggle is on, but
          it stays mounted rather than unmounting: someone turning it off for
          a semester shouldn't come back to an empty blurb they have to
          rewrite. It just stops being published. */}
      <div
        className={
          openToChats
            ? "flex flex-col gap-[15px]"
            : "pointer-events-none flex flex-col gap-[15px] opacity-45"
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">
            What you&rsquo;re happy to chat about
          </Label>
          <Textarea
            value={blurb}
            maxLength={280}
            placeholder="Happy to talk about breaking into hardware, Cornell CS, or why our build nights run late."
            onChange={(event) => setBlurb(event.target.value)}
          />
          <span className="self-end font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            {blurb.length} / 280
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Interests</Label>
          <div className="flex flex-wrap gap-1.5">
            {interests.map((interest) => (
              <span
                key={interest}
                className="flex items-center gap-1.5 rounded-[20px] border border-[rgba(35,32,28,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase"
              >
                {interest}
                <button
                  type="button"
                  aria-label={`Remove ${interest}`}
                  onClick={() =>
                    setInterests((current) => current.filter((value) => value !== interest))
                  }
                  className="transition-colors duration-200 hover:text-destructive"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <Input
            value={pendingInterest}
            placeholder="Add an interest, then press Enter"
            onChange={(event) => setPendingInterest(event.target.value)}
            onKeyDown={(event) => {
              // Comma as well as Enter: people type lists with commas out of
              // habit, and swallowing it here beats one tag reading
              // "hardware, robotics".
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addInterest();
              }
              if (event.key === "Backspace" && !pendingInterest) {
                setInterests((current) => current.slice(0, -1));
              }
            }}
            onBlur={addInterest}
          />
        </div>
      </div>
    </div>
  );
}
