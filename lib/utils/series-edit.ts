// Carrying an edit to one occurrence of a recurring series onto the rest.
//
// Occurrences are separate `events` rows sharing a recurring_series_id. Their
// event_date / event_time are wall-clock values in Ithaca with no zone
// attached (see signin-window.ts), so a time change is applied as the same
// change on the clock, not as a fixed number of UTC hours: moving 6pm to
// 7:30pm in October makes every later occurrence 7:30pm too, on either side
// of a daylight saving switch.
//
// Only the edited occurrence and later ones change, and of those only the
// ones still ahead of today. Past nights, with their check-ins and prep, are
// never rewritten.

export type SeriesOccurrence = {
  id: string;
  name: string;
  event_date: string;
  event_end_date: string;
  all_day: boolean;
  event_time: string;
  event_end_time: string | null;
};

export type OccurrencePatch = Partial<Omit<SeriesOccurrence, "id">>;

const MINUTES_PER_DAY = 1440;

function dayNumber(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

function minutesIntoDay(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function wallClockMinutes(date: string, time: string): number {
  return dayNumber(date) * MINUTES_PER_DAY + minutesIntoDay(time);
}

function fromWallClockMinutes(total: number): { date: string; time: string } {
  const day = Math.floor(total / MINUTES_PER_DAY);
  const minutes = total - day * MINUTES_PER_DAY;
  const date = new Date(day * 86_400_000).toISOString().slice(0, 10);
  const time = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  return { date, time };
}

/** A wall-clock date and time moved by `minutes` on the clock, rolling over midnight. */
export function shiftWallClock(date: string, time: string, minutes: number) {
  return fromWallClockMinutes(wallClockMinutes(date, time) + minutes);
}

const hhmm = (time: string | null) => (time === null ? null : time.slice(0, 5));

/**
 * The row updates that carry `before -> after` (one occurrence's edit) onto
 * the rest of its series: later occurrences that have not happened yet.
 * Each gets the new name, and its own start and end moved by the same
 * wall-clock change, so an occurrence that was set apart keeps its offset.
 * Switching all day on or off gives every later one the edited times.
 */
export function seriesEditUpdates(
  before: SeriesOccurrence,
  after: Omit<SeriesOccurrence, "id">,
  occurrences: SeriesOccurrence[],
  today: string,
): { id: string; patch: OccurrencePatch }[] {
  const startDelta =
    wallClockMinutes(after.event_date, after.event_time) - wallClockMinutes(before.event_date, before.event_time);
  const endDelta =
    before.event_end_time !== null && after.event_end_time !== null
      ? wallClockMinutes(after.event_end_date, after.event_end_time) -
        wallClockMinutes(before.event_end_date, before.event_end_time)
      : (dayNumber(after.event_end_date) - dayNumber(before.event_end_date)) * MINUTES_PER_DAY;
  const dayDelta = dayNumber(after.event_date) - dayNumber(before.event_date);
  const allDayChanged = after.all_day !== before.all_day;

  const updates: { id: string; patch: OccurrencePatch }[] = [];
  for (const o of occurrences) {
    if (o.id === before.id || o.event_date < before.event_date || o.event_date <= today) continue;

    const next: Omit<SeriesOccurrence, "id"> = { ...o, name: after.name, all_day: after.all_day };
    if (allDayChanged) {
      next.event_date = shiftWallClock(o.event_date, "00:00", dayDelta * MINUTES_PER_DAY).date;
      next.event_end_date = shiftWallClock(o.event_end_date, "00:00", dayDelta * MINUTES_PER_DAY).date;
      next.event_time = after.event_time;
      next.event_end_time = after.event_end_time;
    } else {
      const start = shiftWallClock(o.event_date, o.event_time, startDelta);
      next.event_date = start.date;
      next.event_time = start.time;
      if (o.event_end_time !== null) {
        const end = shiftWallClock(o.event_end_date, o.event_end_time, endDelta);
        next.event_end_date = end.date;
        next.event_end_time = end.time;
      } else {
        next.event_end_date = shiftWallClock(o.event_end_date, "00:00", dayDelta * MINUTES_PER_DAY).date;
      }
    }

    const patch: OccurrencePatch = {};
    if (next.name !== o.name) patch.name = next.name;
    if (next.event_date !== o.event_date) patch.event_date = next.event_date;
    if (next.event_end_date !== o.event_end_date) patch.event_end_date = next.event_end_date;
    if (next.all_day !== o.all_day) patch.all_day = next.all_day;
    if (hhmm(next.event_time) !== hhmm(o.event_time)) patch.event_time = hhmm(next.event_time)!;
    if (hhmm(next.event_end_time) !== hhmm(o.event_end_time)) patch.event_end_time = hhmm(next.event_end_time);
    if (Object.keys(patch).length) updates.push({ id: o.id, patch });
  }
  return updates;
}
