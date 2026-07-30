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
