"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { claimChatRequest, declineChatRequest, releaseChatRequest } from "@/lib/actions/chatRequests";
import { labelForTag, onlyKnownTags } from "@/lib/utils/interests";
import type { RankedRequest } from "@/lib/utils/chat-matching";
import type { ClaimedRequest, OpenRequest } from "@/lib/types/chat-requests";

function waitedFor(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function Tag({ tag, matched }: { tag: string; matched: boolean }) {
  return (
    <span
      className={`rounded-[20px] border px-[9px] py-[3px] font-sans text-[11px] ${
        matched
          ? "border-transparent bg-teal/[0.14] text-ink"
          : "border-line-input bg-page text-faint"
      }`}
    >
      {labelForTag(tag)}
    </span>
  );
}

export function RequestPool({
  ranked,
  claimed,
  myInterests,
  canClaim,
  isAdmin,
}: {
  ranked: RankedRequest<OpenRequest>[];
  claimed: ClaimedRequest[];
  myInterests: string[];
  canClaim: boolean;
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message);
        // A failed claim almost always means somebody else took it, so the
        // list on screen is already wrong.
        router.refresh();
        return;
      }
      if (result.message) toast.success(result.message);
      router.refresh();
    });
  }

  const tuned = onlyKnownTags(myInterests).length > 0;

  return (
    <div className="flex flex-col gap-[23px]">
      <div className="flex flex-col gap-[7px]">
        <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Chat requests
        </h1>
        <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
          Prospective members who asked to talk, closest to your own interests
          first. Take whichever you like the look of and email them.
        </p>
      </div>

      {!tuned && (
        <p className="rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper px-[15px] py-3 font-sans text-[12.5px] leading-[1.7] text-body">
          You haven&rsquo;t picked any interests on your profile yet, so this list
          isn&rsquo;t sorted for you. Add a few and the ones you&rsquo;d enjoy
          most rise to the top.
        </p>
      )}

      <div className="flex flex-col gap-[11px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          waiting · {ranked.length}
        </span>

        {ranked.length === 0 ? (
          <p className="rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper px-[15px] py-4 font-sans text-[13px] text-faint">
            Nobody waiting right now.
          </p>
        ) : (
          <div className="flex flex-col gap-[9px]">
            {ranked.map(({ request, score, shared }) => {
              const matched = new Set<string>(shared);
              return (
                <div
                  key={request.id}
                  className="flex flex-col gap-[9px] rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper p-[15px]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-sans text-[15px] font-medium text-ink">
                        {request.full_name}
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.06em] text-faint">
                        {request.netid}@cornell.edu
                      </span>
                    </div>
                    <span className="font-sans text-[12px] text-faint">
                      {score > 0
                        ? `${score} shared interest${score === 1 ? "" : "s"}`
                        : "no shared interests"}
                      {" · waited "}
                      {waitedFor(request.created_at)}
                      {request.visit_count > 0 &&
                        ` · ${request.visit_count} event${request.visit_count === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  <p className="max-w-[70ch] font-sans text-[13.5px] leading-[1.7] text-body">
                    {request.prompt}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {request.interests.map((tag) => (
                      <Tag key={tag} tag={tag} matched={matched.has(tag)} />
                    ))}
                  </div>

                  <div className="flex items-center gap-[11px]">
                    <Button
                      type="button"
                      disabled={isPending || !canClaim}
                      onClick={() => run(() => claimChatRequest(request.id))}
                      className="px-[18px] py-2 text-[13px]"
                    >
                      Claim
                    </Button>
                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => declineChatRequest(request.id))}
                        className="font-sans text-[12.5px] text-faint transition-colors duration-200 hover:text-destructive"
                      >
                        Decline
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {claimed.length > 0 && (
        <div className="flex flex-col gap-[11px]">
          <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            taken · {claimed.length}
          </span>
          <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper">
            {claimed.map((request, i) => (
              <div
                key={request.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-[15px] py-3 ${
                  i < claimed.length - 1 ? "border-b border-[rgba(0,0,0,0.07)]" : ""
                }`}
              >
                <div className="flex min-w-0 flex-col gap-[2px]">
                  <span className="font-sans text-[13.5px] text-ink">{request.full_name}</span>
                  <span className="font-mono text-[10px] tracking-[0.06em] text-faint">
                    {request.netid}@cornell.edu · with{" "}
                    {request.is_mine ? "you" : (request.claimed_by_name ?? "a member")}
                  </span>
                </div>
                {request.is_mine && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => releaseChatRequest(request.id))}
                    className="font-sans text-[12px] text-faint transition-colors duration-200 hover:text-ink"
                  >
                    Put back
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
