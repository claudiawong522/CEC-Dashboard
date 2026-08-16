"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { reviewChat } from "@/lib/actions/coffeeChats";
import type { CoffeeChat } from "@/lib/types/coffee-chats";

export function ReviewQueue({
  chats,
  selfieUrls,
}: {
  chats: CoffeeChat[];
  selfieUrls: Record<string, string>;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function decide(chatId: string, approve: boolean) {
    startTransition(async () => {
      const result = await reviewChat({ chatId, approve, note: notes[chatId] ?? "" });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done");
    });
  }

  if (chats.length === 0) {
    return (
      <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-6 text-center font-sans text-[13px] text-faint">
        Nothing waiting to be reviewed.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {chats.map((chat) => {
        const selfie = selfieUrls[chat.selfie_url];
        return (
          <div
            key={chat.id}
            className="flex flex-col gap-2.5 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px] sm:flex-row sm:items-center"
          >
            {selfie ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selfie}
                alt={`${chat.submitter?.full_name ?? "Member"} and ${chat.partner?.full_name ?? "their partner"}`}
                className="h-[76px] w-[104px] shrink-0 rounded-[8px] object-cover"
              />
            ) : (
              <div className="flex h-[76px] w-[104px] shrink-0 items-center justify-center rounded-[8px] bg-portrait-placeholder font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                no photo
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-sans text-[13.5px] text-ink">
                {chat.submitter?.full_name ?? chat.submitter?.email} chatted with{" "}
                <span className="font-medium">
                  {chat.partner?.full_name ?? chat.partner?.email}
                </span>
              </span>
              <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                {new Date(chat.submitted_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Input
                value={notes[chat.id] ?? ""}
                placeholder="Optional note if you send it back"
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [chat.id]: event.target.value }))
                }
                className="mt-1 max-w-[320px] py-1.5 text-[12.5px]"
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(chat.id, false)}
                className="rounded-btn px-[13px] py-[8px] font-sans text-[12.5px] text-destructive transition-colors duration-200 ease-brand hover:bg-coral/10 disabled:pointer-events-none disabled:opacity-50"
              >
                Send back
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => decide(chat.id, true)}
                className="rounded-btn bg-ink px-[15px] py-[9px] font-sans text-[12.5px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
