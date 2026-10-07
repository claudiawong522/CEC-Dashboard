"use client";

import { useEffect, useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { attachSignInsToEvent, setEventSignIn } from "@/lib/actions/signin";
import { composition } from "@/lib/utils/signin-copy";
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
  // Optimistic rather than mirrored local state: the switch shows the flip
  // immediately, and React drops back to the server's value when the
  // transition ends. That covers both halves for free, a failed action and a
  // toggle flipped in another tab, with no effect syncing props into state.
  const [on, setOn] = useOptimistic(enabled);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Switch
      checked={on}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          setOn(checked);
          const result = await setEventSignIn(eventId, checked);
          if (!result.ok) {
            toast.error(result.message);
            return;
          }
          router.refresh();
        });
      }}
    />
  );
}

/**
 * People signed in on a day with no event attached, because nobody added it to
 * the calendar before the doors opened. Their sign ins counted anyway; this
 * files them under an event so the night shows up in the history.
 */
export function AttachSignIns({
  date,
  count,
  events,
}: {
  date: string;
  count: number;
  events: { id: string; name: string }[];
}) {
  const [chosen, setChosen] = useState(events[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 border border-amber bg-amber/10 p-5">
      <div className="flex flex-col gap-1">
        <span className="t-eyebrow text-foreground/50">
          not filed yet
        </span>
        <p className="font-display text-[15px] font-bold text-foreground">
          {count} sign in{count === 1 ? "" : "s"} today with no event attached
        </p>
        <p className="max-w-[62ch] font-sans text-[12.5px] leading-[1.7] text-subtle">
          {events.length
            ? "They counted, and everyone got their tick. Attach them to today's event so the night reads properly in the history."
            : "They counted, and everyone got their tick. Add today's event to the calendar, turn its sign in on, and this will offer to file them."}
        </p>
      </div>

      {events.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={chosen}
            onChange={(e) => setChosen(e.target.value)}
            className="border border-line bg-background px-3 py-2 font-sans text-[13px] text-foreground outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
          >
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
          <Button
            type="button"
            loading={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await attachSignInsToEvent(date, chosen);
                if (!result.ok) {
                  toast.error(result.message);
                  return;
                }
                toast.success("Filed under tonight's event");
                router.refresh();
              });
            }}
            className="px-4 py-2 text-[13px]"
          >
            Attach
          </Button>
        </div>
      )}
    </div>
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
    const timer = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  const newcomers = roster.filter((row) => row.visitNumber === 1).length;
  // Worth calling out by name at the end of the night, which is the point of
  // tracking visits at all.
  const milestones = roster.filter((row) => [3, 5, 10, 15, 20, 25, 30].includes(row.visitNumber));

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="t-eyebrow text-foreground/50">
            signed in today{event ? ` · ${event.venue}` : ""}
          </span>
          <p className="font-display text-[18px] font-bold text-foreground">
            {event ? event.name : "No event on the calendar"}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="t-display text-[32px] text-foreground">
            {roster.length}
          </span>
          <span className="font-sans text-[12.5px] text-foreground/50">
            {composition(roster.length, newcomers)}
          </span>
        </div>
      </div>

      {milestones.length > 0 && (
        <p className="font-sans text-[12.5px] leading-[1.7] text-subtle">
          Worth a shout-out:{" "}
          {milestones
            .map((row) => `${row.fullName.split(" ")[0]} (${row.visitNumber})`)
            .join(", ")}
        </p>
      )}

      {roster.length === 0 ? (
        <p className="font-sans text-[13px] text-foreground/50">
          Nobody yet. The list fills in as people scan the code.
        </p>
      ) : (
        <div className="flex flex-col">
          {roster.map((row, i) => (
            <div
              key={row.signinId}
              className={`flex items-start justify-between gap-4 py-2.5 ${
                i < roster.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="flex items-center gap-2 font-sans text-[13.5px] text-foreground">
                  <span className="truncate">{row.fullName}</span>
                  {row.isMember && (
                    <span className="t-eyebrow shrink-0 border border-line px-2 py-0.5 text-foreground/50">
                      member
                    </span>
                  )}
                </span>
                <span className="truncate font-sans text-[12px] text-foreground/50">
                  {row.email}
                </span>
                {/* The standing facts, which is the point of the sign in
                    asking for them. A host scanning this list wants to know
                    who is in the room, not to go and look everyone up. */}
                {(row.affiliation || row.linkedinUrl) && (
                  <span className="flex flex-wrap items-baseline gap-x-2 gap-y-[2px] font-sans text-[12.5px] leading-[1.6] text-subtle">
                    {row.affiliation && <span>{row.affiliation}</span>}
                    {row.linkedinUrl && (
                      <a
                        href={row.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="t-eyebrow link-underline text-foreground/50 transition-colors duration-200 hover:text-foreground"
                      >
                        linkedin
                      </a>
                    )}
                  </span>
                )}
                {row.background && (
                  <span className="max-w-[52ch] font-sans text-[12.5px] leading-[1.6] text-subtle">
                    {row.background}
                  </span>
                )}
                {row.answers.map((answer) => (
                  <span
                    key={answer.prompt}
                    className="max-w-[52ch] font-sans text-[12.5px] leading-[1.6] text-subtle"
                  >
                    <span className="text-foreground/50">{answer.prompt}</span> {answer.answer}
                  </span>
                ))}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-[2px]">
                <span className="t-eyebrow text-foreground/50">
                  {timeOfDay(row.signedInAt)}
                </span>
                <span className="font-sans text-[12px] text-subtle">
                  {row.visitNumber === 1 ? "first visit" : `visit ${row.visitNumber}`}
                </span>
                {row.source === "kiosk" && (
                  <span className="t-eyebrow text-foreground/50">
                    kiosk
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
