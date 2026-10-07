"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";
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
      className={`t-eyebrow border px-2 py-0.5 ${
        matched
          ? "border-foreground bg-mint text-foreground"
          : "border-line bg-background text-foreground/50"
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
    <div className="relative flex flex-col gap-6">
      <TriangleScatter count={5} seed={131} opacity={0.2} />

      <PageHeader className="relative z-10" title="Chat requests">
        Prospective members who asked to talk, closest to your own interests
        first. Take whichever you like the look of and email them.
      </PageHeader>

      <div className="relative z-10 flex flex-col gap-6">

      {!tuned && (
        <p className="border border-line bg-muted/40 px-4 py-3 font-sans text-[12.5px] leading-[1.7] text-subtle">
          You haven&rsquo;t picked any interests on your profile yet, so this list
          isn&rsquo;t sorted for you. Add a few and the ones you&rsquo;d enjoy
          most rise to the top.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <span className="t-eyebrow text-foreground/50">
          waiting · {ranked.length}
        </span>

        {ranked.length === 0 ? (
          <p className="border border-line bg-background px-4 shadow-soft py-4 font-sans text-[13px] text-foreground/50">
            Nobody waiting right now.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {ranked.map(({ request, score, shared }) => {
              const matched = new Set<string>(shared);
              return (
                <div
                  key={request.id}
                  className="flex flex-col gap-2.5 border border-line bg-background p-4 shadow-soft transition-[border-color] duration-200 ease-fluid hover:border-foreground"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-[15px] font-bold text-foreground">
                        {request.full_name}
                      </span>
                      <span className="font-sans text-[12px] text-foreground/50">
                        {request.netid}@cornell.edu
                      </span>
                    </div>
                    <span className="font-sans text-[12px] text-foreground/50">
                      {score > 0
                        ? `${score} shared interest${score === 1 ? "" : "s"}`
                        : "no shared interests"}
                      {" · waited "}
                      {waitedFor(request.created_at)}
                      {request.visit_count > 0 &&
                        ` · ${request.visit_count} event${request.visit_count === 1 ? "" : "s"}`}
                    </span>
                  </div>

                  <p className="max-w-[70ch] font-sans text-[13.5px] leading-[1.7] text-subtle">
                    {request.prompt}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {request.interests.map((tag) => (
                      <Tag key={tag} tag={tag} matched={matched.has(tag)} />
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      disabled={isPending || !canClaim}
                      onClick={() => run(() => claimChatRequest(request.id))}
                    >
                      Claim
                    </Button>
                    {isAdmin && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => run(() => declineChatRequest(request.id))}
                        className="link-underline font-sans text-[12.5px] text-foreground/50 transition-colors duration-200 hover:text-red"
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
        <div className="flex flex-col gap-3">
          <span className="t-eyebrow text-foreground/50">
            taken · {claimed.length}
          </span>
          <div className="overflow-hidden border border-line bg-background shadow-soft">
            {claimed.map((request, i) => (
              <div
                key={request.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
                  i < claimed.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <div className="flex min-w-0 flex-col gap-[2px]">
                  <span className="font-sans text-[13.5px] text-foreground">{request.full_name}</span>
                  <span className="font-sans text-[12px] text-foreground/50">
                    {request.netid}@cornell.edu · with{" "}
                    {request.is_mine ? "you" : (request.claimed_by_name ?? "a member")}
                  </span>
                </div>
                {request.is_mine && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => releaseChatRequest(request.id))}
                    className="link-underline font-sans text-[12px] text-foreground/50 transition-colors duration-200 hover:text-foreground"
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
    </div>
  );
}
