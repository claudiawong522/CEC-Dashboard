"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateOwnMatching } from "@/lib/actions/members";
import {
  INTEREST_TAGS,
  isInterestTag,
  labelForTag,
  onlyKnownTags,
} from "@/lib/utils/interests";
import type { MemberProfile } from "@/lib/types/members";

const MAX_INTERESTS = 8;

// Coffee-chat matching is opt-in, and opting in publishes a blurb to
// prospective students who are not club members. That's a different audience
// from the rest of the profile, so it gets its own card and its own save —
// turning it off should take one toggle and no thought about the rest of the
// page.
export function MatchingCard({ member }: { member: MemberProfile }) {
  const [openToChats, setOpenToChats] = useState(member.open_to_chats);
  const [interests, setInterests] = useState<string[]>(member.interests);
  const [blurb, setBlurb] = useState(member.chat_blurb ?? "");

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

  // Split once: what counts for matching, and what predates the list.
  const known = onlyKnownTags(interests);
  const legacy = interests.filter((value) => !isInterestTag(value.trim().toLowerCase()));

  function toggleInterest(tag: string) {
    if (known.includes(tag as never)) {
      setInterests((current) =>
        current.filter((value) => value.trim().toLowerCase() !== tag),
      );
      return;
    }
    if (known.length >= MAX_INTERESTS) {
      toast.error(`${MAX_INTERESTS} interests is plenty`);
      return;
    }
    setInterests((current) => [...current, tag]);
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="t-eyebrow text-foreground/50">
          coffee chats
        </span>
        <SaveIndicator status={status} />
      </div>

      <label className="flex items-center justify-between gap-4">
        <span className="flex flex-col gap-0.5">
          <span className="font-sans text-[13.5px] text-foreground">
            Open to chats with prospective members
          </span>
          <span className="font-sans text-[11.5px] text-foreground/50">
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
            ? "flex flex-col gap-4"
            : "pointer-events-none flex flex-col gap-4 opacity-45"
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label>
            What you&rsquo;re happy to chat about
          </Label>
          <Textarea
            value={blurb}
            maxLength={280}
            placeholder="Happy to talk about breaking into hardware, Cornell CS, or why our build nights run late."
            onChange={(event) => setBlurb(event.target.value)}
          />
          <span className="t-eyebrow self-end text-foreground/50">
            {blurb.length} / 280
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Label>
            Interests{" "}
            <span className="text-foreground/50">
              ({known.length}/{MAX_INTERESTS})
            </span>
          </Label>
          {/* Picked from a fixed list rather than typed. Matching a prospective
              member to you is the overlap between their tags and yours, and
              free text made that impossible: "Hardware" and "hardware
              startups" are the same interest and never compared equal. */}
          <div className="flex flex-wrap gap-1.5">
            {INTEREST_TAGS.map((tag) => {
              const on = known.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleInterest(tag)}
                  className={`t-eyebrow border px-2 py-1 transition-[background-color,border-color,color] duration-200 ease-fluid ${
                    on
                      ? "border-foreground bg-mint text-foreground"
                      : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {labelForTag(tag)}
                </button>
              );
            })}
          </div>

          {legacy.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-sans text-[11.5px] text-foreground/50">
                These were typed before the list existed, so they don&rsquo;t count
                towards matching:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {legacy.map((interest) => (
                  <span
                    key={interest}
                    className="t-eyebrow flex items-center gap-1.5 border border-line px-2 py-0.5 text-foreground/50"
                  >
                    {interest}
                    <button
                      type="button"
                      aria-label={`Remove ${interest}`}
                      onClick={() =>
                        setInterests((current) => current.filter((value) => value !== interest))
                      }
                      className="transition-colors duration-200 hover:text-red"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
