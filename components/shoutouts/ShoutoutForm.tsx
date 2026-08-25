"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { giveShoutout } from "@/lib/actions/shoutouts";
import type { ChatPerson } from "@/lib/types/coffee-chats";

const OUTSIDER = "__outsider__";

export function ShoutoutForm({ members }: { members: ChatPerson[] }) {
  const [receiverId, setReceiverId] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPending, startTransition] = useTransition();

  const namingOutsider = receiverId === OUTSIDER;

  function submit() {
    startTransition(async () => {
      const result = await giveShoutout({
        // Exactly one of these is set, which is what both the schema and the
        // table's num_nonnulls check require.
        receiverId: namingOutsider || !receiverId ? null : receiverId,
        receiverName: namingOutsider ? receiverName : null,
        message,
        isAnonymous,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setReceiverId("");
      setReceiverName("");
      setMessage("");
      setIsAnonymous(false);
      toast.success(result.message ?? "Posted");
    });
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[15px]">
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
        give a shoutout
      </span>

      <div className="grid gap-[15px] sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="font-sans text-[12px] font-normal text-body">Who?</Label>
          {/* Without items the trigger showed the selected member's raw uuid. */}
          <Select
            items={{
              ...Object.fromEntries(
                members.map((member) => [member.id, member.full_name ?? member.email]),
              ),
              [OUTSIDER]: "Someone outside the club",
            }}
            value={receiverId}
            onValueChange={(value) => setReceiverId(value ?? "")}
          >
            <SelectTrigger className="w-full rounded-input border-line-input bg-page px-3 py-2.5 font-sans text-[13.5px] text-ink">
              <SelectValue placeholder="Pick a member" />
            </SelectTrigger>
            <SelectContent className="max-h-[260px] rounded-card border-line bg-paper shadow-menu ring-0">
              {members.map((member) => (
                <SelectItem
                  key={member.id}
                  value={member.id}
                  className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
                >
                  {member.full_name ?? member.email}
                </SelectItem>
              ))}
              {/* Guest speakers and friends who turned up to help are worth
                  thanking and don't have a profile. */}
              <SelectItem
                value={OUTSIDER}
                className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
              >
                Someone outside the club
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {namingOutsider && (
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Their name</Label>
            <Input
              value={receiverName}
              onChange={(event) => setReceiverName(event.target.value)}
              className="bg-page"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="font-sans text-[12px] font-normal text-body">What did they do?</Label>
        <Textarea
          value={message}
          maxLength={500}
          placeholder="Stayed until 1am rewiring the demo table so it actually worked."
          onChange={(event) => setMessage(event.target.value)}
          className="bg-page"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2">
          <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          <span className="font-sans text-[12.5px] text-body">Post anonymously</span>
        </label>
        <button
          type="button"
          disabled={isPending}
          onClick={submit}
          className="rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? "Posting" : "Post"}
        </button>
      </div>
    </div>
  );
}
