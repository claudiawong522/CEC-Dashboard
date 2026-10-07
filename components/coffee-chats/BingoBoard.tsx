"use client";

import { useState } from "react";
import { CheckIcon, ClockIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { partnerName } from "@/lib/types/coffee-chats";
import { SubmitChatDialog } from "@/components/coffee-chats/SubmitChatDialog";
import { Sticker } from "@/components/decor/Sticker";
import { Confetti } from "@/components/decor/shapes";
import { approvedCount, type BoardSquare, type ChatPerson } from "@/lib/types/coffee-chats";
import { cn } from "@/lib/utils";

export function BingoBoard({
  squares,
  members,
  claimedGuests,
  viewerId,
  selfieUrls,
}: {
  squares: BoardSquare[];
  members: ChatPerson[];
  claimedGuests: ChatPerson[];
  viewerId: string;
  selfieUrls: Record<string, string>;
}) {
  const [openSquare, setOpenSquare] = useState<BoardSquare | null>(null);

  const done = approvedCount(squares);
  const complete = squares.length > 0 && done === squares.length;

  if (squares.length === 0) {
    return (
      <p className="border border-line bg-background px-4 py-8 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
        No board set up for this semester yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="relative h-[6px] flex-1 overflow-hidden bg-muted">
          <div
            className="h-full bg-mint transition-[width] duration-[360ms] ease-fluid"
            style={{ width: `${(done / squares.length) * 100}%` }}
          />
        </div>
        <span className="t-eyebrow relative text-foreground/50">
          {done} of {squares.length} done
          {complete && (
            <Sticker
              floatVariant="none"
              wrapperClassName="pointer-events-none absolute -top-5 -right-3"
              className="pointer-events-auto"
            >
              <Confetti size={54} />
            </Sticker>
          )}
        </span>
      </div>

      {/* The board itself: a 2px black frame around square tiles. */}
      <div className="grid gap-2.5 border-2 border-foreground bg-background p-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {squares.map(({ category, chat }) => {
          const status = chat?.status;
          const selfie = chat ? selfieUrls[chat.selfie_url] : undefined;
          // A rejected square is offered again: the point is to fill it, and
          // "needs another go" with no way to have another go would be a
          // dead tile for the rest of the semester.
          const canSubmit = !chat || status === "rejected";

          return (
            <button
              key={category.id}
              type="button"
              disabled={!canSubmit}
              onClick={() => setOpenSquare({ category, chat })}
              className={cn(
                "group relative flex min-h-[132px] flex-col justify-between overflow-hidden border p-4 text-left transition-[background-color,border-color,box-shadow] duration-200 ease-fluid",
                status === "approved"
                  ? "border-foreground bg-mint"
                  : "border-line bg-background",
                canSubmit && "hover:border-foreground hover:shadow-mint-sm",
              )}
            >
              {selfie && status === "approved" && (
                // The selfie sits behind the label at low opacity rather than
                // replacing it: the tile still has to be readable at a glance
                // when the board is full.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selfie}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 size-full object-cover opacity-25"
                />
              )}

              <div className="relative z-10 flex flex-col gap-1">
                <span className="font-display text-[14px] font-bold text-foreground">
                  {category.name}
                </span>
                {category.description && (
                  <span className="font-sans text-[11.5px] leading-[1.6] text-subtle">
                    {category.description}
                  </span>
                )}
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                {status === "approved" && (
                  <span className="t-eyebrow flex items-center gap-1.5 text-foreground">
                    <CheckIcon className="size-3" />
                    {chat ? partnerName(chat) : "Done"}
                  </span>
                )}
                {status === "pending" && (
                  <span className="t-eyebrow flex items-center gap-1.5 text-foreground/50">
                    <ClockIcon className="size-3" />
                    Awaiting review
                  </span>
                )}
                {status === "rejected" && (
                  <span className="t-eyebrow flex items-center gap-1.5 text-red">
                    <RotateCcwIcon className="size-3" />
                    Try again
                  </span>
                )}
                {!chat && (
                  <span className="t-eyebrow flex items-center gap-1.5 text-foreground/50 transition-colors duration-200 group-hover:text-foreground">
                    <PlusIcon className="size-3" />
                    Fill this in
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* One dialog for the whole board rather than one per tile — the file
          input and its object URL only need to exist for the square actually
          being filled. */}
      <SubmitChatDialog
        open={openSquare !== null}
        onOpenChange={(open) => !open && setOpenSquare(null)}
        categoryId={openSquare?.category.id ?? null}
        categoryName={openSquare?.category.name ?? ""}
        members={members}
        claimedGuests={claimedGuests}
        viewerId={viewerId}
      />

      {squares.some((square) => square.chat?.status === "rejected") && (
        <span className="font-sans text-[11.5px] text-foreground/50">
          {squares.find((square) => square.chat?.status === "rejected")?.chat?.review_note ??
            "One of your submissions was sent back. Tap it to try again."}
        </span>
      )}
    </div>
  );
}
