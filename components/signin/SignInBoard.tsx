"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setEventSignIn } from "@/lib/actions/signin";
import type { SignInBoardRow } from "@/lib/types/signin";

// A host is watching this while standing at the door, so it refreshes itself
// rather than asking them to pull down on a phone every thirty seconds.
const REFRESH_MS = 20_000;

function timeOfDay(iso: string) {
  return new Date(iso)
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/New_York",
    })
    .toLowerCase()
    .replace(" ", "");
}

export function SignInToggle({ eventId, enabled }: { eventId: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // The server value wins whenever the page revalidates, so a toggle flipped in
  // another tab doesn't leave this one showing a stale switch.
  useEffect(() => setOn(enabled), [enabled]);

  return (
    <Switch
      checked={on}
      disabled={isPending}
      onCheckedChange={(checked) => {
        setOn(checked);
        startTransition(async () => {
          const result = await setEventSignIn(eventId, checked);
          if (!result.ok) {
            setOn(!checked);
            toast.error(result.message);
            return;
          }
          router.refresh();
        });
      }}
    />
  );
}

export function SignInBoard({
  event,
  roster,
}: {
  event: { name: string; venue: string } | null;
  roster: SignInBoardRow[];
}) {
  const router = useRouter();

  useEffect(() => {
    if (!event) return;
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [event, router]);

  if (!event) {
    return (
      <div className="flex flex-col gap-[7px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          nothing running
        </span>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          No sign in is open right now. Turn one on for an event below and the QR
          code starts working when that event begins.
        </p>
      </div>
    );
  }

  const newcomers = roster.filter((row) => row.visitNumber === 1).length;

  return (
    <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-[3px]">
          <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
            signed in tonight · {event.venue}
          </span>
          <p className="font-sans text-[19px] leading-[1.3] font-medium tracking-[-0.018em] text-ink">
            {event.name}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[31px] leading-none font-medium tracking-[-0.024em] text-ink">
            {roster.length}
          </span>
          <span className="font-sans text-[12.5px] text-faint">
            {newcomers > 0 ? `${newcomers} first-timer${newcomers === 1 ? "" : "s"}` : "all returning"}
          </span>
        </div>
      </div>

      {roster.length === 0 ? (
        <p className="font-sans text-[13px] text-faint">
          Nobody yet. The list fills in as people scan the code.
        </p>
      ) : (
        <div className="flex flex-col">
          {roster.map((row, i) => (
            <div
              key={row.signinId}
              className={`flex items-start justify-between gap-4 py-2.5 ${
                i < roster.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
              }`}
            >
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="flex items-center gap-2 font-sans text-[13.5px] text-ink">
                  <span className="truncate">{row.fullName}</span>
                  {row.isMember && (
                    <span className="shrink-0 font-mono text-[9px] tracking-[0.1em] text-faint uppercase">
                      member
                    </span>
                  )}
                </span>
                <span className="truncate font-mono text-[10px] tracking-[0.04em] text-faint">
                  {row.email}
                </span>
                {row.wantsToMeet && (
                  <span className="max-w-[52ch] font-sans text-[12.5px] leading-[1.6] text-body">
                    wants to meet: {row.wantsToMeet}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-[2px]">
                <span className="font-mono text-[10px] tracking-[0.06em] text-faint">
                  {timeOfDay(row.signedInAt)}
                </span>
                <span className="font-sans text-[12px] text-body">
                  {row.visitNumber === 1 ? "first visit" : `visit ${row.visitNumber}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
