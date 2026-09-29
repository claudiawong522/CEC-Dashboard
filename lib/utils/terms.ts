// Academic-term seal for Past Events (design/CEC Pages.dc.html "06 · past events" shows F25/S26).
// There's no stored "term" column, so it's derived from the event date: Aug-Dec is Fall of that
// year, Jan-Jul is Spring of that year (Cornell doesn't run CEC programming in summer, so the
// spring/summer boundary doesn't need its own bucket).
import { wallClockDate } from "@/lib/utils/signin-window";

export type Term = { key: string; season: "Fall" | "Spring"; color: string };

export function getEventTerm(dateStr: string): Term {
  const [y, m] = dateStr.split("-").map(Number);
  const isFall = m >= 8;
  const yy = String(isFall ? y : y).slice(-2);
  return isFall
    ? { key: `F${yy}`, season: "Fall", color: "var(--coral)" }
    : { key: `S${yy}`, season: "Spring", color: "var(--teal)" };
}

// Coffee chats, shoutouts and attendance all store a semester, unlike events
// which derive theirs from a date. They use this same F25/S26 key so one
// person's bingo board, their shoutouts and their attendance all agree on
// which semester they belong to, and so a term seal renders identically
// wherever it appears.
// The date is read off an Ithaca wall clock, not the server's. getMonth() and
// getFullYear() are local to whatever zone the process runs in, which is UTC on
// Vercel, so between 19:00 and midnight on 31 December the server had already
// rolled into January and filed shoutouts, coffee chats and attendance under
// S27 instead of F26. Those rows carry no date to re-derive a term from, so the
// misfile is silent and permanent. Same story each 31 July in reverse.
export function currentTermKey(today: Date = new Date()): string {
  return getEventTerm(wallClockDate(today)).key;
}

export function termFromKey(key: string): Term {
  const season = key.startsWith("F") ? "Fall" : "Spring";
  return {
    key,
    season,
    color: season === "Fall" ? "var(--coral)" : "var(--teal)",
  };
}
