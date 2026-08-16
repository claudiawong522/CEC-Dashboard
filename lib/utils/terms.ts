// Academic-term seal for Past Events (design/CEC Pages.dc.html "06 · past events" shows F25/S26).
// There's no stored "term" column, so it's derived from the event date: Aug-Dec is Fall of that
// year, Jan-Jul is Spring of that year (Cornell doesn't run CEC programming in summer, so the
// spring/summer boundary doesn't need its own bucket).
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
export function currentTermKey(today: Date = new Date()): string {
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  return getEventTerm(dateStr).key;
}

export function termFromKey(key: string): Term {
  const season = key.startsWith("F") ? "Fall" : "Spring";
  return {
    key,
    season,
    color: season === "Fall" ? "var(--coral)" : "var(--teal)",
  };
}
