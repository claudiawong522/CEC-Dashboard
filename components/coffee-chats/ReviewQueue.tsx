"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reviewChat } from "@/lib/actions/coffeeChats";
import { partnerName, type CoffeeChat } from "@/lib/types/coffee-chats";

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
      <p className="border border-line bg-background px-4 py-6 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
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
            className="flex flex-col gap-2.5 border border-line bg-background p-4 shadow-soft sm:flex-row sm:items-center"
          >
            {selfie ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selfie}
                alt={`${chat.submitter?.full_name ?? "Member"} and ${partnerName(chat)}`}
                className="h-[76px] w-[104px] shrink-0 border border-line object-cover"
              />
            ) : (
              <div className="t-eyebrow flex h-[76px] w-[104px] shrink-0 items-center justify-center border border-line bg-muted/40 text-foreground/50">
                no photo
              </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="font-sans text-[13.5px] text-foreground">
                {chat.submitter?.full_name ?? chat.submitter?.email} chatted with{" "}
                <span className="font-medium">
                  {partnerName(chat)}
                </span>
              </span>
              <span className="t-eyebrow text-foreground/50">
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
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => decide(chat.id, false)}
              >
                Send back
              </Button>
              <Button type="button" disabled={isPending} onClick={() => decide(chat.id, true)}>
                Approve
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
