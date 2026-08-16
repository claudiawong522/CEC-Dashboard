"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlarmClockIcon } from "lucide-react";
import { completeRequest, respondToRequest } from "@/lib/actions/matching";
import { REQUEST_STATUS_LABELS, type RequestStatus } from "@/lib/validation/matching-schemas";

export type IncomingRequest = {
  id: string;
  student_email: string;
  student_name: string;
  prompt: string;
  tags: string[];
  status: RequestStatus;
  created_at: string;
  profile_id: string;
  member: { full_name: string | null; email: string } | null;
};

// A request nobody has answered in this many days gets a nudge. Not a
// deadline and not an auto-decline: the point is that a prospective member
// waiting on silence is the worst outcome here, and the member can't see that
// silence without being shown it.
const STALE_AFTER_DAYS = 5;

function daysOld(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000;
}

export function RequestInbox({
  requests,
  isAdmin,
}: {
  requests: IncomingRequest[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function act(fn: () => Promise<{ ok: boolean; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done");
    });
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
        No chat requests. Turn on &ldquo;open to chats&rdquo; on your profile to start getting them.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {requests.map((request) => {
        const stale = request.status === "pending" && daysOld(request.created_at) >= STALE_AFTER_DAYS;
        return (
          <div
            key={request.id}
            className="flex flex-col gap-2.5 rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[15px]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-sans text-[13.5px] font-medium text-ink">
                {request.student_name}
              </span>
              <a
                href={`mailto:${request.student_email}`}
                className="font-sans text-[12px] text-body underline-offset-2 hover:text-ink hover:underline"
              >
                {request.student_email}
              </a>
              {stale && (
                <span className="flex items-center gap-1 font-mono text-[9px] tracking-[0.13em] text-destructive uppercase">
                  <AlarmClockIcon className="size-3" />
                  waiting {Math.floor(daysOld(request.created_at))} days
                </span>
              )}
              <span className="ml-auto font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                {REQUEST_STATUS_LABELS[request.status]}
              </span>
            </div>

            {/* Admins see every member's inbox, so the request has to say who
                it was addressed to or the list is unreadable. */}
            {isAdmin && request.member && (
              <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                for {request.member.full_name ?? request.member.email}
              </span>
            )}

            <p className="font-sans text-[13px] leading-[1.75] text-body">{request.prompt}</p>

            {request.status === "pending" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => act(() => respondToRequest(request.id, "declined"))}
                  className="rounded-btn px-[13px] py-[8px] font-sans text-[12.5px] text-destructive transition-colors duration-200 ease-brand hover:bg-coral/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  Decline
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => act(() => respondToRequest(request.id, "accepted"))}
                  className="rounded-btn bg-ink px-[15px] py-[9px] font-sans text-[12.5px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
            )}

            {request.status === "accepted" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => act(() => completeRequest(request.id))}
                className="w-fit rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink disabled:pointer-events-none disabled:opacity-50"
              >
                We chatted
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
