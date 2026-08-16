"use client";

import { useState } from "react";
import { CheckIcon, ClockIcon, PlusIcon, RotateCcwIcon } from "lucide-react";
import { SubmitChatDialog } from "@/components/coffee-chats/SubmitChatDialog";
import { Sticker } from "@/components/stickers/Sticker";
import { Confetti } from "@/components/stickers/shapes";
import { approvedCount, type BoardSquare, type ChatPerson } from "@/lib/types/coffee-chats";
import { cn } from "@/lib/utils";

export function BingoBoard({
  squares,
  members,
  viewerId,
  selfieUrls,
}: {
  squares: BoardSquare[];
  members: ChatPerson[];
  viewerId: string;
  selfieUrls: Record<string, string>;
}) {
  const [openSquare, setOpenSquare] = useState<BoardSquare | null>(null);

  const done = approvedCount(squares);
  const complete = squares.length > 0 && done === squares.length;

  if (squares.length === 0) {
    return (
      <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
        No board set up for this semester yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[15px]">
      <div className="flex items-center gap-2.5">
        <div className="relative h-[6px] flex-1 overflow-hidden rounded-full bg-line-strong">
          <div
            className="h-full rounded-full transition-[width] duration-[360ms] ease-brand"
            style={{
              width: `${(done / squares.length) * 100}%`,
              background: "linear-gradient(95deg,#E8583D,#E0B94A,#3FA789,#3B6FC2)",
            }}
          />
        </div>
        <span className="relative font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
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

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
                "group relative flex min-h-[132px] flex-col justify-between overflow-hidden rounded-card border p-[15px] text-left transition-[background-color,border-color] duration-200 ease-brand",
                status === "approved"
                  ? "border-transparent"
                  : "border-[rgba(35,32,28,0.07)] bg-paper",
                canSubmit && "hover:border-[rgba(35,32,28,0.14)] hover:bg-wash",
              )}
              style={
                status === "approved"
                  ? {
                      background:
                        "linear-gradient(95deg, rgba(232,88,61,.2), rgba(224,185,74,.2), rgba(63,167,137,.2), rgba(59,111,194,.2))",
                    }
                  : undefined
              }
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
                <span className="font-sans text-[13.5px] font-medium text-ink">
                  {category.name}
                </span>
                {category.description && (
                  <span className="font-sans text-[11.5px] leading-[1.6] text-body">
                    {category.description}
                  </span>
                )}
              </div>

              <div className="relative z-10 flex items-center gap-1.5">
                {status === "approved" && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-strong uppercase">
                    <CheckIcon className="size-3" />
                    {chat?.partner?.full_name ?? "Done"}
                  </span>
                )}
                {status === "pending" && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                    <ClockIcon className="size-3" />
                    Awaiting review
                  </span>
                )}
                {status === "rejected" && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-destructive uppercase">
                    <RotateCcwIcon className="size-3" />
                    Try again
                  </span>
                )}
                {!chat && (
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase transition-colors duration-200 group-hover:text-ink">
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
        viewerId={viewerId}
      />

      {squares.some((square) => square.chat?.status === "rejected") && (
        <span className="font-sans text-[11.5px] text-faint">
          {squares.find((square) => square.chat?.status === "rejected")?.chat?.review_note ??
            "One of your submissions was sent back. Tap it to try again."}
        </span>
      )}
    </div>
  );
}
