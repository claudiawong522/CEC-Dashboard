// Resolving "which event is running right now" is the one piece of the sign in
// feature with no database in it, so it lives here and is tested directly.
//
// Everything is minutes since the Unix epoch *as read off a wall clock in
// Ithaca*. `events` stores `event_date` (a date) and `event_time` (a time)
// with no zone attached, so the naive `new Date(date + "T" + time)` reads them
// in the server's zone, which is UTC in production and would put the window
// four or five hours off. Comparing wall-clock minutes on both sides sidesteps
// the whole problem without pulling in a timezone library.

export const CLUB_TIME_ZONE = "America/New_York";

// How long a sign in stays open after the start when the event has no end time
// recorded. Generous on purpose: people arrive late, take food, and still have
// to sign in.
const DEFAULT_WINDOW_MINUTES = 180;

// How long after the doors open before food is released, when an event has no
// explicit time set. Startup Hours runs 7:30 to 9:00, so this lands at 8:15:
// far enough in that leaving straight after eating still means having been
// there for the half that matters.
const DEFAULT_FOOD_DELAY_MINUTES = 45;

export type WindowEvent = {
  id: string;
  event_date: string;
  event_time: string;
  event_end_time: string | null;
};

export type FoodEvent = WindowEvent & { food_opens_at: string | null };

export type FoodState =
  | { status: "not_yet"; opensAt: number }
  | { status: "open" }
  | { status: "too_late"; opensAt: number };

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

export function signInWindow(event: WindowEvent): { opensAt: number; closesAt: number } {
  const start = minutesIntoDay(event.event_time);
  const opensAt = dayNumber(event.event_date) * 1440 + start;

  if (!event.event_end_time) return { opensAt, closesAt: opensAt + DEFAULT_WINDOW_MINUTES };

  const end = minutesIntoDay(event.event_end_time);
  // An event whose end reads earlier in the day than its start ran past
  // midnight. All-day events (0004 writes 00:00 to 23:45) are unaffected.
  const spansMidnight = end <= start;

  return { opensAt, closesAt: opensAt + (spansMidnight ? end + 1440 - start : end - start) };
}

/**
 * The event a walk-in is signing in to. Only events already filtered to
 * `has_signin` should be passed in. When two windows overlap, the one that
 * started most recently wins, because that is the room the person is standing
 * in.
 */
export function pickCurrentEvent<T extends WindowEvent>(events: T[], nowMinutes: number): T | null {
  let best: { event: T; opensAt: number } | null = null;

  for (const event of events) {
    const { opensAt, closesAt } = signInWindow(event);
    if (nowMinutes < opensAt || nowMinutes > closesAt) continue;
    if (!best || opensAt > best.opensAt) best = { event, opensAt };
  }

  return best?.event ?? null;
}


/** When food is released, in the same epoch-minute units as everything else. */
export function foodOpensMinutes(event: FoodEvent): number {
  const opens = dayNumber(event.event_date) * 1440;
  if (event.food_opens_at) return opens + minutesIntoDay(event.food_opens_at);
  return opens + minutesIntoDay(event.event_time) + DEFAULT_FOOD_DELAY_MINUTES;
}

/**
 * Whether this person may collect food.
 *
 * The rule is deliberately one comparison: they had to be signed in *before*
 * food opened. A rolling "you must have been here 45 minutes" window sounds
 * fairer but drifts with the clock, so two people standing side by side can get
 * different answers, which is impossible to defend at a food table.
 *
 * `signedInAtMinutes` is null for someone who never signed in tonight.
 */
export function foodState(
  event: FoodEvent,
  signedInAtMinutes: number | null,
  nowMinutes: number,
): FoodState {
  const opensAt = foodOpensMinutes(event);
  if (nowMinutes < opensAt) return { status: "not_yet", opensAt };
  if (signedInAtMinutes === null || signedInAtMinutes > opensAt) {
    return { status: "too_late", opensAt };
  }
  return { status: "open" };
}
