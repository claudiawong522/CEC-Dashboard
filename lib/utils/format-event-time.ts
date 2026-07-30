import { format } from "date-fns";

// "sep 18" — lowercase month abbreviation + day, per design/README.md's Todo/Past Events specs.
export function formatEventDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return format(new Date(y, m - 1, d), "MMM d").toLowerCase();
}

// "5:30p" — no leading zero, single-letter meridiem, per design/CEC Pages.dc.html.
export function formatEventTime(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${mStr}${h < 12 ? "a" : "p"}`;
}
