import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { pickTodaysEvent, wallClockDate } from "@/lib/utils/signin-window";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { AttachSignIns, SignInBoard, SignInToggle } from "@/components/signin/SignInBoard";
import { Sticker } from "@/components/stickers/Sticker";
import { BeadRow } from "@/components/stickers/shapes";
import type { SignInBoardRow, SignInEventRow } from "@/lib/types/signin";

// The other side of /checkin. Never cached: a host watching the door needs the
// count that is true now, not the one from the last build.
export const dynamic = "force-dynamic";

type SigninJoinRow = {
  id: string;
  guest_id: string;
  event_id: string | null;
  answers: Record<string, string> | null;
  source: "qr" | "kiosk";
  signed_in_at: string;
  guest: {
    full_name: string;
    email: string;
    profile_id: string | null;
    linkedin_url: string | null;
    affiliation: string | null;
    background: string | null;
  } | null;
};

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
    .select("id, name, venue, event_date, event_time, event_end_time, has_signin")
    .gte("event_date", shiftDate(today, -1))
    .lte("event_date", shiftDate(today, 14))
    .order("event_date")
    .order("event_time")
    .returns<SignInEventRow[]>();

  const events = nearby ?? [];
  // Resolved exactly the way the public page resolves it, from the same helper
  // and the same date, so the two screens can never disagree about tonight.
  const tonight = pickTodaysEvent(
    events.filter((event) => event.has_signin && event.event_date === today),
  );

  // Today's sign ins, by date rather than by event: the ones that arrived
  // before anybody put the event on the calendar are still tonight's.
  const { data: signins } = await supabase
    .from("guest_signins")
    .select(
      "id, guest_id, event_id, answers, source, signed_in_at, " +
        "guest:guests!guest_signins_guest_id_fkey(" +
        "full_name, email, profile_id, linkedin_url, affiliation, background)",
    )
    .eq("signin_date", today)
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

  // Answers are stored keyed by question id so a question can be reworded
  // without orphaning them, which means the prompts have to be looked up to
  // render. Inactive ones are included: last month's answers still deserve
  // their question.
  const { data: bank } = await supabase
    .from("signin_questions")
    .select("id, prompt")
    .returns<{ id: string; prompt: string }[]>();

  const prompts = new Map((bank ?? []).map((q) => [q.id, q.prompt]));

  const roster: SignInBoardRow[] = rows.map((row) => ({
    signinId: row.id,
    guestId: row.guest_id,
    fullName: row.guest?.full_name ?? "Unknown",
    email: row.guest?.email ?? "",
    linkedinUrl: row.guest?.linkedin_url ?? null,
    affiliation: row.guest?.affiliation ?? null,
    background: row.guest?.background ?? null,
    answers: Object.entries(row.answers ?? {})
      .filter(([, answer]) => !!answer)
      .map(([id, answer]) => ({ prompt: prompts.get(id) ?? "Asked", answer })),
    source: row.source,
    signedInAt: row.signed_in_at,
    visitNumber: visits.get(row.guest_id) ?? 1,
    isMember: !!row.guest?.profile_id,
  }));

  const unattached = rows.filter((row) => !row.event_id).length;
  const upcoming = events.filter((event) => event.event_date >= today);

  return (
    <div className="flex flex-col gap-[23px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-[7px]">
          <h1 className="font-sans text-[27px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Sign ins
          </h1>
          <p className="max-w-[62ch] font-sans text-[13.5px] leading-[1.75] text-body">
            Who walked in today. Anyone can sign in from the QR code, member or
            not, Cornell or not, and food is open to everyone regardless. Member
            attendance still lives on Attendance.
          </p>
        </div>
        <Sticker floatVariant="none" wrapperClassName="hidden shrink-0 sm:block">
          <BeadRow />
        </Sticker>
      </div>

      <SignInBoard
        event={tonight ? { name: tonight.name, venue: tonight.venue } : null}
        roster={roster}
      />

      {/* Somebody forgot to add the event, and people are already signing in.
          The sign ins are safe; this is the one click that files them. */}
      {unattached > 0 && (
        <AttachSignIns
          date={today}
          count={unattached}
          events={upcoming
            .filter((event) => event.event_date === today)
            .map((event) => ({ id: event.id, name: event.name }))}
        />
      )}

      <div className="flex flex-col gap-[11px]">
        <div className="flex flex-col gap-[3px]">
          <p className="font-sans text-[14px] font-medium text-ink">Which events have a sign in</p>
          <p className="font-sans text-[12.5px] text-faint">
            The QR code is permanent and always works. Turning this on is what
            files a day&rsquo;s sign ins under that event.
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
