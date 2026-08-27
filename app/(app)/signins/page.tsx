import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import {
  foodOpensMinutes,
  pickCurrentEvent,
  wallClockDate,
  wallClockNow,
} from "@/lib/utils/signin-window";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { SignInBoard, SignInToggle } from "@/components/signin/SignInBoard";
import { Sticker } from "@/components/stickers/Sticker";
import { BeadRow } from "@/components/stickers/shapes";
import type { SignInBoardRow, SignInEventRow } from "@/lib/types/signin";

// The other side of /checkin. Never cached: a host watching the door needs the
// count that is true now, not the one from the last build.
export const dynamic = "force-dynamic";

type SigninJoinRow = {
  id: string;
  guest_id: string;
  wants_to_meet: string | null;
  source: "qr" | "kiosk";
  signed_in_at: string;
  food_claimed_at: string | null;
  food_claimed_by: string | null;
  guest: { full_name: string; email: string; profile_id: string | null } | null;
};

/** "8:15pm" from epoch minutes, for the header. */
function minutesToClock(minutes: number): string {
  const intoDay = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(intoDay / 60);
  const m = intoDay % 60;
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
}

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export default async function SignInsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Same rule as /attendance: a view-only account reads the club, it doesn't
  // work the door.
  if (session.profile.role === "view") redirect("/calendar");

  const supabase = await createClient();
  const today = wallClockDate();

  const { data: nearby } = await supabase
    .from("events")
    .select("id, name, venue, event_date, event_time, event_end_time, food_opens_at, has_signin")
    .gte("event_date", shiftDate(today, -1))
    .lte("event_date", shiftDate(today, 14))
    .order("event_date")
    .order("event_time")
    .returns<SignInEventRow[]>();

  const events = nearby ?? [];
  // Resolved exactly the way the public page resolves it, from the same clock
  // and the same helper, so the two screens can never disagree about which
  // event is running.
  const tonight = pickCurrentEvent(
    events.filter((event) => event.has_signin),
    wallClockNow(),
  );

  let roster: SignInBoardRow[] = [];

  if (tonight) {
    const { data: signins } = await supabase
      .from("guest_signins")
      .select(
        "id, guest_id, wants_to_meet, source, signed_in_at, food_claimed_at, food_claimed_by, " +
          "guest:guests!guest_signins_guest_id_fkey(full_name, email, profile_id)",
      )
      .eq("event_id", tonight.id)
      .order("signed_in_at", { ascending: false })
      .returns<SigninJoinRow[]>();

    const rows = signins ?? [];
    const guestIds = rows.map((row) => row.guest_id);

    // "This is their fourth visit" is the single most useful thing on this
    // screen, and it is one extra query rather than a count per row.
    const { data: history } = guestIds.length
      ? await supabase
          .from("guest_signins")
          .select("guest_id")
          .in("guest_id", guestIds)
          .returns<{ guest_id: string }[]>()
      : { data: [] as { guest_id: string }[] };

    const visits = new Map<string, number>();
    for (const row of history ?? []) {
      visits.set(row.guest_id, (visits.get(row.guest_id) ?? 0) + 1);
    }

    roster = rows.map((row) => ({
      signinId: row.id,
      guestId: row.guest_id,
      fullName: row.guest?.full_name ?? "Unknown",
      email: row.guest?.email ?? "",
      wantsToMeet: row.wants_to_meet,
      source: row.source,
      signedInAt: row.signed_in_at,
      visitNumber: visits.get(row.guest_id) ?? 1,
      isMember: !!row.guest?.profile_id,
      foodClaimedAt: row.food_claimed_at,
      foodClaimedByHost: !!row.food_claimed_by,
    }));
  }

  const upcoming = events.filter((event) => event.event_date >= today);

  return (
    <div className="flex flex-col gap-[23px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Sign ins
          </h1>
          <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
            Who walked in tonight. Anyone can sign in from the QR code, member or
            not, Cornell or not. Member attendance still lives on Attendance.
          </p>
        </div>
        <Sticker floatVariant="none" wrapperClassName="hidden shrink-0 sm:block">
          <BeadRow />
        </Sticker>
      </div>

      <SignInBoard
        event={
          tonight
            ? {
                name: tonight.name,
                venue: tonight.venue,
                foodOpensAt: minutesToClock(foodOpensMinutes(tonight)),
                foodIsOpen: wallClockNow() >= foodOpensMinutes(tonight),
              }
            : null
        }
        roster={roster}
      />

      <div className="flex flex-col gap-[11px]">
        <div className="flex flex-col gap-[3px]">
          <p className="font-sans text-[14px] font-medium text-ink">Which events have a sign in</p>
          <p className="font-sans text-[12.5px] text-faint">
            The QR code is permanent. It resolves whichever of these is running
            when someone scans it, so a poster never needs reprinting.
          </p>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          {upcoming.length === 0 && (
            <p className="px-[15px] py-4 font-sans text-[13px] text-faint">
              Nothing on the calendar for the next fortnight.
            </p>
          )}
          {upcoming.map((event, i) => (
            <div
              key={event.id}
              className={`flex items-center justify-between gap-4 px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
                i < upcoming.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
              }`}
            >
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="truncate font-sans text-[13.5px] text-ink">{event.name}</span>
                <span className="font-mono text-[10px] tracking-[0.06em] text-faint">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)} ·{" "}
                  {event.venue}
                </span>
              </div>
              <SignInToggle eventId={event.id} enabled={event.has_signin} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
