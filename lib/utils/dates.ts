// Date-only strings ("YYYY-MM-DD") and the Ithaca calendar.
//
// `new Date("2026-10-11")` is UTC midnight, which is the evening of the 10th
// anywhere west of Greenwich, and `toLocaleDateString()` without a timeZone
// renders in whichever zone the server or browser happens to be in, so the
// two halves of a server-rendered page can disagree. Everything here pins the
// club's own zone instead.
import { CLUB_TIME_ZONE, wallClockDate, wallClockNow } from "@/lib/utils/signin-window";

export { CLUB_TIME_ZONE };

/** Today's date in Ithaca, as "YYYY-MM-DD". */
export function clubToday(now: Date = new Date()): string {
  return wallClockDate(now);
}

/** A date-only string moved by whole calendar days. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function dayDiff(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** Moving an event to `newDate` keeps its span: the end moves by the same number of days. */
export function rescheduledRange(eventDate: string, eventEndDate: string, newDate: string) {
  return {
    event_date: newDate,
    event_end_date: shiftDate(eventEndDate, dayDiff(eventDate, newDate)),
  };
}

/**
 * The instant for noon in Ithaca on a calendar date. Used when a date-only
 * field is stored in a timestamptz column: noon keeps the same calendar day
 * for any reader between UTC-11 and UTC+11, and exactly the right day for
 * anything formatted in the club's zone.
 */
export function clubDateToInstant(date: string): string {
  const guess = Date.parse(`${date}T12:00:00Z`);
  const offsetMinutes = wallClockNow(new Date(guess)) - Math.floor(guess / 60_000);
  return new Date(guess - offsetMinutes * 60_000).toISOString();
}

/** Formats an instant on the Ithaca calendar, identically on server and client. */
export function formatClubDate(
  value: string | Date,
  options: Intl.DateTimeFormatOptions,
  locale: string = "en-US",
): string {
  return new Date(value).toLocaleDateString(locale, { ...options, timeZone: CLUB_TIME_ZONE });
}
