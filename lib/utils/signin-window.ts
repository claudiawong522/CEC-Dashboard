// Which event a scan belongs to, and what the confirmation screen says back.
// The one part of the sign in with no database in it, so it lives here and is
// tested directly.
//
// The unit is the calendar day in Ithaca. `events` stores `event_date` (a
// date) and `event_time` (a time) with no zone attached, and the server runs
// in UTC in production, so anything that reads a clock has to say which clock.
// Everything below that touches time is minutes since the Unix epoch *as read
// off a wall clock in Ithaca*.

export const CLUB_TIME_ZONE = "America/New_York";

export type DayEvent = {
  id: string;
  event_date: string;
  event_time: string;
};

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function dayNumber(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

function minutesIntoDay(timeStr: string): number {
  const [h, min] = timeStr.split(":").map(Number);
  return h * 60 + min;
}

/** Minutes since the epoch, read off a wall clock in `timeZone`. */
export function wallClockNow(now: Date = new Date(), timeZone: string = CLUB_TIME_ZONE): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  // Some runtimes render midnight as "24" rather than "00" under hour12: false.
  const hour = Number(get("hour")) % 24;

  return (
    dayNumber(`${get("year")}-${get("month")}-${get("day")}`) * 1440 + hour * 60 + Number(get("minute"))
  );
}

/** The local date in `timeZone`, as "YYYY-MM-DD". */
export function wallClockDate(now: Date = new Date(), timeZone: string = CLUB_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The event a walk-in is signing in to: one of today's, with no window around
 * it. A scan at 4pm for a one-off afternoon session finds the session, and a
 * scan at 7:29 for a 7:30 start finds it too, because a poster that says
 * "nothing on" while people are queuing at the door is the worse failure.
 *
 * Only events already filtered to `has_signin` and to today should be passed
 * in. Two on the same day is the only case needing a rule: the one that has
 * already started wins, and before any of them start, the first.
 */
export function pickTodaysEvent<T extends DayEvent>(
  events: T[],
  nowMinutes: number = wallClockNow(),
): T | null {
  if (events.length === 0) return null;

  const byStart = [...events].sort(
    (a, b) => minutesIntoDay(a.event_time) - minutesIntoDay(b.event_time),
  );

  let started: T | null = null;
  for (const event of byStart) {
    const startsAt = dayNumber(event.event_date) * 1440 + minutesIntoDay(event.event_time);
    if (startsAt <= nowMinutes) started = event;
  }

  return started ?? byStart[0];
}
